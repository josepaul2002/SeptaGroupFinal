import { useState } from 'react';
import { LogOut, Lock, AlertCircle, Loader2, MessageSquare, Folder, Users, FileText, Settings, History, LayoutDashboard } from 'lucide-react';
import { useAdminAuth } from '../hooks/useApi';
import LeadsTab from '../components/admin/LeadsTab';
import ProjectsTab from '../components/admin/ProjectsTab';
import PartnersTab from '../components/admin/PartnersTab';
import TestimonialsTab from '../components/admin/TestimonialsTab';
import SettingsTab from '../components/admin/SettingsTab';
import AuditLogTab from '../components/admin/AuditLogTab';
import PageContentTab from '../components/admin/PageContentTab';

const TABS = [
  { id: 'leads', label: 'Leads', icon: MessageSquare },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'partners', label: 'Partners', icon: Users },
  { id: 'pages', label: 'Pages', icon: LayoutDashboard },
  { id: 'testimonials', label: 'Testimonials', icon: FileText },
  { id: 'audit', label: 'Audit Log', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminPage() {
  const { token, admin, loading: authLoading, login, logout, isAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(loginForm.email, loginForm.password);
    } catch {
      setLoginError('Invalid credentials');
    }
    setLoginLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex items-center justify-center pt-16">
        <Loader2 className="animate-spin text-[#606060]" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex items-center justify-center pt-16" data-testid="admin-login-page">
        <div className="w-full max-w-sm p-8 bg-white border border-[#8A8A8A]/20">
          <div className="flex items-center gap-3 mb-8">
            <Lock size={18} className="text-[#606060]" />
            <h1 className="text-xl font-sora font-medium text-[#050505]">Admin Login</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Email</label>
              <input type="email" required className="w-full h-10 px-3 text-sm font-inter border border-[#8A8A8A]/30 bg-transparent text-[#050505] outline-none focus:border-[#606060] transition-colors"
                value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} data-testid="admin-email-input" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Password</label>
              <input type="password" required className="w-full h-10 px-3 text-sm font-inter border border-[#8A8A8A]/30 bg-transparent text-[#050505] outline-none focus:border-[#606060] transition-colors"
                value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} data-testid="admin-password-input" />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-red-500 text-sm" data-testid="admin-login-error">
                <AlertCircle size={14} />{loginError}
              </div>
            )}
            <button type="submit" disabled={loginLoading} data-testid="admin-login-btn"
              className="w-full h-11 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#262626] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loginLoading ? <Loader2 className="animate-spin" size={16} /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] pt-16" data-testid="admin-dashboard">
      <div className="bg-white border-b border-[#8A8A8A]/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-sora font-medium text-[#050505]">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs font-inter text-[#8A8A8A]">{admin?.email}</span>
            <button onClick={logout} className="flex items-center gap-2 text-xs font-inter text-red-500 hover:text-red-600 transition-colors" data-testid="admin-logout-btn">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`tab-${tab.id}`}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-inter rounded transition-colors ${
                    activeTab === tab.id ? 'bg-[#050505] text-white' : 'text-[#050505]/70 hover:bg-[#050505]/10'
                  }`}>
                  <tab.icon size={16} />{tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === 'leads' && <LeadsTab token={token} />}
            {activeTab === 'projects' && <ProjectsTab token={token} />}
            {activeTab === 'partners' && <PartnersTab token={token} />}
            {activeTab === 'pages' && <PageContentTab token={token} />}
            {activeTab === 'testimonials' && <TestimonialsTab token={token} />}
            {activeTab === 'audit' && <AuditLogTab token={token} />}
            {activeTab === 'settings' && <SettingsTab token={token} />}
          </main>
        </div>
      </div>
    </div>
  );
}

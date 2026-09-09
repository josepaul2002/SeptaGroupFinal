import { useState, useEffect } from 'react';
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
  const { token, admin, loading: authLoading, login, loginWithGoogle, logout, isAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sid = new URLSearchParams(hash.replace('#', '')).get('session_id');
      if (sid) {
        setLoginLoading(true);
        loginWithGoogle(sid)
          .catch((e) => setLoginError(e?.response?.data?.detail || 'Google sign-in failed'))
          .finally(() => {
            setLoginLoading(false);
            window.history.replaceState(null, '', window.location.pathname);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/admin';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

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

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#8A8A8A]/20" />
            <span className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-inter">or</span>
            <div className="flex-1 h-px bg-[#8A8A8A]/20" />
          </div>

          <button type="button" onClick={handleGoogleLogin} data-testid="admin-google-login-btn"
            className="w-full h-11 border border-[#8A8A8A]/40 text-[#050505] text-xs font-inter font-medium uppercase tracking-widest hover:border-[#C6A15B] hover:text-[#C6A15B] transition-colors flex items-center justify-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Sign in with Google
          </button>
          <p className="text-[10px] text-[#8A8A8A] font-inter text-center mt-3">Restricted to approved accounts</p>
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

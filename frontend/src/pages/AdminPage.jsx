import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  LogOut, Eye, Trash2, Download, Plus, ChevronRight, Settings, 
  Folder, Users, FileText, MessageSquare, RefreshCw, Save, X,
  Lock, Check, AlertCircle, Loader2
} from 'lucide-react';
import { 
  useAdminAuth, useAdminLeads, useAdminProjects, useAdminPartners,
  useAdminTestimonials, exportContent, uploadFile, getText
} from '../hooks/useApi';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Partner categories
const PARTNER_CATEGORIES = [
  'Architecture & Design',
  'Interiors & Fit-out',
  'Engineering (MEP/Structural/QS)',
  'Landscape & Outdoor',
  'Materials & Vendors',
  'Smart Home / Technology',
  'Branding, Signage & Wayfinding',
  'Marketing & Digital',
  'Leasing & Real Estate',
  'Legal / Finance',
];

const RELATIONSHIP_TYPES = [
  'Group Company',
  'Core Partner',
  'Project Partner',
  'Preferred Vendor',
];

const PROJECT_TYPES = ['Institutional', 'Healthcare', 'Commercial', 'Residential', 'Mixed-use'];
const PROJECT_STATUSES = ['Completed', 'Ongoing'];
const CLIENT_LENS = ['Residential', 'Commercial', 'Institutional'];

// Tabs
const TABS = [
  { id: 'leads', label: 'Leads', icon: MessageSquare },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'partners', label: 'Partners', icon: Users },
  { id: 'testimonials', label: 'Testimonials', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminPage() {
  const { token, admin, loading: authLoading, login, logout, isAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      setLoginError('Invalid credentials');
    }
    setLoginLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F3F0E8] flex items-center justify-center pt-16">
        <Loader2 className="animate-spin text-[#0F5E5B]" size={32} />
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F3F0E8] flex items-center justify-center pt-16" data-testid="admin-login-page">
        <div className="w-full max-w-sm p-8 bg-white border border-[#A7ADB5]/20">
          <div className="flex items-center gap-3 mb-8">
            <Lock size={18} className="text-[#0F5E5B]" />
            <h1 className="text-xl font-sora font-medium text-[#1F2328]">Admin Login</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full h-10 px-3 text-sm font-inter border border-[#A7ADB5]/30 bg-transparent text-[#1F2328] outline-none focus:border-[#0F5E5B] transition-colors"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                data-testid="admin-email-input"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full h-10 px-3 text-sm font-inter border border-[#A7ADB5]/30 bg-transparent text-[#1F2328] outline-none focus:border-[#0F5E5B] transition-colors"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                data-testid="admin-password-input"
              />
            </div>
            
            {loginError && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle size={14} />
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-11 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              data-testid="admin-login-btn"
            >
              {loginLoading ? <Loader2 className="animate-spin" size={16} /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F0E8] pt-16" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-[#A7ADB5]/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-sora font-medium text-[#1F2328]">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs font-inter text-[#A7ADB5]">{admin?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs font-inter text-red-500 hover:text-red-600 transition-colors"
              data-testid="admin-logout-btn"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-inter rounded transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#0F5E5B] text-white'
                      : 'text-[#1F2328]/70 hover:bg-[#0F5E5B]/10'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'leads' && <LeadsTab token={token} />}
            {activeTab === 'projects' && <ProjectsTab token={token} />}
            {activeTab === 'partners' && <PartnersTab token={token} />}
            {activeTab === 'testimonials' && <TestimonialsTab token={token} />}
            {activeTab === 'settings' && <SettingsTab token={token} />}
          </main>
        </div>
      </div>
    </div>
  );
}

// ================= LEADS TAB =================
function LeadsTab({ token }) {
  const { leads, loading, updateStatus, deleteLead } = useAdminLeads(token);
  const [filter, setFilter] = useState('all');

  const filtered = leads.filter(l => 
    filter === 'all' || l.status === filter
  );

  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white border border-[#A7ADB5]/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-sora font-medium text-[#1F2328]">Leads ({leads.length})</h2>
        <div className="flex gap-2">
          {['all', 'new', 'contacted', 'qualified', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs font-inter border transition-colors ${
                filter === s ? 'bg-[#0F5E5B] text-white border-[#0F5E5B]' : 'border-[#A7ADB5]/30 text-[#1F2328]/60'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#A7ADB5] py-8 text-center">No leads found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#A7ADB5]/20">
                <th className="text-left py-3 px-2 font-inter font-medium text-[#A7ADB5] text-xs uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-2 font-inter font-medium text-[#A7ADB5] text-xs uppercase tracking-wider">Contact</th>
                <th className="text-left py-3 px-2 font-inter font-medium text-[#A7ADB5] text-xs uppercase tracking-wider">Project</th>
                <th className="text-left py-3 px-2 font-inter font-medium text-[#A7ADB5] text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-2 font-inter font-medium text-[#A7ADB5] text-xs uppercase tracking-wider">Date</th>
                <th className="text-right py-3 px-2 font-inter font-medium text-[#A7ADB5] text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className="border-b border-[#A7ADB5]/10 hover:bg-[#F3F0E8]/50" data-testid={`lead-row-${lead.id}`}>
                  <td className="py-3 px-2">
                    <p className="font-inter font-medium text-[#1F2328]">{lead.name}</p>
                    {lead.message && <p className="text-xs text-[#A7ADB5] mt-0.5 truncate max-w-[200px]">{lead.message}</p>}
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-inter text-[#0F5E5B]">{lead.phone}</p>
                    {lead.email && <p className="text-xs text-[#A7ADB5]">{lead.email}</p>}
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-inter text-[#1F2328]">{lead.project_type || '-'}</p>
                    <p className="text-xs text-[#A7ADB5]">{lead.project_location || '-'}</p>
                  </td>
                  <td className="py-3 px-2">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`text-xs font-inter px-2 py-1 border-0 outline-none cursor-pointer ${statusColors[lead.status] || 'bg-gray-100'}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="py-3 px-2 text-xs text-[#A7ADB5]">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this lead?')) deleteLead(lead.id);
                      }}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ================= PROJECTS TAB =================
function ProjectsTab({ token }) {
  const { projects, loading, createProject, updateProject, deleteProject } = useAdminProjects(token);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#A7ADB5]/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-sora font-medium text-[#1F2328]">Projects ({projects.length})</h2>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] transition-colors"
            data-testid="create-project-btn"
          >
            <Plus size={14} /> Add Project
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm text-[#A7ADB5] py-8 text-center">No projects yet</p>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <div
                key={project.slug}
                className="flex items-center justify-between p-4 border border-[#A7ADB5]/20 hover:border-[#0F5E5B]/30 transition-colors"
                data-testid={`project-row-${project.slug}`}
              >
                <div className="flex items-center gap-4">
                  {project.image && (
                    <img src={project.image} alt="" className="w-16 h-12 object-cover bg-[#E8E6E0]" />
                  )}
                  <div>
                    <p className="font-inter font-medium text-[#1F2328]">{getText(project.title)}</p>
                    <p className="text-xs text-[#A7ADB5]">{project.type} · {project.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-inter px-2 py-0.5 ${
                    project.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {project.status}
                  </span>
                  <a
                    href={`/projects/${project.slug}?preview=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C6A15B] hover:text-[#0F5E5B] p-1"
                    title="Preview"
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    onClick={() => setEditing(project)}
                    className="text-[#0F5E5B] hover:text-[#C6A15B] p-1"
                    title="Edit"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this project?')) deleteProject(project.slug);
                    }}
                    className="text-red-400 hover:text-red-600 p-1"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <ProjectForm
          project={editing}
          token={token}
          onSave={(updates) => {
            updateProject(editing.slug, updates);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Create Modal */}
      {creating && (
        <ProjectForm
          token={token}
          onSave={async (data) => {
            await createProject(data);
            setCreating(false);
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

// ================= PARTNERS TAB =================
function PartnersTab({ token }) {
  const { partners, loading, createPartner, updatePartner, deletePartner } = useAdminPartners(token);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#A7ADB5]/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-sora font-medium text-[#1F2328]">Partners ({partners.length})</h2>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] transition-colors"
            data-testid="create-partner-btn"
          >
            <Plus size={14} /> Add Partner
          </button>
        </div>

        {partners.length === 0 ? (
          <p className="text-sm text-[#A7ADB5] py-8 text-center">No partners yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {partners.map(partner => (
              <div
                key={partner.slug}
                className="flex items-center justify-between p-4 border border-[#A7ADB5]/20 hover:border-[#0F5E5B]/30 transition-colors"
                data-testid={`partner-row-${partner.slug}`}
              >
                <div>
                  <p className="font-inter font-medium text-[#1F2328]">{getText(partner.name)}</p>
                  <p className="text-xs text-[#A7ADB5]">{partner.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-inter px-2 py-0.5 ${
                    partner.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {partner.status}
                  </span>
                  <button
                    onClick={() => setEditing(partner)}
                    className="text-[#0F5E5B] hover:text-[#C6A15B] p-1"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this partner?')) deletePartner(partner.slug);
                    }}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <PartnerForm
          partner={editing}
          token={token}
          onSave={(updates) => {
            updatePartner(editing.slug, updates);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Create Modal */}
      {creating && (
        <PartnerForm
          token={token}
          onSave={async (data) => {
            await createPartner(data);
            setCreating(false);
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

// ================= TESTIMONIALS TAB =================
function TestimonialsTab({ token }) {
  const { testimonials, loading, deleteTestimonial } = useAdminTestimonials(token);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white border border-[#A7ADB5]/20 p-6">
      <h2 className="text-lg font-sora font-medium text-[#1F2328] mb-6">Testimonials ({testimonials.length})</h2>

      {testimonials.length === 0 ? (
        <p className="text-sm text-[#A7ADB5] py-8 text-center">No testimonials yet</p>
      ) : (
        <div className="space-y-4">
          {testimonials.map(t => (
            <div key={t.id} className="p-4 border border-[#A7ADB5]/20">
              <p className="text-sm font-inter text-[#1F2328]/80 italic mb-3">"{getText(t.content)}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-inter font-medium text-[#1F2328]">{t.client_name}</p>
                  <p className="text-xs text-[#A7ADB5]">{t.client_role}</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this testimonial?')) deleteTestimonial(t.id);
                  }}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================= SETTINGS TAB =================
function SettingsTab({ token }) {
  const [exporting, setExporting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '' });
  const [pwMsg, setPwMsg] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportContent(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `septa-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    }
    setExporting(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    try {
      await axios.post(`${API}/admin/change-password`, {
        current_password: passwordForm.current,
        new_password: passwordForm.newPass
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPwMsg('Password changed successfully');
      setPasswordForm({ current: '', newPass: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.detail || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="bg-white border border-[#A7ADB5]/20 p-6">
        <h2 className="text-lg font-sora font-medium text-[#1F2328] mb-4">Export Content</h2>
        <p className="text-sm text-[#A7ADB5] mb-4">Download all projects and partners as JSON for backup.</p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] transition-colors disabled:opacity-60"
          data-testid="export-content-btn"
        >
          {exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
          Export as JSON
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-[#A7ADB5]/20 p-6">
        <h2 className="text-lg font-sora font-medium text-[#1F2328] mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          <div>
            <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
              Current Password
            </label>
            <input
              type="password"
              required
              className="w-full h-10 px-3 text-sm font-inter border border-[#A7ADB5]/30 bg-transparent outline-none focus:border-[#0F5E5B]"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full h-10 px-3 text-sm font-inter border border-[#A7ADB5]/30 bg-transparent outline-none focus:border-[#0F5E5B]"
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-[#1F2328] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#1F2328]/80 transition-colors"
          >
            <Lock size={14} /> Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

// ================= FORM COMPONENTS =================

function ProjectForm({ project, token, onSave, onClose }) {
  const [form, setForm] = useState({
    slug: project?.slug || '',
    title: project?.title || { en: '', ml: null },
    location: project?.location || '',
    type: project?.type || 'Commercial',
    project_status: project?.project_status || 'Completed',
    sqft: project?.sqft || '',
    duration: project?.duration || '',
    year: project?.year || new Date().getFullYear().toString(),
    client_type: project?.client_type || '',
    client_lens: project?.client_lens || 'Commercial',
    image: project?.image || '',
    short_description: project?.short_description || { en: '', ml: null },
    challenge: project?.challenge || { en: '', ml: null },
    status: project?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      alert('Error saving project');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#A7ADB5]/20 flex items-center justify-between">
          <h2 className="text-lg font-sora font-medium text-[#1F2328]">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="text-[#A7ADB5] hover:text-[#1F2328]">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Slug" required>
              <input
                type="text"
                required
                disabled={!!project}
                className="form-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              />
            </FormField>
            <FormField label="Title (English)" required>
              <input
                type="text"
                required
                className="form-input"
                value={typeof form.title === 'object' ? form.title.en : form.title}
                onChange={(e) => setForm({ ...form, title: { ...form.title, en: e.target.value } })}
              />
            </FormField>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type">
              <select
                className="form-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select
                className="form-input"
                value={form.project_status}
                onChange={(e) => setForm({ ...form, project_status: e.target.value })}
              >
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Location">
              <input
                type="text"
                className="form-input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </FormField>
            <FormField label="Sq.ft">
              <input
                type="text"
                className="form-input"
                value={form.sqft}
                onChange={(e) => setForm({ ...form, sqft: e.target.value })}
              />
            </FormField>
            <FormField label="Duration">
              <input
                type="text"
                className="form-input"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Image URL">
            <input
              type="url"
              className="form-input"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </FormField>

          <FormField label="Short Description">
            <textarea
              rows={2}
              className="form-input resize-none"
              value={typeof form.short_description === 'object' ? form.short_description.en : form.short_description}
              onChange={(e) => setForm({ ...form, short_description: { ...form.short_description, en: e.target.value } })}
            />
          </FormField>

          <FormField label="Publish Status">
            <select
              className="form-input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#A7ADB5]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-inter text-[#1F2328]/60 hover:text-[#1F2328]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PartnerForm({ partner, token, onSave, onClose }) {
  const [form, setForm] = useState({
    slug: partner?.slug || '',
    name: partner?.name || { en: '', ml: null },
    category: partner?.category || PARTNER_CATEGORIES[0],
    relationship_type: partner?.relationship_type || 'Project Partner',
    bio_short: partner?.bio_short || { en: '', ml: null },
    bio_long: partner?.bio_long || { en: '', ml: null },
    specialties: partner?.specialties || [],
    districts: partner?.districts || [],
    website: partner?.website || '',
    featured: partner?.featured || false,
    status: partner?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      alert('Error saving partner');
    }
    setSaving(false);
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !form.specialties.includes(specialtyInput.trim())) {
      setForm({ ...form, specialties: [...form.specialties, specialtyInput.trim()] });
      setSpecialtyInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#A7ADB5]/20 flex items-center justify-between">
          <h2 className="text-lg font-sora font-medium text-[#1F2328]">
            {partner ? 'Edit Partner' : 'New Partner'}
          </h2>
          <button onClick={onClose} className="text-[#A7ADB5] hover:text-[#1F2328]">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Slug" required>
              <input
                type="text"
                required
                disabled={!!partner}
                className="form-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              />
            </FormField>
            <FormField label="Name (English)" required>
              <input
                type="text"
                required
                className="form-input"
                value={typeof form.name === 'object' ? form.name.en : form.name}
                onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
              />
            </FormField>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {PARTNER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Relationship Type">
              <select
                className="form-input"
                value={form.relationship_type}
                onChange={(e) => setForm({ ...form, relationship_type: e.target.value })}
              >
                {RELATIONSHIP_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Short Bio">
            <textarea
              rows={2}
              className="form-input resize-none"
              value={typeof form.bio_short === 'object' ? form.bio_short.en : form.bio_short}
              onChange={(e) => setForm({ ...form, bio_short: { ...form.bio_short, en: e.target.value } })}
            />
          </FormField>

          <FormField label="Full Bio">
            <textarea
              rows={4}
              className="form-input resize-none"
              value={typeof form.bio_long === 'object' ? form.bio_long.en : form.bio_long}
              onChange={(e) => setForm({ ...form, bio_long: { ...form.bio_long, en: e.target.value } })}
            />
          </FormField>

          <FormField label="Specialties">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="form-input flex-1"
                placeholder="Add specialty..."
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              />
              <button
                type="button"
                onClick={addSpecialty}
                className="px-3 py-1 bg-[#0F5E5B] text-white text-xs"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.specialties.map(s => (
                <span key={s} className="text-xs bg-[#F3F0E8] px-2 py-1 flex items-center gap-1">
                  {s}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, specialties: form.specialties.filter(x => x !== s) })}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Website">
              <input
                type="url"
                className="form-input"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </FormField>
            <FormField label="Publish Status">
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FormField>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-inter text-[#1F2328]">Featured partner</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#A7ADB5]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-inter text-[#1F2328]/60 hover:text-[#1F2328]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= HELPER COMPONENTS =================

function LoadingSpinner() {
  return (
    <div className="bg-white border border-[#A7ADB5]/20 p-12 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#0F5E5B]" size={24} />
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
        {label} {required && '*'}
      </label>
      {children}
    </div>
  );
}

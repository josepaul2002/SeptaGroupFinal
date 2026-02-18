import { useEffect, useState } from 'react';
import axios from 'axios';
import { LogOut, Trash2, CheckCircle2, Clock, XCircle, RefreshCw, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_LABELS = {
  new: { label: 'New', color: 'bg-blue-50 text-blue-600', icon: <Clock size={12} /> },
  contacted: { label: 'Contacted', color: 'bg-yellow-50 text-yellow-600', icon: <RefreshCw size={12} /> },
  closed: { label: 'Closed', color: 'bg-green-50 text-green-700', icon: <CheckCircle2 size={12} /> },
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem('septa-admin') === 'true');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Admin — Septa Group';
    if (authenticated) fetchAll();
  }, [authenticated]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [l, p, t] = await Promise.all([
        axios.get(`${API}/leads`),
        axios.get(`${API}/projects`),
        axios.get(`${API}/testimonials`),
      ]);
      setLeads(l.data);
      setProjects(p.data);
      setTestimonials(t.data);
    } catch {}
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await axios.post(`${API}/admin/auth`, { password });
      localStorage.setItem('septa-admin', 'true');
      setAuthenticated(true);
    } catch {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('septa-admin');
    setAuthenticated(false);
  };

  const updateLeadStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/leads/${id}`, { status });
      setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
    } catch {}
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await axios.delete(`${API}/leads/${id}`);
      setLeads(leads.filter(l => l.id !== id));
    } catch {}
  };

  const deleteProject = async (slug) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API}/projects/${slug}`);
      setProjects(projects.filter(p => p.slug !== slug));
    } catch {}
  };

  const deleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await axios.delete(`${API}/testimonials/${id}`);
      setTestimonials(testimonials.filter(t => t.id !== id));
    } catch {}
  };

  if (!authenticated) {
    return (
      <div className="pt-16 min-h-screen bg-[#F3F0E8] flex items-center justify-center" data-testid="admin-login">
        <div className="w-full max-w-sm bg-white p-10 border border-[#A7ADB5]/20">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter mb-2">Admin Access</p>
            <h1 className="text-2xl font-sora font-light text-[#1F2328]">Septa Admin</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Password</label>
              <input
                type="password"
                required
                className="input-underline"
                placeholder="Enter admin password"
                data-testid="admin-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {authError && (
              <p className="text-red-500 text-xs font-inter" data-testid="admin-auth-error">{authError}</p>
            )}
            <button
              type="submit"
              data-testid="admin-login-btn"
              className="w-full h-11 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-[#F3F0E8]" data-testid="admin-dashboard">
      {/* Admin Header */}
      <div className="bg-[#1F2328] border-b border-[#F3F0E8]/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-sora font-semibold text-[#0F5E5B]">SEPTA</span>
            <span className="font-sora font-light text-[#F3F0E8]">Admin</span>
            <span className="text-xs font-inter text-[#A7ADB5]">/ Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-inter text-[#A7ADB5] hover:text-[#F3F0E8] transition-colors" data-testid="admin-view-site-btn">
              View Site
            </Link>
            <button
              onClick={handleLogout}
              data-testid="admin-logout-btn"
              className="flex items-center gap-1.5 text-xs font-inter text-[#A7ADB5] hover:text-[#F3F0E8] transition-colors"
            >
              <LogOut size={13} strokeWidth={1.5} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Leads', value: leads.length, sub: `${leads.filter(l => l.status === 'new').length} new` },
            { label: 'Projects', value: projects.length, sub: `${projects.filter(p => p.status === 'Ongoing').length} ongoing` },
            { label: 'Testimonials', value: testimonials.length, sub: 'Published' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#A7ADB5]/20 p-5" data-testid={`admin-stat-${i}`}>
              <p className="text-2xl font-sora font-medium text-[#1F2328]">{s.value}</p>
              <p className="text-xs font-inter font-medium text-[#1F2328]/70 mt-0.5">{s.label}</p>
              <p className="text-xs font-inter text-[#A7ADB5] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#A7ADB5]/20">
          {['leads', 'projects', 'testimonials'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`admin-tab-${t}`}
              className={`px-5 py-2.5 text-xs font-inter font-medium uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                tab === t ? 'border-[#0F5E5B] text-[#0F5E5B]' : 'border-transparent text-[#A7ADB5] hover:text-[#1F2328]'
              }`}
            >
              {t} {t === 'leads' && leads.filter(l => l.status === 'new').length > 0 && (
                <span className="ml-1.5 bg-[#0F5E5B] text-white text-xs px-1.5 py-0.5 rounded-sm">
                  {leads.filter(l => l.status === 'new').length}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={fetchAll}
            data-testid="admin-refresh-btn"
            className="ml-auto p-2 text-[#A7ADB5] hover:text-[#1F2328] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Leads Tab */}
        {tab === 'leads' && (
          <div data-testid="admin-leads-tab">
            {leads.length === 0 ? (
              <p className="text-sm font-inter text-[#A7ADB5] py-10 text-center">No leads yet.</p>
            ) : (
              <div className="space-y-3">
                {leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-white border border-[#A7ADB5]/20 p-5"
                    data-testid={`lead-item-${lead.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-inter font-semibold text-[#1F2328]">{lead.name}</p>
                          <p className="text-xs font-inter text-[#A7ADB5]">{lead.phone}</p>
                          <p className="text-xs font-inter text-[#A7ADB5]">{lead.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-inter text-[#1F2328]/60">{lead.project_type || '—'}</p>
                          <p className="text-xs font-inter text-[#A7ADB5]">{lead.project_location || '—'}</p>
                          <p className="text-xs font-inter text-[#A7ADB5]">{lead.budget_range || '—'}</p>
                        </div>
                        <div>
                          {lead.message && (
                            <p className="text-xs font-inter text-[#1F2328]/60 line-clamp-2">{lead.message}</p>
                          )}
                          <p className="text-xs font-inter text-[#A7ADB5] mt-1">
                            {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          data-testid={`lead-status-${lead.id}`}
                          className={`text-xs font-inter px-2 py-1 border-0 outline-none cursor-pointer ${STATUS_LABELS[lead.status]?.color || 'bg-gray-100'}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          data-testid={`lead-delete-${lead.id}`}
                          className="text-[#A7ADB5] hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {tab === 'projects' && (
          <div data-testid="admin-projects-tab">
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.slug}
                  className="bg-white border border-[#A7ADB5]/20 p-5"
                  data-testid={`project-item-${project.slug}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 overflow-hidden bg-[#E8E6E0] flex-shrink-0">
                        <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-inter font-semibold text-[#1F2328]">{project.title}</p>
                        <p className="text-xs font-inter text-[#A7ADB5]">{project.location} · {project.sqft} sqft · {project.year}</p>
                        <p className="text-xs font-inter text-[#0F5E5B] mt-0.5">{project.type} · {project.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/projects/${project.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`project-view-${project.slug}`}
                        className="text-[#A7ADB5] hover:text-[#0F5E5B] transition-colors p-1"
                      >
                        <Eye size={13} strokeWidth={1.5} />
                      </Link>
                      <button
                        onClick={() => deleteProject(project.slug)}
                        data-testid={`project-delete-${project.slug}`}
                        className="text-[#A7ADB5] hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials Tab */}
        {tab === 'testimonials' && (
          <div data-testid="admin-testimonials-tab">
            <div className="space-y-3">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-[#A7ADB5]/20 p-5"
                  data-testid={`testimonial-item-${t.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-inter text-[#1F2328]/70 leading-relaxed mb-2">"{t.content}"</p>
                      <p className="text-sm font-inter font-semibold text-[#1F2328]">{t.client_name}</p>
                      <p className="text-xs font-inter text-[#A7ADB5]">{t.client_role}</p>
                    </div>
                    <button
                      onClick={() => deleteTestimonial(t.id)}
                      data-testid={`testimonial-delete-${t.id}`}
                      className="text-[#A7ADB5] hover:text-red-500 transition-colors p-1 flex-shrink-0"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

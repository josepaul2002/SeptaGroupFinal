import { useState } from 'react';
import { Eye, Trash2, Plus, Settings, Loader2, EyeOff } from 'lucide-react';
import { useAdminProjects, getText } from '../../hooks/useApi';
import axios from 'axios';
import ProjectForm from './ProjectForm';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProjectsTab({ token }) {
  const { projects, loading, createProject, updateProject, deleteProject, setProjects } = useAdminProjects(token);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const hidePhotoless = async () => {
    if (!window.confirm('Hide media on all projects that have no photos or media? Their story and details stay visible.')) return;
    setBulkBusy(true);
    try {
      const res = await axios.post(`${API}/admin/projects/hide-photoless`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const slugs = res.data.slugs || [];
      if (slugs.length) {
        setProjects(projects.map(p => slugs.includes(p.slug) ? { ...p, media_visible: false } : p));
      }
      alert(res.data.message);
    } catch {
      alert('Bulk update failed');
    }
    setBulkBusy(false);
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#8A8A8A]/20 p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#606060]" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="projects-tab">
      <div className="bg-white border border-[#8A8A8A]/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-sora font-medium text-[#050505]">Projects ({projects.length})</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={hidePhotoless}
              disabled={bulkBusy}
              className="flex items-center gap-2 px-4 py-2 border border-[#8A8A8A]/40 text-[#050505]/70 text-xs font-inter font-medium uppercase tracking-wider hover:border-[#606060]/40 hover:text-[#606060] transition-colors disabled:opacity-60"
              data-testid="bulk-hide-photoless-btn"
              title="Hide media on all projects without photos"
            >
              {bulkBusy ? <Loader2 className="animate-spin" size={14} /> : <EyeOff size={14} />} Hide Photo-less Media
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#262626] transition-colors"
              data-testid="create-project-btn"
            >
              <Plus size={14} /> Add Project
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm text-[#8A8A8A] py-8 text-center">No projects yet</p>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <div
                key={project.slug}
                className="flex items-center justify-between p-4 border border-[#8A8A8A]/20 hover:border-[#606060]/30 transition-colors"
                data-testid={`project-row-${project.slug}`}
              >
                <div className="flex items-center gap-4">
                  {project.image && (
                    <img src={project.image} alt="" className="w-16 h-12 object-cover bg-[#ECECEA]" />
                  )}
                  <div>
                    <p className="font-inter font-medium text-[#050505]">{getText(project.title)}</p>
                    <p className="text-xs text-[#8A8A8A]">{project.type} · {project.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-inter px-2 py-0.5 ${
                    project.status === 'published' ? 'bg-[#050505] text-white' : 'bg-[#ECECEA] text-[#666666]'
                  }`}>
                    {project.status}
                  </span>
                  <a
                    href={`/projects/${project.slug}?preview=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8A8A8A] hover:text-[#606060] p-1"
                    title="Preview"
                    data-testid={`preview-project-${project.slug}`}
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    onClick={() => setEditing(project)}
                    className="text-[#606060] hover:text-[#8A8A8A] p-1"
                    title="Edit"
                    data-testid={`edit-project-${project.slug}`}
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Delete this project?')) deleteProject(project.slug); }}
                    className="text-red-400 hover:text-red-600 p-1"
                    title="Delete"
                    data-testid={`delete-project-${project.slug}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <ProjectForm
          project={editing}
          token={token}
          onSave={(updates) => updateProject(editing.slug, updates).then(() => setEditing(null))}
          onClose={() => setEditing(null)}
        />
      )}

      {creating && (
        <ProjectForm
          token={token}
          onSave={async (data) => { await createProject(data); setCreating(false); }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

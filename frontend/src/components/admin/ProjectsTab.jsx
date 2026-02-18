import { useState } from 'react';
import { Eye, Trash2, Plus, Settings, Loader2 } from 'lucide-react';
import { useAdminProjects, getText } from '../../hooks/useApi';
import ProjectForm from './ProjectForm';

export default function ProjectsTab({ token }) {
  const { projects, loading, createProject, updateProject, deleteProject } = useAdminProjects(token);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  if (loading) {
    return (
      <div className="bg-white border border-[#A7ADB5]/20 p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F5E5B]" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="projects-tab">
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
                    data-testid={`preview-project-${project.slug}`}
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    onClick={() => setEditing(project)}
                    className="text-[#0F5E5B] hover:text-[#C6A15B] p-1"
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
          onSave={(updates) => { updateProject(editing.slug, updates); setEditing(null); }}
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

import { useState } from 'react';
import { X, Save, Loader2, Upload, Trash2, Plus } from 'lucide-react';
import { uploadFile } from '../../hooks/useApi';

const PROJECT_TYPES = ['Institutional', 'Healthcare', 'Commercial', 'Residential', 'Mixed-use'];
const PROJECT_STATUSES = ['Completed', 'Ongoing'];

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

export default function ProjectForm({ project, token, onSave, onClose }) {
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
    gallery: project?.gallery || [],
    short_description: project?.short_description || { en: '', ml: null },
    challenge: project?.challenge || { en: '', ml: null },
    status: project?.status || 'draft',
    media: project?.media || { hero_video: null, images: [], model_3d: null, plans: [] },
    media_visible: project?.media_visible !== false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('basic');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } catch {
      alert('Error saving project');
    }
    setSaving(false);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(token, file);
      if (field === 'image') {
        setForm({ ...form, image: result.url });
      } else if (field === 'hero_video') {
        setForm({ ...form, media: { ...form.media, hero_video: result.url } });
      } else if (field === 'gallery') {
        setForm({ ...form, gallery: [...form.gallery, result.url] });
      } else if (field === 'media_images') {
        setForm({ ...form, media: { ...form.media, images: [...(form.media.images || []), { url: result.url, caption: { en: '', ml: null } }] } });
      }
    } catch {
      alert('Upload failed. Files are stored locally (placeholder storage).');
    }
    setUploading(false);
  };

  const formTabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'content', label: 'Content' },
    { id: 'media', label: 'Media' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#A7ADB5]/20 flex items-center justify-between">
          <h2 className="text-lg font-sora font-medium text-[#1F2328]">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="text-[#A7ADB5] hover:text-[#1F2328]" data-testid="close-project-form">
            <X size={20} />
          </button>
        </div>

        {/* Form Tabs */}
        <div className="border-b border-[#A7ADB5]/20 flex">
          {formTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFormTab(tab.id)}
              data-testid={`project-form-tab-${tab.id}`}
              className={`px-6 py-3 text-xs font-inter uppercase tracking-wider transition-colors ${
                activeFormTab === tab.id
                  ? 'text-[#0F5E5B] border-b-2 border-[#0F5E5B] font-medium'
                  : 'text-[#A7ADB5] hover:text-[#1F2328]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* BASIC INFO TAB */}
          {activeFormTab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Slug" required>
                  <input type="text" required disabled={!!project} className="form-input" value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
                </FormField>
                <FormField label="Title (English)" required>
                  <input type="text" required className="form-input"
                    value={typeof form.title === 'object' ? form.title.en : form.title}
                    onChange={(e) => setForm({ ...form, title: { ...form.title, en: e.target.value } })} />
                </FormField>
              </div>
              <FormField label="Title (Malayalam)">
                <input type="text" className="form-input"
                  value={typeof form.title === 'object' ? (form.title.ml || '') : ''}
                  onChange={(e) => setForm({ ...form, title: { ...form.title, ml: e.target.value || null } })} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Type">
                  <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Project Status">
                  <select className="form-input" value={form.project_status} onChange={(e) => setForm({ ...form, project_status: e.target.value })}>
                    {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Location">
                  <input type="text" className="form-input" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </FormField>
                <FormField label="Sq.ft">
                  <input type="text" className="form-input" value={form.sqft}
                    onChange={(e) => setForm({ ...form, sqft: e.target.value })} />
                </FormField>
                <FormField label="Duration">
                  <input type="text" className="form-input" value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Client Lens">
                  <select className="form-input" value={form.client_lens}
                    onChange={(e) => setForm({ ...form, client_lens: e.target.value })}>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Institutional">Institutional</option>
                  </select>
                </FormField>
                <FormField label="Publish Status">
                  <select className="form-input" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </FormField>
              </div>
            </>
          )}

          {/* CONTENT TAB */}
          {activeFormTab === 'content' && (
            <>
              <FormField label="Short Description (English)">
                <textarea rows={2} className="form-input resize-none"
                  value={typeof form.short_description === 'object' ? form.short_description.en : form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: { ...form.short_description, en: e.target.value } })} />
              </FormField>
              <FormField label="Short Description (Malayalam)">
                <textarea rows={2} className="form-input resize-none"
                  value={typeof form.short_description === 'object' ? (form.short_description.ml || '') : ''}
                  onChange={(e) => setForm({ ...form, short_description: { ...form.short_description, ml: e.target.value || null } })} />
              </FormField>
              <FormField label="Challenge (English)">
                <textarea rows={2} className="form-input resize-none"
                  value={typeof form.challenge === 'object' ? form.challenge.en : form.challenge}
                  onChange={(e) => setForm({ ...form, challenge: { ...form.challenge, en: e.target.value } })} />
              </FormField>
            </>
          )}

          {/* MEDIA TAB */}
          {activeFormTab === 'media' && (
            <>
              {/* Media visibility toggle */}
              <div className="flex items-start justify-between p-4 bg-[#F3F0E8] border border-[#A7ADB5]/30" data-testid="project-media-visible-row">
                <div className="pr-4">
                  <p className="text-sm font-inter font-medium text-[#1F2328]">Show media & gallery on project page</p>
                  <p className="text-xs text-[#A7ADB5] mt-0.5">Turn off for projects without proper photos. The Media tab and gallery are hidden; the story and details still show.</p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, media_visible: !form.media_visible })}
                  data-testid="project-media-visible-toggle"
                  role="switch" aria-checked={form.media_visible}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${form.media_visible ? 'bg-[#0F5E5B]' : 'bg-[#A7ADB5]/40'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.media_visible ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Hero Image */}
              <FormField label="Hero Image">
                <div className="flex gap-3 items-end">
                  <input type="url" className="form-input flex-1" placeholder="Image URL" value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })} />
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#F3F0E8] text-[#1F2328] text-xs font-inter cursor-pointer hover:bg-[#E8E6E0] transition-colors border border-[#A7ADB5]/30">
                    <Upload size={14} /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                  </label>
                </div>
                {form.image && <img src={form.image} alt="Hero preview" className="mt-2 h-24 object-cover border" />}
              </FormField>

              {/* Hero Video */}
              <FormField label="Hero Video URL">
                <div className="flex gap-3 items-end">
                  <input type="url" className="form-input flex-1" placeholder="Video URL (mp4, webm)"
                    value={form.media?.hero_video || ''}
                    onChange={(e) => setForm({ ...form, media: { ...form.media, hero_video: e.target.value || null } })} />
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#F3F0E8] text-[#1F2328] text-xs font-inter cursor-pointer hover:bg-[#E8E6E0] transition-colors border border-[#A7ADB5]/30">
                    <Upload size={14} /> Upload
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'hero_video')} />
                  </label>
                </div>
              </FormField>

              {/* Gallery Images */}
              <FormField label="Gallery Images">
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.gallery?.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt={`Gallery ${i + 1}`} className="h-20 w-28 object-cover border" />
                      <button type="button" onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, j) => j !== i) })}
                        className="absolute top-1 right-1 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F0E8] text-[#1F2328] text-xs font-inter cursor-pointer hover:bg-[#E8E6E0] transition-colors border border-[#A7ADB5]/30">
                  <Plus size={14} /> Add Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'gallery')} />
                </label>
              </FormField>

              {/* 3D Model URL */}
              <FormField label="3D Model URL (GLB/GLTF)">
                <input type="url" className="form-input" placeholder="https://... .glb"
                  value={form.media?.model_3d || ''}
                  onChange={(e) => setForm({ ...form, media: { ...form.media, model_3d: e.target.value || null } })} />
              </FormField>

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-[#0F5E5B]">
                  <Loader2 className="animate-spin" size={14} /> Uploading...
                </div>
              )}
            </>
          )}

          {/* Save Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#A7ADB5]/20">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-inter text-[#1F2328]/60 hover:text-[#1F2328]">
              Cancel
            </button>
            <button type="submit" disabled={saving} data-testid="save-project-btn"
              className="flex items-center gap-2 px-4 py-2 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

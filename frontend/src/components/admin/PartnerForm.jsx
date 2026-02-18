import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

const PARTNER_CATEGORIES = [
  'Architecture & Design',
  'Structural Engineering',
  'MEP Engineering',
  'Quantity Surveying',
  'Interiors & Fit-out',
  'Landscape & Outdoor',
  'Lighting Design',
  'Materials & Vendors',
  'Smart Home / Security / Automation',
  'Branding, Signage & Wayfinding',
  'Marketing & Digital',
  'Leasing & Real Estate',
  'Photo / Video / 3D Documentation',
  'Legal / Compliance / Approvals',
];

const RELATIONSHIP_TYPES = ['Group Company', 'Core Partner', 'Project Partner', 'Preferred Vendor'];

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

export default function PartnerForm({ partner, token, onSave, onClose }) {
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
    } catch {
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
          <button onClick={onClose} className="text-[#A7ADB5] hover:text-[#1F2328]" data-testid="close-partner-form">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Slug" required>
              <input type="text" required disabled={!!partner} className="form-input" value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
            </FormField>
            <FormField label="Name (English)" required>
              <input type="text" required className="form-input"
                value={typeof form.name === 'object' ? form.name.en : form.name}
                onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })} />
            </FormField>
          </div>

          <FormField label="Name (Malayalam)">
            <input type="text" className="form-input"
              value={typeof form.name === 'object' ? (form.name.ml || '') : ''}
              onChange={(e) => setForm({ ...form, name: { ...form.name, ml: e.target.value || null } })} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select className="form-input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {PARTNER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Relationship Type">
              <select className="form-input" value={form.relationship_type}
                onChange={(e) => setForm({ ...form, relationship_type: e.target.value })}>
                {RELATIONSHIP_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Short Bio (English)">
            <textarea rows={2} className="form-input resize-none"
              value={typeof form.bio_short === 'object' ? form.bio_short.en : form.bio_short}
              onChange={(e) => setForm({ ...form, bio_short: { ...form.bio_short, en: e.target.value } })} />
          </FormField>

          <FormField label="Short Bio (Malayalam)">
            <textarea rows={2} className="form-input resize-none"
              value={typeof form.bio_short === 'object' ? (form.bio_short.ml || '') : ''}
              onChange={(e) => setForm({ ...form, bio_short: { ...form.bio_short, ml: e.target.value || null } })} />
          </FormField>

          <FormField label="Full Bio (English)">
            <textarea rows={4} className="form-input resize-none"
              value={typeof form.bio_long === 'object' ? form.bio_long.en : form.bio_long}
              onChange={(e) => setForm({ ...form, bio_long: { ...form.bio_long, en: e.target.value } })} />
          </FormField>

          <FormField label="Specialties">
            <div className="flex gap-2 mb-2">
              <input type="text" className="form-input flex-1" placeholder="Add specialty..."
                value={specialtyInput} onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())} />
              <button type="button" onClick={addSpecialty} className="px-3 py-1 bg-[#0F5E5B] text-white text-xs">Add</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.specialties.map(s => (
                <span key={s} className="text-xs bg-[#F3F0E8] px-2 py-1 flex items-center gap-1">
                  {s}
                  <button type="button" onClick={() => setForm({ ...form, specialties: form.specialties.filter(x => x !== s) })}
                    className="text-red-400 hover:text-red-600"><X size={10} /></button>
                </span>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Website">
              <input type="url" className="form-input" value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </FormField>
            <FormField label="Publish Status">
              <select className="form-input" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FormField>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm font-inter text-[#1F2328]">Featured partner</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#A7ADB5]/20">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-inter text-[#1F2328]/60 hover:text-[#1F2328]">Cancel</button>
            <button type="submit" disabled={saving} data-testid="save-partner-btn"
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

import {useUnsavedRecord,confirmLeave} from '../../hooks/useUnsavedChanges';
import {validateRecordImages} from '../../lib/mediaRules';
import { PublicationFields, SEOFields } from './Fields';
import { errorMessage } from '../../lib/cms';
import { useState } from 'react';
import { X, Save, Loader2, Upload, Plus, AlertTriangle } from 'lucide-react';
import { uploadFile } from '../../hooks/useApi';
import MediaGuide from './MediaGuide';
import HighlightEditor from './HighlightEditor';

const PARTNER_CATEGORIES = [
  'Architecture & Design', 'Structural Engineering', 'MEP Engineering', 'Quantity Surveying',
  'Interiors & Fit-out', 'Landscape & Outdoor', 'Lighting Design', 'Materials & Vendors',
  'Smart Home / Security / Automation', 'Branding, Signage & Wayfinding', 'Marketing & Digital',
  'Leasing & Real Estate', 'Photo / Video / 3D Documentation', 'Legal / Compliance / Approvals',
];
const RELATIONSHIP_TYPES = ['Group Company', 'Core Partner', 'Project Partner', 'Preferred Vendor'];

export default function PartnerForm({ partner, token, onSave, onClose }) {
  const [form, setForm] = useState({
    profile_type: partner?.profile_type || 'company',
    professional_role: partner?.professional_role || {en:'',ml:''},
    firm: partner?.firm || '',
    publication_reviewed: partner?.publication_reviewed || false,
    seo: partner?.seo || {},
    slug: partner?.slug || '',
    name: partner?.name || { en: '', ml: null },
    category: partner?.category || PARTNER_CATEGORIES[0],
    relationship_type: partner?.relationship_type || 'Project Partner',
    bio_short: partner?.bio_short || { en: '', ml: null },
    bio_long: partner?.bio_long || { en: '', ml: null },
    specialties: partner?.specialties || [],
    highlights: partner?.highlights || [],
    districts: partner?.districts || [],
    website_url: partner?.website_url || partner?.website || '',
    facebook_url: partner?.facebook_url || '',
    instagram_url: partner?.instagram_url || partner?.instagram || '',
    contact_email: partner?.contact_email || '',
    contact_phone: partner?.contact_phone || '',
    sort_order: partner?.sort_order || 0,
    is_featured: partner?.is_featured ?? partner?.featured ?? false,
    media: partner?.media || { card_image: null, logo_image: null, hero_image: null, gallery_images: [] },
    known_for: partner?.known_for || [],
    septa_collaboration: partner?.septa_collaboration || { en: '', ml: null },
    status: partner?.status || 'draft',
  });
  useUnsavedRecord(form);
  const closeEditor=()=>{if(confirmLeave())onClose();};
  const [saving, setSaving] = useState(false);
  const [mediaMessage,setMediaMessage]=useState(''),[formError,setFormError]=useState('');
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('basic');
  const [specInput, setSpecInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(uploading)return;
    setFormError('');
    if (form.status === 'published' && !form.media.card_image) {
      if (!window.confirm('Publishing without a card image is not recommended. Cards will appear with a placeholder. Continue?')) return;
    }
    setSaving(true);
    try { await validateRecordImages(form,partner,'partner'); await onSave(form); } catch(e) { setFormError(errorMessage(e)); }
    setSaving(false);
  };

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);setFormError('');setMediaMessage('');
    try {
      const result = await uploadFile(token, file,field==='videos'?'partner_video':field==='video_posters'?'video_poster':field);
      if (field === 'video_posters') {
        setForm(f => ({...f,media:{...f.media,video_posters:[...(f.media.video_posters||[]),result.url]}}));
      } else if (field === 'card_image') {
        setForm(f => ({...f,media:{...f.media,card_image:f.media.card_image||result.url,card_images:[...new Set([...(f.media.card_images?.length?f.media.card_images:[f.media.card_image].filter(Boolean)),result.url])].slice(0,6)}}));
      } else if (field === 'gallery_images' || field === 'videos') {
        setForm(f => ({ ...f, media: { ...f.media, [field]: [...(f.media[field] || []), result.url],...(field==='videos'?{video_titles:[...(f.media.video_titles||[]),'']}:{}) } }));
      } else {
        setForm(f => ({ ...f, media: { ...f.media, [field]: result.url } }));
      }
      setMediaMessage('Upload complete. Save this profile to keep the file.');
    } catch (error) { setFormError(errorMessage(error)); }
    setUploading(false);
  };

  const removeGalleryImage = (idx) => {
    setForm({ ...form, media: { ...form.media, gallery_images: form.media.gallery_images.filter((_, i) => i !== idx), gallery_captions:(form.media.gallery_captions||[]).filter((_,i)=>i!==idx) } });
  };

  const addSpecialty = () => {
    if (specInput.trim() && !form.specialties.includes(specInput.trim())) {
      setForm({ ...form, specialties: [...form.specialties, specInput.trim()] });
      setSpecInput('');
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'content', label: 'Content' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'media', label: 'Media' },
  ];

  const needsCardImage = form.status === 'published' && !form.media.card_image;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#8A8A8A]/20 flex items-center justify-between">
          <h2 className="text-lg font-sora font-medium text-[#050505]">{partner ? 'Edit Partner' : 'New Partner'}</h2>
          <button onClick={closeEditor} className="text-[#8A8A8A] hover:text-[#050505]" data-testid="close-partner-form"><X size={20} /></button>
        </div>

        {needsCardImage && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-700 text-xs font-inter" data-testid="card-image-warning">
            <AlertTriangle size={14} /> Card image required for published partners. Add one in the Media tab.
          </div>
        )}
        {form.status === 'published' && !form.publication_reviewed && (
          <label className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 flex items-start gap-3 text-sm text-amber-900">
            <input type="checkbox" className="mt-1" checked={false} onChange={e=>setForm(current=>({...current,publication_reviewed:e.target.checked}))}/>
            <span>This older public profile needs a one-time confirmation before you can save changes. I have checked its facts, credits and permission to publish its media.</span>
          </label>
        )}

        <div className="border-b border-[#8A8A8A]/20 flex flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`partner-form-tab-${t.id}`}
              className={`px-6 py-3 text-xs font-inter uppercase tracking-wider transition-colors ${
                tab === t.id ? 'text-[#606060] border-b-2 border-[#606060] font-medium' : 'text-[#8A8A8A] hover:text-[#050505]'
              }`}>{t.label}{t.id === 'media' && needsCardImage ? ' !' : ''}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* BASIC INFO */}
          {tab === 'basic' && (
            <><F label="Profile type"><select className="form-input" value={form.profile_type} onChange={e=>setForm({...form,profile_type:e.target.value})}><option value="company">Company / studio</option><option value="person">Person / independent professional</option></select></F>{form.profile_type==='person'&&<><F label="Professional role · English"><input className="form-input" value={form.professional_role.en||''} onChange={e=>setForm({...form,professional_role:{...form.professional_role,en:e.target.value}})}/></F><F label="Professional role · Malayalam"><input className="form-input" value={form.professional_role.ml||''} onChange={e=>setForm({...form,professional_role:{...form.professional_role,ml:e.target.value}})}/></F><F label="Firm / studio (optional)"><input className="form-input" value={form.firm} onChange={e=>setForm({...form,firm:e.target.value})}/></F></>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Slug *">
                  <input type="text" required disabled={!!partner} className="form-input" value={form.slug}
                    onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} data-testid="partner-slug" />
                </F>
                <F label="Name (English) *">
                  <input type="text" required className="form-input" value={typeof form.name === 'object' ? form.name.en : form.name}
                    onChange={e => setForm({ ...form, name: { ...form.name, en: e.target.value } })} data-testid="partner-name-en" />
                </F>
              </div>
              <F label="Name (Malayalam)">
                <input type="text" className="form-input" value={typeof form.name === 'object' ? (form.name.ml || '') : ''}
                  onChange={e => setForm({ ...form, name: { ...form.name, ml: e.target.value || null } })} />
              </F>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Category">
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {PARTNER_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </F>
                <F label="Relationship Type">
                  <select className="form-input" value={form.relationship_type} onChange={e => setForm({ ...form, relationship_type: e.target.value })}>
                    {RELATIONSHIP_TYPES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </F>
              </div>
              <F label="Specialties">
                <div className="flex gap-2 mb-2">
                  <input type="text" className="form-input flex-1" placeholder="Add..." value={specInput}
                    onChange={e => setSpecInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())} />
                  <button type="button" onClick={addSpecialty} className="px-3 py-1 bg-[#050505] text-white text-xs">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.specialties.map(s => (
                    <span key={s} className="text-xs bg-[#F6F6F3] px-2 py-1 flex items-center gap-1">{s}
                      <button type="button" onClick={() => setForm({ ...form, specialties: form.specialties.filter(x => x !== s) })} className="text-red-400"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </F>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Website URL"><input type="url" className="form-input" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} /></F>
                <F label="Facebook URL"><input type="url" className="form-input" value={form.facebook_url} onChange={e => setForm({ ...form, facebook_url: e.target.value })} /></F>
                <F label="Instagram URL"><input type="url" className="form-input" value={form.instagram_url} onChange={e => setForm({ ...form, instagram_url: e.target.value })} /></F>
                <F label="Contact Email"><input type="email" className="form-input" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></F>
                <F label="Contact Phone"><input type="text" className="form-input" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="Sort Order"><input type="number" className="form-input" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></F>
                <F label="Status">
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option><option value="published">Published</option>
                  </select>
                </F>
                <F label="Featured">
                  <label className="flex items-center gap-2 h-10 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm font-inter">Yes</span>
                  </label>
                </F>
              </div>
            </>
          )}

          {/* CONTENT */}
          {tab === 'content' && (
            <>
              <F label="Short Bio (English)"><textarea rows={3} className="form-input resize-none" value={typeof form.bio_short === 'object' ? form.bio_short.en : form.bio_short}
                onChange={e => setForm({ ...form, bio_short: { ...form.bio_short, en: e.target.value } })} /></F>
              <F label="Short Bio (Malayalam)"><textarea rows={3} className="form-input resize-none" value={typeof form.bio_short === 'object' ? (form.bio_short.ml || '') : ''}
                onChange={e => setForm({ ...form, bio_short: { ...form.bio_short, ml: e.target.value || null } })} /></F>
              <F label="Full Bio (English)"><textarea rows={6} className="form-input resize-none" value={typeof form.bio_long === 'object' ? form.bio_long.en : form.bio_long}
                onChange={e => setForm({ ...form, bio_long: { ...form.bio_long, en: e.target.value } })} /></F>
              <F label="Full Bio (Malayalam)"><textarea rows={6} className="form-input resize-none" value={typeof form.bio_long === 'object' ? (form.bio_long.ml || '') : ''}
                onChange={e => setForm({ ...form, bio_long: { ...form.bio_long, ml: e.target.value || null } })} /></F>
              <F label="Septa Collaboration Note (English)"><textarea rows={2} className="form-input resize-none"
                value={typeof form.septa_collaboration === 'object' ? form.septa_collaboration?.en || '' : form.septa_collaboration || ''}
                onChange={e => setForm({ ...form, septa_collaboration: { ...(form.septa_collaboration || {}), en: e.target.value } })} /></F>
            </>
          )}

          {tab === 'highlights' && <HighlightEditor items={form.highlights||[]} onChange={highlights=>setForm({...form,highlights})}/>}

          {/* MEDIA */}
          {tab === 'media' && (
            <>
              <p className="text-sm text-[#606060]">Each image has a separate purpose. The portrait identifies the person; the card is a wide image of their work or studio. Uploaded files are checked for the shape shown below. New image links are checked before saving as well. Existing images stay available until replaced.</p>
              {form.profile_type==='person'&&<MediaField field="portrait_image" label="Profile portrait" hint="Face photograph for identity and project credits; never stretched into the wide collaborator card." url={form.media.portrait_image} onUpload={e=>handleUpload(e,'portrait_image')} onClear={()=>setForm({...form,media:{...form.media,portrait_image:null}})} onUrlChange={v=>setForm({...form,media:{...form.media,portrait_image:v}})}/>}
              <MediaField field="card_image" label="Collaborator card image (16:9) *" hint="Wide image of the person's work or company, used across collaborator cards. Required for a published profile."
                url={form.media.card_image} onUpload={e => handleUpload(e, 'card_image')}
                onClear={() => setForm({ ...form, media: { ...form.media, card_image: null } })}
                onUrlChange={v => setForm({ ...form, media: { ...form.media, card_image: v } })} />
              <div className="border p-4 space-y-3"><h3 className="font-semibold">Additional collaborator card images (up to 6 total)</h3><p className="text-sm">Wide images will fade between on the collaborator card. The first image above is the fallback for older browsers.</p><MediaGuide field="card_image"/>{(form.media.card_images||[]).map((url,i)=><div key={i} className="flex gap-2 items-center border p-2"><img src={url} alt="" className="w-24 aspect-video object-cover"/><span className="text-xs">Slide {i+1}</span><button type="button" aria-label={`Remove collaborator card image ${i+1}`} className="media-remove-button" onClick={()=>setForm(f=>({...f,media:{...f.media,card_images:(f.media.card_images||[]).filter((_,n)=>n!==i),card_image:i===0?(f.media.card_images||[]).find((_,n)=>n!==i)||null:f.media.card_image}}))}><X size={15}/>Remove image</button></div>)}{(form.media.card_images||[]).length<6&&<label className="block text-xs">Upload another 16:9 image<input className="block" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e=>handleUpload(e,'card_image')}/></label>}</div>
              <MediaField field="logo_image" label="Logo Image" hint="Optional original logo, displayed on company profile. Do not generate an invented logo."
                url={form.media.logo_image} onUpload={e => handleUpload(e, 'logo_image')}
                onClear={() => setForm({ ...form, media: { ...form.media, logo_image: null } })}
                onUrlChange={v => setForm({ ...form, media: { ...form.media, logo_image: v } })} />
              <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={!!form.media.show_logo} onChange={e=>setForm({...form,media:{...form.media,show_logo:e.target.checked}})}/>Show the supplied logo beside the portrait and on collaborator cards</label>
              <MediaField field="hero_image" label="Hero Image (16:9)" hint="Full-width banner on detail page. Falls back to card image."
                url={form.media.hero_image} onUpload={e => handleUpload(e, 'hero_image')}
                onClear={() => setForm({ ...form, media: { ...form.media, hero_image: null } })}
                onUrlChange={v => setForm({ ...form, media: { ...form.media, hero_image: v } })} />
              <F label="Gallery Images (up to 10)">
                <MediaGuide field="gallery_images" />
                <div className="flex flex-wrap gap-2 mb-3">
                  {(form.media.gallery_images || []).map((img, i) => (
                    <div key={i} className="partner-gallery-editor-item">
                      <img src={img} alt="" className="h-20 w-28 object-cover border" />
                      <input className="form-input" aria-label={`Gallery image ${i+1} caption`} maxLength={24} placeholder={`Short image title (${24-(form.media.gallery_captions?.[i]||'').length} characters left)`} value={form.media.gallery_captions?.[i]||''} onChange={e=>setForm(f=>({...f,media:{...f.media,gallery_captions:(f.media.gallery_images||[]).map((_,n)=>n===i?e.target.value:f.media.gallery_captions?.[n]||'')}}))}/>
                      <span className="text-xs text-neutral-500">{(form.media.gallery_captions?.[i]||'').length}/24</span>
                      <button type="button" onClick={() => removeGalleryImage(i)} aria-label={`Remove gallery image ${i+1}`} className="media-remove-button"><X size={15}/>Remove image</button>
                    </div>
                  ))}
                </div>
                {(form.media.gallery_images || []).length < 10 && (
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#F6F6F3] text-[#050505] text-xs font-inter cursor-pointer hover:bg-[#ECECEA] transition-colors border border-[#8A8A8A]/30">
                    <Plus size={14} /> Add Image
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => handleUpload(e, 'gallery_images')} />
                  </label>
                )}
              </F>
              <section className="space-y-3"><h3>Profile videos</h3><p className="text-sm">Each video can have a custom 16:9 cover image. Visitors select a cover first; the video opens only after they press Play.</p><MediaGuide field="partner_video"/><MediaGuide field="video_poster"/><p className="text-sm">Upload approved MP4 or WebM videos up to 50 MB. Save the profile after uploading.</p><input type="file" accept="video/mp4,video/webm" disabled={uploading} onChange={e=>handleUpload(e,'videos')}/>{(form.media.videos||[]).map((url,i)=><div key={i} className="partner-video-editor-item"><label className="text-xs">Short film title · max 24 characters<input className="form-input mt-1" maxLength={24} placeholder={`Film ${String(i+1).padStart(2,'0')}`} value={form.media.video_titles?.[i]||''} onChange={e=>setForm(f=>({...f,media:{...f.media,video_titles:(f.media.videos||[]).map((_,n)=>n===i?e.target.value:f.media.video_titles?.[n]||'')}}))}/><span>{(form.media.video_titles?.[i]||'').length}/24</span></label><input className="form-input" value={url} onChange={e=>setForm(f=>({...f,media:{...f.media,videos:f.media.videos.map((v,n)=>n===i?e.target.value:v)}}))}/><input className="form-input" placeholder="Video cover image URL (16:9)" value={form.media.video_posters?.[i]||''} onChange={e=>setForm(f=>({...f,media:{...f.media,video_posters:(f.media.videos||[]).map((_,n)=>n===i?e.target.value:f.media.video_posters?.[n]||'')}}))}/><label className="text-xs">Upload cover<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const issue=await validateMediaRatio(file,'video_poster');if(issue){setFormError(issue);return;}setUploading(true);try{const result=await uploadFile(token,file,'video_poster');setForm(f=>({...f,media:{...f.media,video_posters:f.media.videos.map((_,n)=>n===i?result.url:f.media.video_posters?.[n]||'')}}));}catch(err){setFormError(errorMessage(err));}finally{setUploading(false);}}}/></label><button type="button" onClick={()=>setForm(f=>({...f,media:{...f.media,videos:f.media.videos.filter((_,n)=>n!==i),video_titles:(f.media.video_titles||[]).filter((_,n)=>n!==i),video_posters:(f.media.video_posters||[]).filter((_,n)=>n!==i)}}))}>Remove</button></div>)}<button type="button" onClick={()=>setForm(f=>({...f,media:{...f.media,videos:[...(f.media.videos||[]),''],video_titles:[...(f.media.video_titles||[]),'']}}))}>Add video URL</button></section>{mediaMessage&&<p role="status">{mediaMessage}</p>}{uploading && <div className="flex items-center gap-2 text-sm text-[#606060]"><Loader2 className="animate-spin" size={14} /> Uploading...</div>}
            </>
          )}

          <PublicationFields form={form} setForm={setForm} /><SEOFields token={token} onBusy={setUploading} value={form.seo} onChange={seo=>setForm({...form,seo})} />
          <div className="flex justify-end gap-3 pt-4 border-t border-[#8A8A8A]/20">
            <button type="button" onClick={closeEditor} className="px-4 py-2 text-sm font-inter text-[#050505]/60 hover:text-[#050505]">Cancel</button>
            <div>{formError&&<p role="alert" className="text-red-700">{formError}</p>}</div><button type="submit" disabled={saving||uploading} data-testid="save-partner-btn"
              className="flex items-center gap-2 px-4 py-2 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#262626] disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({ label, children }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">{label}</label>
      {children}
    </div>
  );
}

function MediaField({ field, label, hint, url, onUpload, onClear, onUrlChange }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-1">{label}</label>
      {hint && <p className="text-[10px] text-[#8A8A8A] mb-2">{hint}</p>}
      <MediaGuide field={field}/>
      <div className="flex flex-wrap gap-3 items-end">
        <input type="text" className="form-input flex-1" placeholder="Upload a file or paste an image address" value={url || ''}
          onChange={e => onUrlChange(e.target.value || null)} />
        <label className="flex items-center gap-2 px-4 py-2 bg-[#F6F6F3] text-[#050505] text-xs font-inter cursor-pointer hover:bg-[#ECECEA] transition-colors border border-[#8A8A8A]/30">
          <Upload size={14} /> Upload
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onUpload} />
        </label>
        {url && <button type="button" onClick={onClear} className="text-red-400 hover:text-red-600 p-2 text-xs">Clear</button>}
      </div>
      {url && <img src={url} alt="Preview" className="mt-2 h-20 object-cover border" />}
    </div>
  );
}

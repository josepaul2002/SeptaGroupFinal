import { cloneElement, useId } from 'react';
export function Field({ label, children }) {
  const id = useId();
  return <div><label className="block text-xs uppercase tracking-wider mb-2 text-neutral-600" htmlFor={id}>{label}</label>{cloneElement(children, { id, className: `form-input ${children.props.className || ''}` })}</div>;
}
export function BilingualField({ label, value, onChange, rows = 3 }) {
  return <div className="grid md:grid-cols-2 gap-4"><Field label={`${label} · English`}><textarea rows={rows} value={value?.en || ''} onChange={e => onChange({ ...value, en: e.target.value })} /></Field><Field label={`${label} · Malayalam`}><textarea lang="ml" rows={rows} value={value?.ml || ''} onChange={e => onChange({ ...value, ml: e.target.value })} /></Field></div>;
}
export function PublicationFields({ value, onChange, form, setForm }) {
  value = value || form;
  onChange = onChange || (updates => setForm(current => ({...current,...updates})));
  return <div className="p-4 bg-neutral-50 space-y-4"><Field label="Publication status"><select value={value.status || 'draft'} onChange={e => onChange({ status: e.target.value })}>{['draft', 'review', 'published', 'archived'].map(s => <option key={s}>{s}</option>)}</select></Field><label className="flex gap-3 text-sm"><input type="checkbox" checked={!!value.publication_reviewed} onChange={e => onChange({ publication_reviewed: e.target.checked })} />I have verified the facts, credits and permission to publish this content.</label><p className="text-xs text-neutral-500">Only reviewed, published records appear publicly. Restored revisions return to drafts.</p></div>;
}
export function SEOFields({ value = {}, onChange }) {
  return <div className="space-y-4"><p className="text-sm text-neutral-500">Leave blank to generate metadata from this record.</p>{[['title', 'Search title'], ['description', 'Description'], ['image', 'Social image URL']].map(([key,label]) => <Field key={key} label={label}><input value={value[key] || ''} onChange={e => onChange({ ...value, [key]: e.target.value })} /></Field>)}<label className="flex gap-3 text-sm"><input type="checkbox" checked={!!value.noindex} onChange={e => onChange({ ...value, noindex: e.target.checked })} />Exclude this page from search indexing</label><div className="p-4 border"><p className="font-medium">{value.title || 'Automatic page title'}</p><p className="text-sm text-neutral-600">{value.description || 'Automatic page description'}</p>{value.image && <img src={value.image} alt="Social preview" className="mt-3 max-h-40" />}</div></div>;
}

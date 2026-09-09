import { useState, useEffect } from 'react';
import { Loader2, Save, Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BLOCK_TYPES = {
  about: [
    { type: 'metrics', label: 'Metric', fields: ['title', 'subtitle'] },
    { type: 'timeline_step', label: 'Timeline Step', fields: ['title', 'body', 'icon'] },
    { type: 'team_member', label: 'Team Member', fields: ['title', 'body', 'image_url'] },
    { type: 'proof_callout', label: 'Proof Callout', fields: ['title', 'body', 'link_url', 'link_label'] },
  ],
  services: [
    { type: 'comparison_row', label: 'Comparison Row', fields: ['title', 'body', 'metadata.traditional'] },
  ],
};

const ICON_OPTIONS = ['clipboard-list', 'bar-chart-2', 'check-circle', 'file-text', 'search', 'shield', 'home', 'building', 'heart'];

export default function PageContentTab({ token }) {
  const [activePage, setActivePage] = useState('about');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/pages/${activePage}`)
      .then(r => setBlocks(r.data.blocks || []))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }, [activePage]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await axios.put(`${API}/pages/${activePage}`, { page_id: activePage, blocks }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('Saved');
    } catch { setMsg('Error'); }
    setSaving(false);
  };

  const addBlock = (type) => {
    const newBlock = {
      id: crypto.randomUUID(),
      block_type: type,
      order: blocks.filter(b => b.block_type === type).length,
      title: { en: '', ml: null },
      subtitle: { en: '', ml: null },
      body: { en: '', ml: null },
      image_url: null,
      icon: null,
      link_url: null,
      link_label: null,
      metadata: {},
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => {
      if (b.id !== id) return b;
      if (field.startsWith('metadata.')) {
        const key = field.replace('metadata.', '');
        return { ...b, metadata: { ...b.metadata, [key]: value } };
      }
      if (['title', 'subtitle', 'body'].includes(field)) {
        return { ...b, [field]: { ...(b[field] || {}), en: value } };
      }
      return { ...b, [field]: value };
    }));
  };

  const removeBlock = (id) => setBlocks(blocks.filter(b => b.id !== id));

  const updateBlockML = (id, field, value) => {
    setBlocks(blocks.map(b => b.id !== id ? b : { ...b, [field]: { ...(b[field] || {}), ml: value || null } }));
  };

  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === blocks.length - 1)) return;
    const arr = [...blocks];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    arr.forEach((b, i) => b.order = i);
    setBlocks(arr);
  };

  const blockTypes = BLOCK_TYPES[activePage] || [];
  const groupedBlocks = {};
  blockTypes.forEach(bt => { groupedBlocks[bt.type] = blocks.filter(b => b.block_type === bt.type); });

  return (
    <div className="space-y-4" data-testid="page-content-tab">
      <div className="flex gap-2">
        {['about', 'services'].map(p => (
          <button key={p} onClick={() => setActivePage(p)} data-testid={`page-tab-${p}`}
            className={`px-4 py-2 text-xs font-inter uppercase tracking-wider border-b-2 transition-colors ${
              activePage === p ? 'text-[#606060] border-[#606060] font-medium' : 'text-[#8A8A8A] border-transparent'
            }`}>{p}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#606060]" size={24} /></div>
      ) : (
        <>
          {blockTypes.map(bt => (
            <div key={bt.type} className="bg-white border border-[#8A8A8A]/20 p-5" data-testid={`block-group-${bt.type}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-sora font-medium text-[#050505]">{bt.label}s ({groupedBlocks[bt.type]?.length || 0})</h3>
                <button onClick={() => addBlock(bt.type)} data-testid={`add-${bt.type}`}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-inter text-[#606060] border border-[#606060]/30 hover:bg-[#050505] hover:text-white transition-colors">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {(groupedBlocks[bt.type] || []).map((block, i) => (
                  <div key={block.id} className="border border-[#8A8A8A]/15 p-4 hover:border-[#8A8A8A]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <GripVertical size={12} className="text-[#8A8A8A]" />
                      <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider">{bt.label} #{i + 1}</span>
                      <div className="ml-auto flex gap-1">
                        <button onClick={() => moveBlock(block.id, -1)} className="p-1 text-[#8A8A8A] hover:text-[#050505]"><ChevronUp size={12} /></button>
                        <button onClick={() => moveBlock(block.id, 1)} className="p-1 text-[#8A8A8A] hover:text-[#050505]"><ChevronDown size={12} /></button>
                        <button onClick={() => removeBlock(block.id)} className="p-1 text-red-400 hover:text-red-600" data-testid={`delete-block-${block.id}`}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bt.fields.includes('title') && (
                        <div>
                          <label className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1">Title (EN)</label>
                          <input className="form-input text-sm" value={block.title?.en || ''} onChange={e => updateBlock(block.id, 'title', e.target.value)} />
                          <input className="form-input text-sm mt-1.5" placeholder="Title (മലയാളം)" value={block.title?.ml || ''} onChange={e => updateBlockML(block.id, 'title', e.target.value)} />
                        </div>
                      )}
                      {bt.fields.includes('subtitle') && (
                        <div>
                          <label className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1">Subtitle (EN)</label>
                          <input className="form-input text-sm" value={block.subtitle?.en || ''} onChange={e => updateBlock(block.id, 'subtitle', e.target.value)} />
                          <input className="form-input text-sm mt-1.5" placeholder="Subtitle (മലയാളം)" value={block.subtitle?.ml || ''} onChange={e => updateBlockML(block.id, 'subtitle', e.target.value)} />
                        </div>
                      )}
                      {bt.fields.includes('body') && (
                        <div className="md:col-span-2">
                          <label className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1">Body (EN)</label>
                          <textarea rows={2} className="form-input text-sm resize-none" value={block.body?.en || ''} onChange={e => updateBlock(block.id, 'body', e.target.value)} />
                          <textarea rows={2} className="form-input text-sm resize-none mt-1.5" placeholder="Body (മലയാളം)" value={block.body?.ml || ''} onChange={e => updateBlockML(block.id, 'body', e.target.value)} />
                        </div>
                      )}
                      {bt.fields.includes('icon') && (
                        <div>
                          <label className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1">Icon</label>
                          <select className="form-input text-sm" value={block.icon || ''} onChange={e => updateBlock(block.id, 'icon', e.target.value)}>
                            <option value="">None</option>
                            {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                          </select>
                        </div>
                      )}
                      {bt.fields.includes('image_url') && (
                        <div>
                          <label className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1">Image URL</label>
                          <input className="form-input text-sm" value={block.image_url || ''} onChange={e => updateBlock(block.id, 'image_url', e.target.value || null)} />
                        </div>
                      )}
                      {bt.fields.includes('link_url') && (
                        <div>
                          <label className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1">Link URL</label>
                          <input className="form-input text-sm" value={block.link_url || ''} onChange={e => updateBlock(block.id, 'link_url', e.target.value || null)} />
                        </div>
                      )}
                      {bt.fields.includes('link_label') && (
                        <div>
                          <label className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1">Link Label</label>
                          <input className="form-input text-sm" value={block.link_label || ''} onChange={e => updateBlock(block.id, 'link_label', e.target.value || null)} />
                        </div>
                      )}
                      {bt.fields.includes('metadata.traditional') && (
                        <div className="md:col-span-2">
                          <label className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1">Traditional (comparison column)</label>
                          <input className="form-input text-sm" value={block.metadata?.traditional || ''} onChange={e => updateBlock(block.id, 'metadata.traditional', e.target.value)} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
            {msg && <p className={`text-sm ${msg === 'Saved' ? 'text-[#050505]' : 'text-red-500'}`}>{msg}</p>}
            <button onClick={save} disabled={saving} data-testid="save-page-content-btn"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#262626] transition-colors disabled:opacity-60 ml-auto">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save Page
            </button>
          </div>
        </>
      )}
    </div>
  );
}

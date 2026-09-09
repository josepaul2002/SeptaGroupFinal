import { useState } from 'react';
import { Eye, Trash2, Plus, Settings, Loader2 } from 'lucide-react';
import { useAdminPartners, getText } from '../../hooks/useApi';
import PartnerForm from './PartnerForm';

export default function PartnersTab({ token }) {
  const { partners, loading, createPartner, updatePartner, deletePartner } = useAdminPartners(token);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  if (loading) {
    return (
      <div className="bg-white border border-[#8A8A8A]/20 p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#606060]" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="partners-tab">
      <div className="bg-white border border-[#8A8A8A]/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-sora font-medium text-[#050505]">Partners ({partners.length})</h2>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#262626] transition-colors"
            data-testid="create-partner-btn"
          >
            <Plus size={14} /> Add Partner
          </button>
        </div>

        {partners.length === 0 ? (
          <p className="text-sm text-[#8A8A8A] py-8 text-center">No partners yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {partners.map(partner => (
              <div
                key={partner.slug}
                className="flex items-center justify-between p-4 border border-[#8A8A8A]/20 hover:border-[#606060]/30 transition-colors"
                data-testid={`partner-row-${partner.slug}`}
              >
                <div>
                  <p className="font-inter font-medium text-[#050505]">{getText(partner.name)}</p>
                  <p className="text-xs text-[#8A8A8A]">{partner.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-inter px-2 py-0.5 ${
                    partner.status === 'published' ? 'bg-[#050505] text-white' : 'bg-[#ECECEA] text-[#666666]'
                  }`}>
                    {partner.status}
                  </span>
                  <a
                    href={`/ecosystem/${partner.slug}?preview=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8A8A8A] hover:text-[#606060] p-1"
                    title="Preview"
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    onClick={() => setEditing(partner)}
                    className="text-[#606060] hover:text-[#8A8A8A] p-1"
                    title="Edit"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Delete this partner?')) deletePartner(partner.slug); }}
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

      {editing && (
        <PartnerForm
          partner={editing}
          token={token}
          onSave={(updates) => { updatePartner(editing.slug, updates); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
      {creating && (
        <PartnerForm
          token={token}
          onSave={async (data) => { await createPartner(data); setCreating(false); }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

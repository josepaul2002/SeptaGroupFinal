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
      <div className="bg-white border border-[#A7ADB5]/20 p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F5E5B]" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="partners-tab">
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
                  <a
                    href={`/ecosystem/${partner.slug}?preview=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C6A15B] hover:text-[#0F5E5B] p-1"
                    title="Preview"
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    onClick={() => setEditing(partner)}
                    className="text-[#0F5E5B] hover:text-[#C6A15B] p-1"
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

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useAdminLeads } from '../../hooks/useApi';

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

export default function LeadsTab({ token }) {
  const { leads, loading, updateStatus, deleteLead } = useAdminLeads(token);
  const [filter, setFilter] = useState('all');

  const filtered = leads.filter(l => filter === 'all' || l.status === filter);

  if (loading) {
    return (
      <div className="bg-white border border-[#A7ADB5]/20 p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F5E5B]" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#A7ADB5]/20 p-6" data-testid="leads-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-sora font-medium text-[#1F2328]">Leads ({leads.length})</h2>
        <div className="flex gap-2">
          {['all', 'new', 'contacted', 'qualified', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              data-testid={`leads-filter-${s}`}
              className={`px-3 py-1 text-xs font-inter border transition-colors ${
                filter === s ? 'bg-[#0F5E5B] text-white border-[#0F5E5B]' : 'border-[#A7ADB5]/30 text-[#1F2328]/60'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#A7ADB5] py-8 text-center">No leads found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#A7ADB5]/20">
                {['Name', 'Contact', 'Project', 'Status', 'Date', ''].map(h => (
                  <th key={h} className={`${h ? 'text-left' : 'text-right'} py-3 px-2 font-inter font-medium text-[#A7ADB5] text-xs uppercase tracking-wider`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className="border-b border-[#A7ADB5]/10 hover:bg-[#F3F0E8]/50" data-testid={`lead-row-${lead.id}`}>
                  <td className="py-3 px-2">
                    <p className="font-inter font-medium text-[#1F2328]">{lead.name}</p>
                    {lead.message && <p className="text-xs text-[#A7ADB5] mt-0.5 truncate max-w-[200px]">{lead.message}</p>}
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-inter text-[#0F5E5B]">{lead.phone}</p>
                    {lead.email && <p className="text-xs text-[#A7ADB5]">{lead.email}</p>}
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-inter text-[#1F2328]">{lead.project_type || '-'}</p>
                    <p className="text-xs text-[#A7ADB5]">{lead.project_location || '-'}</p>
                  </td>
                  <td className="py-3 px-2">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`text-xs font-inter px-2 py-1 border-0 outline-none cursor-pointer ${statusColors[lead.status] || 'bg-gray-100'}`}
                      data-testid={`lead-status-${lead.id}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="py-3 px-2 text-xs text-[#A7ADB5]">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => { if (window.confirm('Delete this lead?')) deleteLead(lead.id); }}
                      className="text-red-400 hover:text-red-600 p-1"
                      data-testid={`delete-lead-${lead.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

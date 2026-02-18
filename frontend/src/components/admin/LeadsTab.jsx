import { useState, useEffect } from 'react';
import { Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

export default function LeadsTab({ token }) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const limit = 25;

  const fetchLeads = () => {
    setLoading(true);
    const params = new URLSearchParams({ skip: page * limit, limit });
    if (filter !== 'all') params.set('status', filter);
    axios.get(`${API}/leads?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setLeads(r.data.leads || r.data); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [token, page, filter]);

  const updateStatus = async (id, status) => {
    await axios.patch(`${API}/leads/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
    fetchLeads();
  };

  const deleteLead = async (id) => {
    await axios.delete(`${API}/leads/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchLeads();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white border border-[#A7ADB5]/20 p-6" data-testid="leads-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-sora font-medium text-[#1F2328]">Leads ({total})</h2>
        <div className="flex gap-2">
          {['all', 'new', 'contacted', 'qualified', 'closed'].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(0); }} data-testid={`leads-filter-${s}`}
              className={`px-3 py-1 text-xs font-inter border transition-colors ${
                filter === s ? 'bg-[#0F5E5B] text-white border-[#0F5E5B]' : 'border-[#A7ADB5]/30 text-[#1F2328]/60'
              }`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#0F5E5B]" size={24} /></div>
      ) : leads.length === 0 ? (
        <p className="text-sm text-[#A7ADB5] py-8 text-center">No leads found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#A7ADB5]/20">
                {['Name', 'Contact', 'Project', 'Budget', 'Status', 'Date', ''].map(h => (
                  <th key={h} className={`${h ? 'text-left' : 'text-right'} py-3 px-2 font-inter font-medium text-[#A7ADB5] text-xs uppercase tracking-wider`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b border-[#A7ADB5]/10 hover:bg-[#F3F0E8]/50" data-testid={`lead-row-${lead.id}`}>
                  <td className="py-3 px-2">
                    <p className="font-inter font-medium text-[#1F2328]">{lead.name}</p>
                    {lead.message && <p className="text-xs text-[#A7ADB5] mt-0.5 truncate max-w-[180px]">{lead.message}</p>}
                    {lead.partner_ref && <p className="text-[10px] text-[#0F5E5B]">via {lead.partner_ref}</p>}
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
                    <p className="text-xs text-[#1F2328]">{lead.budget_range || '-'}</p>
                    <p className="text-[10px] text-[#A7ADB5]">{lead.timeline || ''}</p>
                  </td>
                  <td className="py-3 px-2">
                    <select value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`text-xs font-inter px-2 py-1 border-0 outline-none cursor-pointer ${statusColors[lead.status] || 'bg-gray-100'}`}
                      data-testid={`lead-status-${lead.id}`}>
                      <option value="new">New</option><option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option><option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="py-3 px-2 text-xs text-[#A7ADB5]">{new Date(lead.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-2 text-right">
                    <button onClick={() => { if (window.confirm('Delete?')) deleteLead(lead.id); }}
                      className="text-red-400 hover:text-red-600 p-1" data-testid={`delete-lead-${lead.id}`}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#A7ADB5]/10">
          <p className="text-xs text-[#A7ADB5]">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1 text-xs border border-[#A7ADB5]/30 disabled:opacity-30" data-testid="leads-prev">
              <ChevronLeft size={12} /> Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1 text-xs border border-[#A7ADB5]/30 disabled:opacity-30" data-testid="leads-next">
              Next <ChevronRight size={12} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Loader2, Clock, User, Filter } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const actionColors = {
  create: 'bg-[#050505] text-white',
  update: 'bg-[#262626] text-white',
  delete: 'bg-[#8A8A8A] text-white',
  upload: 'bg-[#606060] text-white',
  export: 'bg-[#ECECEA] text-[#666666]',
  password_change: 'bg-[#171717] text-white',
};

const RESOURCE_TYPES = ['all', 'project', 'partner', 'lead', 'testimonial', 'site_settings', 'page_content', 'media', 'admin'];

export default function AuditLogTab({ token }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const limit = 30;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ skip: page * limit, limit });
    if (filter !== 'all') params.set('resource_type', filter);
    axios.get(`${API}/audit-logs?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setLogs(r.data.logs || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, filter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4" data-testid="audit-log-tab">
      <div className="bg-white border border-[#8A8A8A]/20 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-sora font-medium text-[#050505]">Audit Log ({total})</h2>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#8A8A8A]" />
            <select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}
              className="text-xs font-inter border border-[#8A8A8A]/30 px-2 py-1 outline-none" data-testid="audit-filter">
              {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#606060]" size={24} /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-[#8A8A8A] py-8 text-center">No audit entries</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={log.id || i} className="flex items-start gap-3 py-2.5 border-b border-[#8A8A8A]/10 last:border-0" data-testid={`audit-row-${i}`}>
                <span className={`text-[10px] font-inter font-medium px-1.5 py-0.5 uppercase tracking-wider flex-shrink-0 mt-0.5 ${actionColors[log.action] || 'bg-[#ECECEA] text-[#666666]'}`}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-inter text-[#050505]">
                    <span className="font-medium">{log.resource_type}</span>
                    {log.resource_id && <span className="text-[#8A8A8A]"> · {log.resource_id.slice(0, 8)}...</span>}
                  </p>
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <p className="text-[10px] text-[#8A8A8A] mt-0.5 truncate">
                      Changed: {Object.keys(log.changes).filter(k => k !== '_id').join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-inter text-[#8A8A8A] flex items-center gap-1">
                    <User size={9} />{log.admin_email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] font-inter text-[#8A8A8A] flex items-center gap-1">
                    <Clock size={9} />{new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#8A8A8A]/10">
            <p className="text-xs text-[#8A8A8A]">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 text-xs border border-[#8A8A8A]/30 disabled:opacity-30" data-testid="audit-prev">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs border border-[#8A8A8A]/30 disabled:opacity-30" data-testid="audit-next">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

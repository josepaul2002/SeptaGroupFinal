import IntegrationsPanel from './IntegrationsPanel';
import { useState } from 'react';
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = `${(process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '')}/api`;

export default function AccountTab({ token, email, authMode='password' }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.new_password.length < 12) {
      setMsg({ ok: false, text: 'New password must be at least 12 characters' });
      return;
    }
    if (form.new_password !== form.confirm) {
      setMsg({ ok: false, text: 'New passwords do not match' });
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/admin/change-password`,
        { current_password: form.current_password, new_password: form.new_password },
        { headers: { Authorization: `Bearer ${token}` } });
      sessionStorage.removeItem('septa-admin-token');
      window.location.assign('/admin');
      setForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.detail || 'Could not change password' });
    }
    setSaving(false);
  };

  const inputCls = 'w-full h-10 px-3 text-sm font-inter border border-[#8A8A8A]/30 bg-white text-[#050505] outline-none focus:border-[#606060] transition-colors';
  const labelCls = 'text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2';

  if (authMode === 'google') return <><div className="max-w-md bg-white border border-[#8A8A8A]/20 p-6 space-y-4"><h2 className="text-lg font-sora font-medium">Workspace account</h2><p className="text-sm">Signed in as {email}. Manage your password, passkey, and two-step verification in Google Workspace. Ask a Septa owner to change your website role or disable your access.</p><a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline text-sm">Open Google account security</a></div><IntegrationsPanel token={token}/></>;

  return (
    <div className="max-w-md" data-testid="account-tab">
      <div className="flex items-center gap-3 mb-6">
        <KeyRound size={18} className="text-[#606060]" />
        <h2 className="text-lg font-sora font-medium text-[#050505]">Change Password</h2>
      </div>
      <p className="text-sm font-inter text-[#050505]/55 mb-6">
        Signed in as <span className="text-[#050505]">{email}</span>
      </p>

      <form onSubmit={submit} className="flex flex-col gap-5 bg-white border border-[#8A8A8A]/20 p-6">
        <div>
          <label className={labelCls}>Current Password</label>
          <input type="password" required autoComplete="current-password" className={inputCls}
            value={form.current_password}
            onChange={e => setForm({ ...form, current_password: e.target.value })}
            data-testid="current-password-input" />
        </div>
        <div>
          <label className={labelCls}>New Password</label>
          <input type="password" required autoComplete="new-password" className={inputCls}
            value={form.new_password}
            onChange={e => setForm({ ...form, new_password: e.target.value })}
            data-testid="new-password-input" />
          <p className="text-[11px] font-inter text-[#8A8A8A] mt-1.5">Minimum 12 characters</p>
        </div>
        <div>
          <label className={labelCls}>Confirm New Password</label>
          <input type="password" required autoComplete="new-password" className={inputCls}
            value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })}
            data-testid="confirm-password-input" />
        </div>

        {msg && (
          <div className={`flex items-center gap-2 text-sm font-inter ${msg.ok ? 'text-[#166534]' : 'text-red-500'}`}
            data-testid="change-password-message">
            {msg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{msg.text}
          </div>
        )}

        <button type="submit" disabled={saving} data-testid="change-password-btn"
          className="h-11 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#262626] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="animate-spin" size={16} /> : 'Update Password'}
        </button>
      </form>
      <IntegrationsPanel token={token}/>
    </div>
  );
}

import { useState } from 'react';
import { Download, Lock, Loader2 } from 'lucide-react';
import { exportContent } from '../../hooks/useApi';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsTab({ token }) {
  const [exporting, setExporting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '' });
  const [pwMsg, setPwMsg] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportContent(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `septa-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed');
    }
    setExporting(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    try {
      await axios.post(`${API}/admin/change-password`, {
        current_password: passwordForm.current,
        new_password: passwordForm.newPass
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPwMsg('Password changed successfully');
      setPasswordForm({ current: '', newPass: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.detail || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6" data-testid="settings-tab">
      <div className="bg-white border border-[#A7ADB5]/20 p-6">
        <h2 className="text-lg font-sora font-medium text-[#1F2328] mb-4">Export Content</h2>
        <p className="text-sm text-[#A7ADB5] mb-4">Download all projects and partners as JSON for backup.</p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] transition-colors disabled:opacity-60"
          data-testid="export-content-btn"
        >
          {exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
          Export as JSON
        </button>
      </div>

      <div className="bg-white border border-[#A7ADB5]/20 p-6">
        <h2 className="text-lg font-sora font-medium text-[#1F2328] mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          <div>
            <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Current Password</label>
            <input type="password" required className="w-full h-10 px-3 text-sm font-inter border border-[#A7ADB5]/30 bg-transparent outline-none focus:border-[#0F5E5B]"
              value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">New Password</label>
            <input type="password" required minLength={8} className="w-full h-10 px-3 text-sm font-inter border border-[#A7ADB5]/30 bg-transparent outline-none focus:border-[#0F5E5B]"
              value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })} />
          </div>
          {pwMsg && <p className={`text-sm ${pwMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>}
          <button type="submit" data-testid="change-password-btn"
            className="flex items-center gap-2 px-4 py-2 bg-[#1F2328] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#1F2328]/80 transition-colors">
            <Lock size={14} /> Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

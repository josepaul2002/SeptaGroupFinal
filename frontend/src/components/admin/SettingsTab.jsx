import { useState, useEffect } from 'react';
import { Download, Loader2, Save } from 'lucide-react';
import { exportContent } from '../../hooks/useApi';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsTab({ token }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState('');
  const [activeSection, setActiveSection] = useState('contact');

  useEffect(() => {
    axios.get(`${API}/settings`).then(r => setSettings(r.data)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await axios.put(`${API}/settings`, settings, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('Settings saved');
    } catch { setMsg('Save failed'); }
    setSaving(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportContent(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `septa-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
    setExporting(false);
  };

  const handleExportCSV = async () => {
    try {
      const res = await axios.get(`${API}/leads/export-csv`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `septa-leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert('CSV export failed'); }
  };

  const updateContact = (key, val) => {
    setSettings({ ...settings, contact: { ...settings.contact, [key]: val } });
  };

  const updateEnquiry = (key, val) => {
    setSettings({ ...settings, enquiry: { ...settings.enquiry, [key]: val } });
  };

  const updateListField = (section, key, val) => {
    const items = val.split('\n').map(s => s.trim()).filter(Boolean);
    if (section === 'contact') updateContact(key, items);
    else updateEnquiry(key, items);
  };

  if (loading || !settings) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[#0F5E5B]" size={24} /></div>;

  const sections = [
    { id: 'contact', label: 'Contact Info' },
    { id: 'enquiry', label: 'Enquiry Form' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'language', label: 'Language Mode' },
    { id: 'export', label: 'Export / Backup' },
  ];

  const navItems = [
    { key: 'about', label: 'About' },
    { key: 'services', label: 'Services' },
    { key: 'projects', label: 'Projects' },
    { key: 'ecosystem', label: 'Ecosystem' },
    { key: 'contact', label: 'Contact' },
  ];

  const navVis = settings.nav_visibility || {};
  const toggleNav = (key) => {
    setSettings({
      ...settings,
      nav_visibility: { ...navVis, [key]: navVis[key] === false ? true : false },
    });
  };

  return (
    <div className="space-y-6" data-testid="settings-tab">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-[#A7ADB5]/20 pb-0">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            data-testid={`settings-section-${s.id}`}
            className={`px-4 py-2.5 text-xs font-inter uppercase tracking-wider border-b-2 transition-colors ${
              activeSection === s.id ? 'text-[#0F5E5B] border-[#0F5E5B] font-medium' : 'text-[#A7ADB5] border-transparent hover:text-[#1F2328]'
            }`}>{s.label}</button>
        ))}
      </div>

      {/* CONTACT INFO */}
      {activeSection === 'contact' && (
        <div className="bg-white border border-[#A7ADB5]/20 p-6 space-y-4">
          <h3 className="text-sm font-sora font-medium text-[#1F2328] mb-2">Contact Details</h3>
          <p className="text-xs text-[#A7ADB5] mb-4">These appear in the footer and contact page.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone (Display)" val={settings.contact.phone_display} set={v => updateContact('phone_display', v)} tid="phone-display" />
            <Field label="Phone (tel: link)" val={settings.contact.phone_link} set={v => updateContact('phone_link', v)} tid="phone-link" />
            <Field label="WhatsApp Number" val={settings.contact.whatsapp_number} set={v => updateContact('whatsapp_number', v)} tid="whatsapp-num" />
            <Field label="WhatsApp Link" val={settings.contact.whatsapp_link} set={v => updateContact('whatsapp_link', v)} tid="whatsapp-link" />
            <Field label="Email" val={settings.contact.email} set={v => updateContact('email', v)} tid="email" />
            <Field label="Map Link" val={settings.contact.map_link} set={v => updateContact('map_link', v)} tid="map-link" />
          </div>
          <Field label="Office Address (Full)" val={settings.contact.office_address} set={v => updateContact('office_address', v)} tid="address" />
          <Field label="Office Address (Short)" val={settings.contact.office_address_short} set={v => updateContact('office_address_short', v)} tid="address-short" />
          <div>
            <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Operating Districts (one per line)</label>
            <textarea rows={4} className="form-input resize-none" data-testid="operating-districts"
              value={(settings.contact.operating_districts || []).join('\n')}
              onChange={e => updateListField('contact', 'operating_districts', e.target.value)} />
          </div>
          <Field label="Footer Tagline" val={settings.footer_tagline || ''} set={v => setSettings({ ...settings, footer_tagline: v })} tid="footer-tagline" />
        </div>
      )}

      {/* ENQUIRY FORM */}
      {activeSection === 'enquiry' && (
        <div className="bg-white border border-[#A7ADB5]/20 p-6 space-y-4">
          <h3 className="text-sm font-sora font-medium text-[#1F2328] mb-2">Enquiry Form Options</h3>
          <p className="text-xs text-[#A7ADB5] mb-4">Customize dropdowns in the contact form.</p>
          <Field label="Lead Notification Email" val={settings.enquiry.lead_notification_email || ''} set={v => updateEnquiry('lead_notification_email', v)} tid="notif-email" />
          <div>
            <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Project Types (one per line)</label>
            <textarea rows={6} className="form-input resize-none" data-testid="project-types-list"
              value={(settings.enquiry.project_types || []).join('\n')}
              onChange={e => updateListField('enquiry', 'project_types', e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Budget Ranges (one per line)</label>
            <textarea rows={5} className="form-input resize-none" data-testid="budget-ranges-list"
              value={(settings.enquiry.budget_ranges || []).join('\n')}
              onChange={e => updateListField('enquiry', 'budget_ranges', e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Timeline Ranges (one per line)</label>
            <textarea rows={5} className="form-input resize-none" data-testid="timeline-ranges-list"
              value={(settings.enquiry.timeline_ranges || []).join('\n')}
              onChange={e => updateListField('enquiry', 'timeline_ranges', e.target.value)} />
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      {activeSection === 'navigation' && (
        <div className="bg-white border border-[#A7ADB5]/20 p-6 space-y-4" data-testid="nav-visibility-section">
          <h3 className="text-sm font-sora font-medium text-[#1F2328] mb-2">Navigation Menu Visibility</h3>
          <p className="text-xs text-[#A7ADB5] mb-4">Show or hide pages in the header and mobile menu. Hidden pages are removed from the menu but still reachable by direct URL. Home is always shown.</p>
          <div className="space-y-2">
            {navItems.map(item => {
              const on = navVis[item.key] !== false;
              return (
                <div key={item.key} className="flex items-center justify-between p-3 border border-[#A7ADB5]/20"
                  data-testid={`nav-toggle-row-${item.key}`}>
                  <span className="text-sm font-inter text-[#1F2328]">{item.label}</span>
                  <button type="button" onClick={() => toggleNav(item.key)}
                    data-testid={`nav-toggle-${item.key}`}
                    role="switch" aria-checked={on}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-[#0F5E5B]' : 'bg-[#A7ADB5]/40'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LANGUAGE MODE */}
      {activeSection === 'language' && (        <div className="bg-white border border-[#A7ADB5]/20 p-6 space-y-4">
          <h3 className="text-sm font-sora font-medium text-[#1F2328] mb-2">Content Language Mode</h3>
          <p className="text-xs text-[#A7ADB5] mb-4">Controls how bilingual content is displayed. Navigation and buttons always stay in English.</p>
          {['english_only', 'malayalam_primary', 'toggle'].map(mode => (
            <label key={mode} className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
              settings.content_language_mode === mode ? 'border-[#0F5E5B] bg-[#E8F0EF]/30' : 'border-[#A7ADB5]/20'
            }`} data-testid={`lang-mode-${mode}`}>
              <input type="radio" name="lang_mode" checked={settings.content_language_mode === mode}
                onChange={() => setSettings({ ...settings, content_language_mode: mode })}
                className="mt-0.5" />
              <div>
                <p className="text-sm font-inter font-medium text-[#1F2328]">
                  {mode === 'english_only' ? 'English Only' : mode === 'malayalam_primary' ? 'Malayalam Primary + English Secondary' : 'User Toggle (EN / മലയാളം)'}
                </p>
                <p className="text-xs text-[#A7ADB5] mt-0.5">
                  {mode === 'english_only' ? 'Show only English content everywhere.' :
                   mode === 'malayalam_primary' ? 'Show Malayalam first with English below (if Malayalam exists).' :
                   'Show a toggle button for users to switch content language.'}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* EXPORT */}
      {activeSection === 'export' && (
        <div className="bg-white border border-[#A7ADB5]/20 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-sora font-medium text-[#1F2328] mb-2">Export Content</h3>
            <div className="flex gap-3">
              <button onClick={handleExport} disabled={exporting} data-testid="export-json-btn"
                className="flex items-center gap-2 px-4 py-2 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] transition-colors disabled:opacity-60">
                {exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />} Export JSON
              </button>
              <button onClick={handleExportCSV} data-testid="export-csv-btn"
                className="flex items-center gap-2 px-4 py-2 border border-[#0F5E5B] text-[#0F5E5B] text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0F5E5B] hover:text-white transition-colors">
                <Download size={14} /> Export Leads CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Bar */}
      {activeSection !== 'export' && (
        <div className="flex items-center justify-between">
          {msg && <p className={`text-sm font-inter ${msg.includes('saved') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
          <button onClick={save} disabled={saving} data-testid="save-settings-btn"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] transition-colors disabled:opacity-60 ml-auto">
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save Settings
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, val, set, tid }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">{label}</label>
      <input type="text" className="form-input" value={val || ''} onChange={e => set(e.target.value)} data-testid={tid} />
    </div>
  );
}

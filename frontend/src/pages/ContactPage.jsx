import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle, ArrowRight, CheckCircle2, Loader2, Send } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useSiteSettings } from '../hooks/useApi';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ContactPage() {
  useScrollReveal();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [searchParams] = useSearchParams();
  const partnerRef = searchParams.get('partner') || '';
  const serviceRef = searchParams.get('ref') || '';

  const [form, setForm] = useState({
    name: '', phone: '', email: '', project_type: '', project_location: '',
    budget_range: '', timeline: '', message: '', honeypot: '',
    partner_ref: partnerRef, service_ref: serviceRef, page_source: 'contact'
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); document.title = 'Contact — Septa Group'; }, []);

  const contact = settings?.contact || {};
  const enquiry = settings?.enquiry || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.honeypot) return; // spam trap
    setSending(true); setError('');
    try {
      await axios.post(`${API}/leads`, form);
      setSent(true);
    } catch (err) {
      setError(err.response?.status === 429 ? 'Too many requests. Please wait a moment.' : 'Something went wrong. Please try again.');
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="pt-16 min-h-screen bg-[#F6F6F3] flex items-center justify-center" data-testid="contact-success">
        <div className="text-center max-w-md px-6">
          <div className="w-14 h-14 bg-[#E8F0EF] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-[#606060]" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-sora font-light text-[#050505] mb-3">Enquiry Received</h1>
          <p className="text-sm font-inter font-light text-[#050505]/55 leading-relaxed mb-6">
            Thank you, {form.name}. Our team will review your enquiry and get back to you within 24 hours.
          </p>
          <a href="/" className="text-sm font-inter text-[#606060] hover:underline">Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16" data-testid="contact-page">
      {/* Hero */}
      <section className="bg-[#F6F6F3] py-14 md:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3 reveal">Contact</p>
          <h1 className="text-4xl md:text-5xl font-sora font-light text-[#050505] tracking-tight leading-tight reveal reveal-delay-1">
            Start a Conversation
          </h1>
          <p className="text-base font-inter font-light text-[#050505]/55 leading-relaxed max-w-xl mt-5 reveal reveal-delay-2">
            Tell us about your project. We'll respond with an honest assessment of fit, scope, and next steps.
          </p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8 reveal">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-5">Get in Touch</p>
                <div className="space-y-5">
                  <ContactItem icon={<Phone size={16} strokeWidth={1.5} />} label="Phone"
                    value={contact.phone_display || '+91 XXXXX XXXXX'}
                    href={contact.phone_link} tid="contact-phone" />
                  <ContactItem icon={<Mail size={16} strokeWidth={1.5} />} label="Email"
                    value={contact.email || 'info@septagroup.in'}
                    href={`mailto:${contact.email || 'info@septagroup.in'}`} tid="contact-email" />
                  <ContactItem icon={<MapPin size={16} strokeWidth={1.5} />} label="Office"
                    value={contact.office_address || 'Kerala, India'} tid="contact-address" />
                  {contact.whatsapp_link && (
                    <ContactItem icon={<MessageCircle size={16} strokeWidth={1.5} />} label="WhatsApp"
                      value="Chat with us"
                      href={contact.whatsapp_link} tid="contact-whatsapp" external />
                  )}
                </div>
              </div>

              {contact.operating_districts?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-3">Operating Districts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.operating_districts.map(d => (
                      <span key={d} className="text-xs font-inter px-2 py-0.5 bg-[#F6F6F3] text-[#050505]/60 border border-[#8A8A8A]/15">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="lg:col-span-8 reveal reveal-delay-1">
              <form onSubmit={handleSubmit} className="space-y-5" data-testid="enquiry-form">
                {/* Honeypot */}
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off"
                    value={form.honeypot} onChange={e => setForm({ ...form, honeypot: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Full Name *</label>
                    <input type="text" required className="form-input" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} data-testid="input-name" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Phone *</label>
                    <input type="tel" required className="form-input" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="input-phone" />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Email</label>
                  <input type="email" className="form-input" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} data-testid="input-email" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Project Type</label>
                    <select className="form-input" value={form.project_type}
                      onChange={e => setForm({ ...form, project_type: e.target.value })} data-testid="input-project-type">
                      <option value="">Select...</option>
                      {(enquiry.project_types || []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Project Location</label>
                    <input type="text" className="form-input" placeholder="City / District"
                      value={form.project_location}
                      onChange={e => setForm({ ...form, project_location: e.target.value })} data-testid="input-location" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Budget Range</label>
                    <select className="form-input" value={form.budget_range}
                      onChange={e => setForm({ ...form, budget_range: e.target.value })} data-testid="input-budget">
                      <option value="">Select...</option>
                      {(enquiry.budget_ranges || []).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Expected Timeline</label>
                    <select className="form-input" value={form.timeline}
                      onChange={e => setForm({ ...form, timeline: e.target.value })} data-testid="input-timeline">
                      <option value="">Select...</option>
                      {(enquiry.timeline_ranges || []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-[#050505]/50 font-inter block mb-2">Message</label>
                  <textarea rows={4} className="form-input resize-none" placeholder="Tell us about your project..."
                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} data-testid="input-message" />
                </div>

                {partnerRef && (
                  <p className="text-xs font-inter text-[#606060] bg-[#E8F0EF] px-3 py-2">
                    Referred from partner: <strong>{partnerRef}</strong>
                  </p>
                )}

                {error && <p className="text-sm text-red-500 font-inter" data-testid="form-error">{error}</p>}

                <button type="submit" disabled={sending} data-testid="submit-enquiry-btn"
                  className="h-12 px-8 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#262626] transition-colors flex items-center gap-2 disabled:opacity-60">
                  {sending ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Submit Enquiry</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactItem({ icon, label, value, href, tid, external }) {
  const Tag = href ? 'a' : 'div';
  const linkProps = href ? { href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } : {};
  return (
    <Tag {...linkProps} className="flex items-start gap-3 group" data-testid={tid}>
      <div className="w-8 h-8 bg-[#E8F0EF] flex items-center justify-center flex-shrink-0 text-[#606060]">{icon}</div>
      <div>
        <p className="text-xs font-inter text-[#8A8A8A] uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-inter text-[#050505] mt-0.5 ${href ? 'group-hover:text-[#606060] transition-colors' : ''}`}>{value}</p>
      </div>
    </Tag>
  );
}

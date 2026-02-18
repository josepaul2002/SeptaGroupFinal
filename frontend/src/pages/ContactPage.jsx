import { useEffect, useState } from 'react';
import axios from 'axios';
import { Phone, MessageCircle, ArrowRight, CheckCircle2, MapPin, Mail, ChevronDown } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const faqs = [
  {
    q: 'How do you provide a quote?',
    a: 'We prepare a scope document first — listing every assumption, inclusion, and exclusion. The quotation is built on this scope, so you can compare it accurately against other contractors who may be quoting different scope. We do not quote per sqft for complex projects — that metric misses too much.',
  },
  {
    q: 'Do you do turnkey construction?',
    a: 'Yes. Turnkey delivery — from foundation to finishing, including M&E, waterproofing, and final paint — is our standard offering. We can also work to a shell-and-core specification if you have tenant fit-out requirements to coordinate separately.',
  },
  {
    q: 'How do you handle changes during construction?',
    a: 'Every change is documented in a Change Order before work proceeds. The Change Order defines the scope change, the cost impact, and the programme impact. No variation is absorbed silently and no variation is charged without client approval in writing.',
  },
  {
    q: 'What districts in Kerala do you operate in?',
    a: 'We primarily operate across Ernakulam, Thrissur, Kozhikode, Trivandrum, and Kottayam. For larger institutional or commercial projects, we are available to operate statewide. Please mention your location in the enquiry form.',
  },
  {
    q: 'What is your minimum project size?',
    a: 'We typically work on projects with a construction value of ₹80 lakhs and above. For Project Management Consulting engagements, the threshold is lower. If your project is smaller, write to us — we can advise appropriately.',
  },
];

function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#A7ADB5]/20" data-testid={`faq-item-${index}`}>
      <button
        onClick={() => setOpen(!open)}
        data-testid={`faq-toggle-${index}`}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-sm md:text-base font-inter font-medium text-[#1F2328] pr-4">{faq.q}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`flex-shrink-0 text-[#A7ADB5] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed pb-5">
          {faq.a}
        </p>
      )}
    </div>
  );
}

export default function ContactPage() {
  useScrollReveal();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', project_location: '', project_type: '',
    budget_range: '', timeline: '', message: '', honeypot: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null);

  useEffect(() => {
    document.title = 'Contact Septa Group — Start a Construction Enquiry';
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.honeypot) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, form);
      setFormStatus('success');
      setForm({ name: '', phone: '', email: '', project_location: '', project_type: '', budget_range: '', timeline: '', message: '', honeypot: '' });
    } catch {
      setFormStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 md:py-28 bg-[#1F2328]" data-testid="contact-hero">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#C6A15B] font-inter mb-4 reveal">Contact</p>
            <h1 className="text-4xl md:text-6xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight mb-6 reveal reveal-delay-1">
              Start a<br />Conversation
            </h1>
            <p className="text-base md:text-lg font-inter font-light text-[#F3F0E8]/50 leading-relaxed reveal reveal-delay-2">
              Fill in the form below and we will respond within 24 hours. Or reach us directly by phone or WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Contact + Form */}
      <section className="py-16 md:py-24 bg-[#F3F0E8]" data-testid="contact-main">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Contact Info */}
            <div className="lg:col-span-4 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-6">Reach Us</p>

              <div className="space-y-6 mb-10">
                <a
                  href="tel:+919876543210"
                  data-testid="contact-phone-link"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-11 h-11 bg-[#0F5E5B] flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-0.5">Phone</p>
                    <p className="text-sm font-inter font-medium text-[#1F2328] group-hover:text-[#0F5E5B] transition-colors">
                      +91 XXXXX XXXXX — Placeholder
                    </p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/919876543210?text=${encodeURIComponent('Hello Septa Group, I would like to discuss a project.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-whatsapp-link"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-11 h-11 bg-[#25D366] flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={16} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-0.5">WhatsApp</p>
                    <p className="text-sm font-inter font-medium text-[#1F2328] group-hover:text-[#25D366] transition-colors">
                      Message Us Directly
                    </p>
                  </div>
                </a>

                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#E8E6E0] flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-[#1F2328]/40" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-0.5">Email</p>
                    <p className="text-sm font-inter font-medium text-[#1F2328]">info@septagroup.in — Placeholder</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-[#E8E6E0] flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-[#1F2328]/40" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-0.5">Office</p>
                    <p className="text-sm font-inter font-medium text-[#1F2328]">[Office Address]</p>
                    <p className="text-xs font-inter text-[#A7ADB5] mt-0.5">Kerala, India — Placeholder</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#A7ADB5]/20 pt-6">
                <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-2">Operating Districts</p>
                <p className="text-sm font-inter text-[#1F2328]/60 leading-relaxed">
                  Ernakulam, Thrissur, Kozhikode, Trivandrum, Kottayam — and statewide for larger projects.
                </p>
                <p className="text-xs font-inter text-[#A7ADB5] mt-1">[Districts to be confirmed — placeholder]</p>
              </div>
            </div>

            {/* Full Form */}
            <div className="lg:col-span-8 reveal reveal-delay-1">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-8">Project Enquiry Form</p>

              <form onSubmit={handleSubmit} className="space-y-7" data-testid="contact-form">
                {/* Honeypot */}
                <input type="text" name="honeypot" className="hidden" tabIndex="-1" autoComplete="off"
                  value={form.honeypot} onChange={handleChange} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Full Name *</label>
                    <input type="text" name="name" required className="input-underline" placeholder="Your full name"
                      data-testid="contact-name" value={form.name} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Phone Number *</label>
                    <input type="tel" name="phone" required className="input-underline" placeholder="+91 XXXXX XXXXX"
                      data-testid="contact-phone" value={form.phone} onChange={handleChange} />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Email Address</label>
                  <input type="email" name="email" className="input-underline" placeholder="your@email.com"
                    data-testid="contact-email" value={form.email} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Project Location</label>
                    <input type="text" name="project_location" className="input-underline" placeholder="District / City"
                      data-testid="contact-location" value={form.project_location} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Project Type</label>
                    <select name="project_type" className="input-underline"
                      data-testid="contact-project-type" value={form.project_type} onChange={handleChange}>
                      <option value="">Select type</option>
                      <option>Institutional / Educational</option>
                      <option>Healthcare / Wellness</option>
                      <option>Commercial</option>
                      <option>Residential Apartment</option>
                      <option>Villa / Bungalow</option>
                      <option>Mixed-use</option>
                      <option>Project Management Consulting</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Approximate Budget</label>
                    <select name="budget_range" className="input-underline"
                      data-testid="contact-budget" value={form.budget_range} onChange={handleChange}>
                      <option value="">Select range</option>
                      <option>Under ₹50 Lakhs</option>
                      <option>₹50L – ₹1 Crore</option>
                      <option>₹1Cr – ₹3 Crore</option>
                      <option>₹3Cr – ₹10 Crore</option>
                      <option>Above ₹10 Crore</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Timeline Expectation</label>
                    <select name="timeline" className="input-underline"
                      data-testid="contact-timeline" value={form.timeline} onChange={handleChange}>
                      <option value="">Select timeline</option>
                      <option>Within 3 months</option>
                      <option>3–6 months</option>
                      <option>6 months – 1 year</option>
                      <option>1–2 years</option>
                      <option>2+ years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">Message</label>
                  <textarea name="message" rows={4} className="input-underline resize-none"
                    placeholder="Tell us about your project — scope, site location, specific requirements..."
                    data-testid="contact-message" value={form.message} onChange={handleChange} />
                </div>

                {formStatus === 'success' && (
                  <div className="flex items-center gap-2.5 text-[#0F5E5B] text-sm font-inter" data-testid="contact-success-msg">
                    <CheckCircle2 size={16} strokeWidth={1.5} />
                    Enquiry received. We will be in touch within 24 hours.
                  </div>
                )}
                {formStatus === 'error' && (
                  <p className="text-red-500 text-sm font-inter" data-testid="contact-error-msg">
                    Something went wrong. Please try again or contact us by phone.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="contact-submit-btn"
                  className="h-12 px-10 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? 'Sending...' : 'Send Enquiry'}
                  {!submitting && <ArrowRight size={14} strokeWidth={1.5} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-white" data-testid="faq-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-4 reveal">Common Questions</p>
            <h2 className="text-3xl font-sora font-light text-[#1F2328] tracking-tight leading-tight mb-10 reveal reveal-delay-1">
              FAQ
            </h2>
            <div data-testid="faq-list">
              {faqs.map((faq, i) => (
                <FaqItem key={i} faq={faq} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

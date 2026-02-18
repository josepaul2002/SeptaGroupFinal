import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Phone, MessageCircle, CheckCircle2, Building2, Stethoscope, Home, Layers, ClipboardList, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useProjects, usePartners, useTestimonials, getText } from '../hooks/useApi';
import { useLanguage, uiTranslations } from '../components/LanguageToggle';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const trustMetrics = [
  { value: '20+', label: 'Years Legacy', sub: 'Est. 2004, Kerala' },
  { value: 'Institutional + Commercial', label: 'Delivery Focus', sub: 'Schools, Hospitals, Offices' },
  { value: '30+', label: 'Projects Delivered', sub: 'Residential & Commercial' },
  { value: 'Weekly', label: 'Site Reporting', sub: 'Quality Checkpoints' },
];

const processSteps = [
  {
    num: '01',
    title: 'Scope Clarity & Estimation',
    desc: 'We document every assumption before the first figure is signed. Scope boundaries, exclusions, and material grades are defined upfront — so there are no surprises mid-build.',
  },
  {
    num: '02',
    title: 'Weekly Site Update & Decision Tracking',
    desc: 'Every week, you receive a structured update: progress photos, completion percentage per element, pending decisions, and risks flagged. No guesswork.',
  },
  {
    num: '03',
    title: 'Quality Checkpoints',
    desc: 'RCC pours, waterproofing, and finishing stages have mandatory hold-points. Work does not proceed to the next phase without a signed checkpoint record.',
  },
  {
    num: '04',
    title: 'Snag & Handover Protocol',
    desc: 'A structured snag list is generated 3 weeks before handover. Every item is closed and documented before keys are handed over.',
  },
];

const servicesTiles = [
  { icon: <Building2 size={20} strokeWidth={1.5} />, label: 'Institutional & Educational' },
  { icon: <Stethoscope size={20} strokeWidth={1.5} />, label: 'Healthcare Facilities' },
  { icon: <Layers size={20} strokeWidth={1.5} />, label: 'Commercial & Mixed-use' },
  { icon: <Home size={20} strokeWidth={1.5} />, label: 'Premium Residences' },
  { icon: <ClipboardList size={20} strokeWidth={1.5} />, label: 'Project Management' },
];

const typeColors = {
  Institutional: 'bg-[#E8F0EF] text-[#0F5E5B]',
  Healthcare: 'bg-[#EEF0F7] text-[#3B4A8A]',
  Commercial: 'bg-[#F0EBE5] text-[#7A4E2D]',
  Residential: 'bg-[#EFF0E8] text-[#4A5C1F]',
  'Mixed-use': 'bg-[#F0EAF4] text-[#6A3A7A]',
};

export default function HomePage() {
  useScrollReveal();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: partners, loading: partnersLoading } = usePartners();
  const { data: testimonials } = useTestimonials();
  const { t, lang } = useLanguage();
  const ui = uiTranslations[lang] || uiTranslations.en;
  
  const [form, setForm] = useState({ name: '', phone: '', project_type: '', message: '', honeypot: '' });
  const [formStatus, setFormStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const featuredProjects = useMemo(() => projects.slice(0, 6), [projects]);
  const featuredPartners = useMemo(() => partners.filter(p => p.featured), [partners]);

  useEffect(() => {
    document.title = 'Septa Group — Built with Clarity. Construction Kerala';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.honeypot) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        name: form.name,
        phone: form.phone,
        email: '',
        project_type: form.project_type,
        message: form.message,
        project_location: '',
        budget_range: '',
        timeline: '',
        honeypot: form.honeypot,
        page_source: 'Home Page'
      });
      setFormStatus('success');
      setForm({ name: '', phone: '', project_type: '', message: '', honeypot: '' });
    } catch {
      setFormStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const loading = projectsLoading || partnersLoading;

  return (
    <div>
      {/* ——— HERO ——— */}
      <section className="min-h-screen flex items-center bg-[#F3F0E8] pt-16 pb-0" data-testid="hero-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-20 lg:py-0 min-h-[85vh]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#A7ADB5] font-inter mb-7 reveal">
                Septa Group · Kerala · Est. 2004
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-sora font-light text-[#1F2328] tracking-tight leading-[1.08] mb-7 reveal reveal-delay-1">
                Built with<br />Clarity.
              </h1>
              <p className="text-base md:text-lg text-[#1F2328]/60 font-inter font-light leading-relaxed max-w-md mb-10 reveal reveal-delay-2">
                Bespoke construction and disciplined delivery for institutional, commercial, and premium residential projects in Kerala.
              </p>
              <div className="flex flex-wrap gap-4 mb-6 reveal reveal-delay-3">
                <Link
                  to="/contact"
                  data-testid="hero-request-quote-btn"
                  className="h-12 px-8 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors flex items-center gap-2"
                >
                  Request a Quote <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
                <Link
                  to="/projects"
                  data-testid="hero-view-projects-btn"
                  className="h-12 px-8 border border-[#1F2328]/20 text-[#1F2328] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#1F2328] hover:text-[#F3F0E8] transition-all flex items-center gap-2"
                >
                  View Projects
                </Link>
              </div>
              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent('Hello, I would like to enquire about a construction project.')}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="hero-whatsapp-btn"
                className="inline-flex items-center gap-2 text-sm font-inter text-[#0F5E5B] hover:text-[#C6A15B] transition-colors reveal reveal-delay-4"
              >
                <MessageCircle size={15} strokeWidth={1.5} />
                WhatsApp Us
              </a>
            </div>

            <div className="relative h-[400px] md:h-[520px] lg:h-[620px] overflow-hidden reveal reveal-delay-2">
              <img
                src="https://images.pexels.com/photos/5524237/pexels-photo-5524237.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750"
                alt="Modern construction architecture"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C6A15B]" />
            </div>
          </div>
        </div>
      </section>

      {/* ——— TRUST BAR ——— */}
      <section className="border-y border-[#A7ADB5]/25 bg-white" data-testid="trust-bar">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {trustMetrics.map((m, i) => (
              <div key={i} className="text-center px-4" data-testid={`trust-metric-${i}`}>
                <p className="text-xl md:text-2xl font-sora font-medium text-[#1F2328] leading-tight">{m.value}</p>
                <p className="text-xs font-inter font-medium text-[#0F5E5B] mt-1 uppercase tracking-wider">{m.label}</p>
                <p className="text-xs font-inter text-[#A7ADB5] mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— FEATURED PROJECTS ——— */}
      <section className="py-20 md:py-32 bg-[#F3F0E8]" data-testid="featured-projects-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div className="reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Our Work</p>
              <h2 className="text-3xl md:text-5xl font-sora font-light text-[#1F2328] tracking-tight leading-tight">
                Selected Projects
              </h2>
            </div>
            <Link
              to="/projects"
              data-testid="view-all-projects-btn"
              className="inline-flex items-center gap-2 text-sm font-inter font-medium text-[#0F5E5B] hover:text-[#C6A15B] transition-colors reveal"
            >
              View all projects <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0F5E5B]" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
              {featuredProjects.map((project, i) => (
                <Link
                  key={project.slug}
                  to={`/projects/${project.slug}`}
                  data-testid={`project-card-${project.slug}`}
                  className={`group block reveal reveal-delay-${Math.min(i + 1, 5)}`}
                >
                  <div className="relative overflow-hidden aspect-[4/3] bg-[#E8E6E0]">
                    <img
                      src={project.image}
                      alt={getText(project.title)}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[#1F2328]/0 group-hover:bg-[#1F2328]/50 transition-all duration-400" />
                    <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-xs font-inter uppercase tracking-wider mb-1">{project.type}</p>
                      <p className="text-white text-sm font-inter font-light">{getText(project.short_description)}</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="text-[#C6A15B] text-xs font-inter font-medium uppercase tracking-wider">View Case Study</span>
                        <ArrowRight size={12} className="text-[#C6A15B]" strokeWidth={1.5} />
                      </div>
                    </div>
                    {/* Status badge */}
                    {project.project_status === 'Ongoing' && (
                      <div className="absolute top-4 right-4 bg-[#0F5E5B] text-white text-xs font-inter px-2.5 py-1 uppercase tracking-wider">
                        Ongoing
                      </div>
                    )}
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-sora font-medium text-[#1F2328]">{getText(project.title)}</h3>
                      <span className={`text-xs font-inter px-2 py-0.5 ${typeColors[project.type] || 'bg-gray-100 text-gray-600'}`}>
                        {project.type}
                      </span>
                    </div>
                    <p className="text-xs font-inter text-[#A7ADB5]">{project.location} · {project.sqft} sqft · {project.duration}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ——— THE SEPTA STANDARD ——— */}
      <section className="py-20 md:py-32 bg-white" data-testid="septa-standard-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="mb-16 reveal">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">How Septa Works</p>
            <h2 className="text-3xl md:text-5xl font-sora font-light text-[#1F2328] tracking-tight leading-tight max-w-xl">
              The Septa Standard
            </h2>
            <p className="text-base font-inter font-light text-[#1F2328]/55 mt-4 max-w-lg leading-relaxed">
              Our delivery methodology is not aspirational copy. It is a working protocol applied on every site, every week.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => (
              <div
                key={step.num}
                className={`p-8 border border-[#1F2328]/8 hover:border-[#C6A15B]/60 transition-colors duration-300 reveal reveal-delay-${i + 1}`}
                data-testid={`process-step-${i + 1}`}
              >
                <p className="text-5xl font-sora font-light text-[#1F2328]/10 mb-4 leading-none">{step.num}</p>
                <h3 className="text-base font-sora font-medium text-[#1F2328] mb-3 leading-snug">{step.title}</h3>
                <p className="text-sm font-inter font-light text-[#1F2328]/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— SERVICES SNAPSHOT ——— */}
      <section className="py-20 md:py-32 bg-[#F3F0E8]" data-testid="services-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">What We Build</p>
              <h2 className="text-3xl md:text-4xl font-sora font-light text-[#1F2328] tracking-tight leading-tight mb-5">
                Services
              </h2>
              <p className="text-base font-inter font-light text-[#1F2328]/55 leading-relaxed mb-8">
                We work across sectors where execution discipline, material quality, and coordination are non-negotiable.
              </p>
              <Link
                to="/services"
                data-testid="view-services-btn"
                className="inline-flex items-center gap-2 h-11 px-7 border border-[#1F2328]/20 text-[#1F2328] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#1F2328] hover:text-[#F3F0E8] transition-all"
              >
                Explore Services
              </Link>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {servicesTiles.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-4 p-6 bg-white border border-[#1F2328]/8 hover:border-[#C6A15B]/50 transition-colors duration-300 reveal reveal-delay-${i + 1}`}
                  data-testid={`service-tile-${i}`}
                >
                  <span className="text-[#0F5E5B]">{s.icon}</span>
                  <span className="text-sm font-inter font-medium text-[#1F2328]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ——— TESTIMONIALS ——— */}
      {testimonials.length > 0 && (
        <section className="py-20 md:py-32 bg-[#1F2328]" data-testid="testimonials-section">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className="mb-14 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Client Voices</p>
              <h2 className="text-3xl md:text-5xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight">
                What Clients Say
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div
                  key={t.id}
                  className={`p-8 border border-[#F3F0E8]/10 hover:border-[#C6A15B]/30 transition-colors duration-300 reveal reveal-delay-${i + 1}`}
                  data-testid={`testimonial-card-${i}`}
                >
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <div key={j} className="w-1.5 h-1.5 bg-[#C6A15B]" />
                    ))}
                  </div>
                  <p className="text-sm font-inter font-light text-[#F3F0E8]/80 leading-relaxed mb-6">
                    "{getText(t.content)}"
                  </p>
                  <div className="border-t border-[#F3F0E8]/10 pt-4">
                    <p className="text-sm font-sora font-medium text-[#F3F0E8]">{t.client_name}</p>
                    <p className="text-xs font-inter text-[#A7ADB5] mt-0.5">{t.client_role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ——— ECOSYSTEM TEASER ——— */}
      <section className="py-20 md:py-32 bg-[#1F2328]" data-testid="ecosystem-teaser-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Partner Network</p>
              <h2 className="text-3xl md:text-4xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight mb-5">
                The ecosystem behind every project
              </h2>
              <p className="text-base font-inter font-light text-[#F3F0E8]/50 leading-relaxed mb-8">
                Septa is a delivery studio. Behind each build is a curated network of architects, engineers, interiors, landscape, technology, and marketing partners — each selected for execution quality, not price.
              </p>
              <Link
                to="/ecosystem"
                data-testid="ecosystem-teaser-btn"
                className="inline-flex items-center gap-2 h-11 px-7 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors"
              >
                Explore Ecosystem <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {featuredPartners.map((partner, i) => (
                  <Link
                    key={partner.slug}
                    to={`/ecosystem/${partner.slug}`}
                    data-testid={`ecosystem-preview-${partner.slug}`}
                    className={`group border border-[#F3F0E8]/10 p-4 hover:border-[#C6A15B]/40 transition-colors duration-300 reveal reveal-delay-${Math.min(i + 1, 4)}`}
                  >
                    <p className="text-xs font-inter text-[#C6A15B] uppercase tracking-wider mb-2">{partner.category.split(' ')[0]}</p>
                    <p className="text-sm font-sora font-medium text-[#F3F0E8] group-hover:text-[#C6A15B] transition-colors leading-snug">
                      {getText(partner.name)}
                    </p>
                    <p className="text-xs font-inter text-[#A7ADB5] mt-1">{partner.relationship_type}</p>
                  </Link>
                ))}
                <Link
                  to="/ecosystem"
                  data-testid="see-all-partners-btn"
                  className="border border-[#F3F0E8]/10 p-4 hover:border-[#C6A15B]/40 transition-colors duration-300 flex flex-col justify-between reveal"
                >
                  <p className="text-xs font-inter text-[#A7ADB5] mb-2">And more</p>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span className="text-xs font-inter font-medium text-[#0F5E5B] uppercase tracking-wider">View all</span>
                    <ArrowRight size={11} className="text-[#0F5E5B]" strokeWidth={1.5} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— CTA + QUICK FORM ——— */}
      <section className="py-20 md:py-32 bg-[#F3F0E8]" data-testid="cta-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Copy */}
            <div className="lg:col-span-5 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Start a Conversation</p>
              <h2 className="text-3xl md:text-4xl font-sora font-light text-[#1F2328] tracking-tight leading-tight mb-5">
                Compare contractors on risk, not just price.
              </h2>
              <p className="text-base font-inter font-light text-[#1F2328]/55 leading-relaxed mb-8">
                Send us a brief summary of your project. We will respond within 24 hours with a clear scope of how we would approach it.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="tel:+919876543210"
                  data-testid="cta-call-btn"
                  className="inline-flex items-center gap-3 text-sm font-inter font-medium text-[#1F2328]"
                >
                  <div className="w-9 h-9 bg-[#0F5E5B] flex items-center justify-center">
                    <Phone size={14} className="text-white" strokeWidth={1.5} />
                  </div>
                  +91 XXXXX XXXXX — Placeholder
                </a>
              </div>
            </div>

            {/* Quick Form */}
            <div className="lg:col-span-7 reveal reveal-delay-2">
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="quick-enquiry-form">
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  className="hidden"
                  tabIndex="-1"
                  autoComplete="off"
                  value={form.honeypot}
                  onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-underline"
                      placeholder="Full name"
                      data-testid="form-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      className="input-underline"
                      placeholder="+91 XXXXX XXXXX"
                      data-testid="form-phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
                    Project Type
                  </label>
                  <select
                    className="input-underline"
                    data-testid="form-project-type"
                    value={form.project_type}
                    onChange={(e) => setForm({ ...form, project_type: e.target.value })}
                  >
                    <option value="">Select type</option>
                    <option>Institutional / Educational</option>
                    <option>Healthcare / Wellness</option>
                    <option>Commercial</option>
                    <option>Residential Apartment</option>
                    <option>Villa / Bungalow</option>
                    <option>Mixed-use</option>
                    <option>Project Management</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter block mb-2">
                    Brief Message
                  </label>
                  <textarea
                    rows={3}
                    className="input-underline resize-none"
                    placeholder="Tell us briefly about your project..."
                    data-testid="form-message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                {formStatus === 'success' && (
                  <div className="flex items-center gap-2 text-[#0F5E5B] text-sm font-inter" data-testid="form-success-msg">
                    <CheckCircle2 size={15} strokeWidth={1.5} />
                    Enquiry received. We will contact you within 24 hours.
                  </div>
                )}
                {formStatus === 'error' && (
                  <p className="text-red-500 text-sm font-inter" data-testid="form-error-msg">
                    Something went wrong. Please try again or call us directly.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="form-submit-btn"
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
    </div>
  );
}

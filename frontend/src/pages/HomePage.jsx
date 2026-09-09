import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ArrowUpRight, Phone, MessageCircle, CheckCircle2, Building2, Stethoscope, Home, Layers, ClipboardList, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useProjects, usePartners, useTestimonials, useSiteSettings, getText } from '../hooks/useApi';
import { useLanguage } from '../components/LanguageToggle';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const trustMetrics = [
  { value: '20+', label: 'Years Legacy', sub: 'Est. 2004, Kerala' },
  { value: 'Institutional + Commercial', label: 'Delivery Focus', sub: 'Schools, Hospitals, Offices' },
  { value: '30+', label: 'Projects Delivered', sub: 'Residential & Commercial' },
  { value: 'Weekly', label: 'Site Reporting', sub: 'Quality Checkpoints' },
];

const processSteps = [
  { num: '01', title: 'Scope Clarity & Estimation', desc: 'We document every assumption before the first figure is signed. Scope boundaries, exclusions, and material grades are defined upfront — so there are no surprises mid-build.' },
  { num: '02', title: 'Weekly Site Update & Decision Tracking', desc: 'Every week, you receive a structured update: progress photos, completion percentage per element, pending decisions, and risks flagged. No guesswork.' },
  { num: '03', title: 'Quality Checkpoints', desc: 'RCC pours, waterproofing, and finishing stages have mandatory hold-points. Work does not proceed to the next phase without a signed checkpoint record.' },
  { num: '04', title: 'Snag & Handover Protocol', desc: 'A structured snag list is generated 3 weeks before handover. Every item is closed and documented before keys are handed over.' },
];

const servicesTiles = [
  { icon: <Building2 size={20} strokeWidth={1.5} />, label: 'Institutional & Educational' },
  { icon: <Stethoscope size={20} strokeWidth={1.5} />, label: 'Healthcare Facilities' },
  { icon: <Layers size={20} strokeWidth={1.5} />, label: 'Commercial & Mixed-use' },
  { icon: <Home size={20} strokeWidth={1.5} />, label: 'Premium Residences' },
  { icon: <ClipboardList size={20} strokeWidth={1.5} />, label: 'Project Management' },
];

const badgeClass = 'bg-[#ECECEA] text-[#666666]';

export default function HomePage() {
  useScrollReveal();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: partners, loading: partnersLoading } = usePartners();
  const { data: testimonials } = useTestimonials();
  const { settings } = useSiteSettings();
  const { t, lang } = useLanguage();

  const contact = settings?.contact || {};
  const waHref = contact.whatsapp_link || (contact.whatsapp_number ? `https://wa.me/${contact.whatsapp_number}` : '#');
  const telHref = contact.phone_link || '#';

  const [form, setForm] = useState({ name: '', phone: '', project_type: '', message: '', honeypot: '' });
  const [formStatus, setFormStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [spotlightPartners, setSpotlightPartners] = useState([]);

  const featuredProjects = useMemo(() => projects.slice(0, 6), [projects]);

  useEffect(() => {
    document.title = 'Septa Group — Built with Clarity. Construction Kerala';
    axios.get(`${API}/partners-featured`).then(r => setSpotlightPartners(r.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.honeypot) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        name: form.name, phone: form.phone, email: '', project_type: form.project_type,
        message: form.message, project_location: '', budget_range: '', timeline: '',
        honeypot: form.honeypot, page_source: 'Home Page'
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
      {/* ——— HERO — BLACK ——— */}
      <section className="relative bg-[#050505] pt-16 overflow-hidden" data-testid="hero-section">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center min-h-[88vh] py-24 lg:py-0">
            <div className="lg:col-span-7">
              <p className="tech-label text-[11px] text-[#C6A15B] mb-8 reveal">
                Septa Group / Kerala / Est. 2004
              </p>
              <h1
                className="font-display font-medium text-[#F6F6F3] mb-8 reveal reveal-delay-1"
                style={{ fontSize: 'clamp(52px, 7.2vw, 118px)', lineHeight: 0.94, letterSpacing: '-0.05em' }}
              >
                From idea<br />to infrastructure.
              </h1>
              <p className="text-lg md:text-xl text-[#A8A8A8] font-inter font-light leading-relaxed max-w-xl mb-11 reveal reveal-delay-2">
                Bespoke construction and disciplined delivery for institutional, commercial, and premium residential projects across Kerala.
              </p>
              <div className="flex flex-wrap gap-4 mb-7 reveal reveal-delay-3">
                <Link
                  to="/contact"
                  data-testid="hero-request-quote-btn"
                  className="group h-12 px-8 bg-white text-[#050505] border border-white text-[13px] font-body font-medium tracking-[0.02em] hover:bg-transparent hover:text-white transition-colors duration-200 flex items-center gap-2 rounded-[3px]"
                >
                  Start a Project
                  <ArrowUpRight size={15} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  to="/projects"
                  data-testid="hero-view-projects-btn"
                  className="h-12 px-8 border border-white/25 text-white text-[13px] font-body font-medium tracking-[0.02em] hover:bg-white hover:text-[#050505] transition-colors duration-200 flex items-center gap-2 rounded-[3px]"
                >
                  View Projects
                </Link>
              </div>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="hero-whatsapp-btn"
                className="inline-flex items-center gap-2 text-sm font-inter text-white/50 hover:text-white transition-colors reveal reveal-delay-4"
              >
                <MessageCircle size={15} strokeWidth={1.5} />
                WhatsApp {contact.contact_person ? contact.contact_person : 'Us'}
              </a>
            </div>

            <div className="lg:col-span-5 relative h-[360px] md:h-[480px] lg:h-[600px] overflow-hidden reveal reveal-delay-2 border border-white/10">
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

      {/* ——— TRUST BAR — OFF-WHITE ——— */}
      <section className="border-b border-[#DADAD7] bg-[#F6F6F3]" data-testid="trust-bar">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 divide-x divide-[#DADAD7]">
            {trustMetrics.map((m, i) => (
              <div key={i} className="px-4 md:px-8" data-testid={`trust-metric-${i}`}>
                <p className="text-xl md:text-2xl font-display font-medium text-[#050505] leading-tight tracking-tight">{m.value}</p>
                <p className="tech-label text-[11px] text-[#666666] mt-2">{m.label}</p>
                <p className="text-xs font-inter text-[#8A8A8A] mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— SELECTED PROJECTS — WHITE ——— */}
      <section className="py-24 md:py-36 bg-white" data-testid="featured-projects-section">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="reveal">
              <p className="tech-label text-[11px] text-[#C6A15B] mb-4">01 / Selected Work</p>
              <h2 className="font-display font-medium text-[#050505] tracking-[-0.03em] leading-[1.02]" style={{ fontSize: 'clamp(34px, 4.4vw, 60px)' }}>
                Selected Projects
              </h2>
            </div>
            <Link to="/projects" data-testid="view-all-projects-btn"
              className="group inline-flex items-center gap-2 text-sm font-inter font-medium text-[#050505] hover:text-[#606060] transition-colors reveal">
              View all projects
              <ArrowUpRight size={15} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-[#606060]" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
              {featuredProjects.map((project, i) => (
                <Link key={project.slug} to={`/projects/${project.slug}`} data-testid={`project-card-${project.slug}`}
                  className={`group block reveal reveal-delay-${Math.min(i + 1, 5)}`}>
                  <div className="relative overflow-hidden aspect-[4/3] bg-[#ECECEA] border border-[#DADAD7]">
                    {project.image ? (
                      <img src={project.image} alt={getText(project.title)} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#050505]">
                        <span className="tech-label text-[11px] text-[#8A8A8A]">{project.type}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[#050505]/0 group-hover:bg-[#050505]/60 transition-all duration-400" />
                    <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="tech-label text-[10px] text-white/70 mb-1">{project.type}</p>
                      <p className="text-white text-sm font-inter font-light">{getText(project.short_description)}</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="text-white text-xs font-inter font-medium uppercase tracking-wider">View Case Study</span>
                        <ArrowUpRight size={13} className="text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                    {project.project_status === 'Ongoing' && (
                      <div className="absolute top-4 right-4 bg-[#050505] text-white tech-label text-[10px] px-2.5 py-1">Ongoing</div>
                    )}
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-1 gap-3">
                      <h3 className="text-base font-display font-medium text-[#050505]">{getText(project.title)}</h3>
                      <span className={`tech-label text-[10px] px-2 py-0.5 ${badgeClass}`}>{project.type}</span>
                    </div>
                    <p className="text-xs font-inter text-[#8A8A8A]">{project.location} · {project.sqft} sqft · {project.duration}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ——— THE SEPTA STANDARD — BLACK (PROCESS) ——— */}
      <section className="py-24 md:py-36 bg-[#050505]" data-testid="septa-standard-section">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="mb-16 reveal">
            <p className="tech-label text-[11px] text-[#C6A15B] mb-4">02 / How Septa Works</p>
            <h2 className="font-display font-medium text-[#F6F6F3] tracking-[-0.03em] leading-[1.02] max-w-2xl" style={{ fontSize: 'clamp(34px, 4.4vw, 60px)' }}>
              Building starts before construction.
            </h2>
            <p className="text-base md:text-lg font-inter font-light text-[#A8A8A8] mt-6 max-w-xl leading-relaxed">
              Our delivery methodology is not aspirational copy. It is a working protocol applied on every site, every week.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-white/12">
            {processSteps.map((step, i) => (
              <div key={step.num}
                className="p-8 lg:p-9 border-b border-r border-white/12 hover:bg-white/[0.03] transition-colors duration-300 reveal"
                style={{ animationDelay: `${i * 0.08}s` }}
                data-testid={`process-step-${i + 1}`}>
                <p className="font-mono text-sm text-[#C6A15B] mb-6">{step.num}</p>
                <h3 className="text-lg font-display font-medium text-[#F6F6F3] mb-3 leading-snug">{step.title}</h3>
                <p className="text-sm font-inter font-light text-[#A8A8A8] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— SERVICES — OFF-WHITE ——— */}
      <section className="py-24 md:py-36 bg-[#F6F6F3]" data-testid="services-section">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 reveal">
              <p className="tech-label text-[11px] text-[#C6A15B] mb-4">03 / What We Build</p>
              <h2 className="font-display font-medium text-[#050505] tracking-[-0.03em] leading-[1.02] mb-6" style={{ fontSize: 'clamp(32px, 3.6vw, 48px)' }}>
                Services
              </h2>
              <p className="text-base font-inter font-light text-[#666666] leading-relaxed mb-9">
                We work across sectors where execution discipline, material quality, and coordination are non-negotiable.
              </p>
              <Link to="/services" data-testid="view-services-btn"
                className="group inline-flex items-center gap-2 h-11 px-7 bg-[#050505] text-white border border-[#050505] text-[13px] font-body font-medium tracking-[0.02em] hover:bg-transparent hover:text-[#050505] transition-colors duration-200 rounded-[3px]">
                Explore Capabilities
                <ArrowUpRight size={15} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 border-t border-l border-[#DADAD7]">
              {servicesTiles.map((s, i) => (
                <div key={s.label}
                  className="flex items-center gap-4 p-7 bg-[#F6F6F3] border-b border-r border-[#DADAD7] hover:bg-white transition-colors duration-300 reveal"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  data-testid={`service-tile-${i}`}>
                  <span className="text-[#050505]">{s.icon}</span>
                  <span className="text-sm font-inter font-medium text-[#050505]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ——— TESTIMONIALS — WHITE ——— */}
      {testimonials.length > 0 && (
        <section className="py-24 md:py-36 bg-white" data-testid="testimonials-section">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12">
            <div className="mb-14 reveal">
              <p className="tech-label text-[11px] text-[#C6A15B] mb-4">04 / Client Voices</p>
              <h2 className="font-display font-medium text-[#050505] tracking-[-0.03em] leading-[1.02]" style={{ fontSize: 'clamp(34px, 4.4vw, 60px)' }}>
                What Clients Say
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[#DADAD7]">
              {testimonials.map((tst, i) => (
                <div key={tst.id}
                  className="p-8 lg:p-9 border-b border-r border-[#DADAD7] reveal"
                  style={{ animationDelay: `${i * 0.08}s` }}
                  data-testid={`testimonial-card-${i}`}>
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: tst.rating }).map((_, j) => (<div key={j} className="w-1.5 h-1.5 bg-[#050505]" />))}
                  </div>
                  <p className="text-base font-inter font-light text-[#333333] leading-relaxed mb-7">"{getText(tst.content)}"</p>
                  <div className="border-t border-[#DADAD7] pt-4">
                    <p className="text-sm font-display font-medium text-[#050505]">{tst.client_name}</p>
                    <p className="tech-label text-[10px] text-[#8A8A8A] mt-1">{tst.client_role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ——— ECOSYSTEM — OFF-WHITE ——— */}
      <section className="py-24 md:py-36 bg-[#F6F6F3]" data-testid="ecosystem-teaser-section">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 reveal">
              <p className="tech-label text-[11px] text-[#C6A15B] mb-4">05 / Partner Network</p>
              <h2 className="font-display font-medium text-[#050505] tracking-[-0.03em] leading-[1.04] mb-6" style={{ fontSize: 'clamp(30px, 3.4vw, 46px)' }}>
                One partner.<br />The entire project.
              </h2>
              <p className="text-base font-inter font-light text-[#666666] leading-relaxed mb-9">
                Septa is a delivery studio. Behind each build is a curated network of architects, engineers, interiors, landscape, technology, and marketing partners — each selected for execution quality, not price.
              </p>
              <Link to="/ecosystem" data-testid="ecosystem-teaser-btn"
                className="group inline-flex items-center gap-2 h-11 px-7 bg-[#050505] text-white border border-[#050505] text-[13px] font-body font-medium tracking-[0.02em] hover:bg-transparent hover:text-[#050505] transition-colors duration-200 rounded-[3px]">
                Explore Ecosystem
                <ArrowUpRight size={15} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {spotlightPartners.slice(0, 5).map((partner, i) => {
                  const cardImg = partner.media?.card_image || partner.cover_image;
                  return (
                    <Link key={partner.slug} to={`/ecosystem/${partner.slug}`} data-testid={`ecosystem-preview-${partner.slug}`}
                      className={`group block overflow-hidden border border-[#DADAD7] hover:border-[#8A8A8A] bg-white transition-colors duration-300 reveal reveal-delay-${Math.min(i + 1, 4)}`}>
                      {cardImg ? (
                        <div className="aspect-[16/9] overflow-hidden bg-[#ECECEA]">
                          <img src={cardImg} alt={getText(partner.name)} loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-[#ECECEA] flex items-center justify-center">
                          <span className="text-2xl font-display font-light text-[#8A8A8A]">{getText(partner.name).charAt(0)}</span>
                        </div>
                      )}
                      <div className="p-3">
                        <p className="tech-label text-[10px] text-[#8A8A8A] mb-1">{partner.category.split(' ')[0]}</p>
                        <p className="text-sm font-display font-medium text-[#050505] group-hover:text-[#606060] transition-colors leading-snug">{getText(partner.name)}</p>
                        <p className="text-[10px] font-inter text-[#8A8A8A] mt-0.5">{partner.relationship_type}</p>
                      </div>
                    </Link>
                  );
                })}
                <Link to="/ecosystem" data-testid="see-all-partners-btn"
                  className="border border-[#DADAD7] bg-white p-4 hover:border-[#8A8A8A] transition-colors duration-300 flex flex-col justify-between reveal">
                  <p className="tech-label text-[10px] text-[#8A8A8A] mb-2">And more</p>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span className="text-xs font-inter font-medium text-[#050505] uppercase tracking-wider">View all</span>
                    <ArrowUpRight size={12} className="text-[#050505]" strokeWidth={1.5} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— CTA + QUICK FORM — BLACK ——— */}
      <section className="py-24 md:py-36 bg-[#050505]" data-testid="cta-section">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-5 reveal">
              <p className="tech-label text-[11px] text-[#C6A15B] mb-4">06 / Start a Conversation</p>
              <h2 className="font-display font-medium text-[#F6F6F3] tracking-[-0.03em] leading-[1.04] mb-6" style={{ fontSize: 'clamp(30px, 3.4vw, 46px)' }}>
                Compare contractors on risk, not just price.
              </h2>
              <p className="text-base font-inter font-light text-[#A8A8A8] leading-relaxed mb-9">
                Send us a brief summary of your project. We will respond within 24 hours with a clear scope of how we would approach it.
              </p>
              <div className="flex flex-col gap-5">
                <a href={telHref} data-testid="cta-call-btn" className="inline-flex items-center gap-3 text-sm font-inter font-medium text-[#F6F6F3] group">
                  <div className="w-10 h-10 bg-white flex items-center justify-center group-hover:bg-[#8A8A8A] transition-colors">
                    <Phone size={15} className="text-[#050505]" strokeWidth={1.5} />
                  </div>
                  {contact.phone_display || 'Call us'}
                </a>
                {contact.contact_person && (
                  <div className="flex items-center gap-3 pl-[52px] -mt-2">
                    <p className="text-sm font-inter text-[#A8A8A8]">
                      {contact.contact_person}
                      {contact.contact_person_role ? <span className="text-[#8A8A8A]"> — {contact.contact_person_role}</span> : null}
                    </p>
                  </div>
                )}
                <a href={waHref} target="_blank" rel="noopener noreferrer" data-testid="cta-whatsapp-btn"
                  className="inline-flex items-center gap-3 text-sm font-inter font-medium text-[#F6F6F3] group">
                  <div className="w-10 h-10 border border-white/20 flex items-center justify-center group-hover:border-white transition-colors">
                    <MessageCircle size={15} className="text-white" strokeWidth={1.5} />
                  </div>
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 reveal reveal-delay-2">
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="quick-enquiry-form">
                <input type="text" name="website" className="hidden" tabIndex="-1" autoComplete="off"
                  value={form.honeypot} onChange={(e) => setForm({ ...form, honeypot: e.target.value })} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="tech-label text-[10px] text-white/50 block mb-2">Your Name *</label>
                    <input type="text" required className="input-underline-dark" placeholder="Full name" data-testid="form-name"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="tech-label text-[10px] text-white/50 block mb-2">Phone Number *</label>
                    <input type="tel" required className="input-underline-dark" placeholder="+91 XXXXX XXXXX" data-testid="form-phone"
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="tech-label text-[10px] text-white/50 block mb-2">Project Type</label>
                  <select className="input-underline-dark" data-testid="form-project-type"
                    value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
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
                  <label className="tech-label text-[10px] text-white/50 block mb-2">Brief Message</label>
                  <textarea rows={3} className="input-underline-dark resize-none" placeholder="Tell us briefly about your project..." data-testid="form-message"
                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>

                {formStatus === 'success' && (
                  <div className="flex items-center gap-2 text-white text-sm font-inter" data-testid="form-success-msg">
                    <CheckCircle2 size={15} strokeWidth={1.5} /> Enquiry received. We will contact you within 24 hours.
                  </div>
                )}
                {formStatus === 'error' && (
                  <p className="text-red-400 text-sm font-inter" data-testid="form-error-msg">Something went wrong. Please try again or call us directly.</p>
                )}

                <button type="submit" disabled={submitting} data-testid="form-submit-btn"
                  className="group h-12 px-10 bg-white text-[#050505] border border-white text-[13px] font-body font-medium tracking-[0.02em] hover:bg-transparent hover:text-white transition-colors duration-200 disabled:opacity-60 flex items-center gap-2 rounded-[3px]">
                  {submitting ? 'Sending...' : 'Send Enquiry'}
                  {!submitting && <ArrowUpRight size={15} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

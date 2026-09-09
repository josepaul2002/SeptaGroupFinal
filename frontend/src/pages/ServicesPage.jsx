import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check, X as XIcon, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { usePageContent, getText } from '../hooks/useApi';
import { useLanguage } from '../components/LanguageToggle';

const services = [
  {
    id: 'institutional',
    title: 'Institutional & Educational',
    summary: 'Schools, colleges, and institutional campuses with phased delivery that works around academic schedules.',
    bestFor: ['Educational institutions expanding campus', 'Government & semi-government bodies', 'Religious & community organizations'],
    notFor: ['Small-scale residential renovations'],
    deliverables: ['Phased construction plan', 'Weekly progress reporting', 'MEP coordination', 'Quality checkpoint documentation', 'Snag-free handover'],
    timeline: '12–24 months typical',
    relatedProject: { slug: 'st-thomas-school-thrissur', name: 'St. Thomas School of Excellence' },
  },
  {
    id: 'healthcare',
    title: 'Healthcare & Wellness',
    summary: 'Medical centres, clinics, and wellness facilities built to regulatory standards with first-submission approval track record.',
    bestFor: ['Hospitals and clinics', 'Wellness & rehabilitation centres', 'Diagnostic centres'],
    notFor: ['Small clinic fit-outs under 1000 sqft'],
    deliverables: ['Regulatory-compliant construction', 'MEP systems integration', 'Infection control protocols', 'Equipment coordination', 'Health dept. liaison support'],
    timeline: '12–18 months typical',
    relatedProject: { slug: 'lakeview-medical-centre-ernakulam', name: 'Lakeview Medical Centre' },
  },
  {
    id: 'commercial',
    title: 'Commercial & Mixed-use',
    summary: 'Office buildings, retail spaces, and mixed-use developments with ROI-conscious delivery timelines.',
    bestFor: ['Developers building commercial projects', 'Office space expansions', 'Retail & F&B build-outs'],
    notFor: ['Small shop interiors'],
    deliverables: ['Value engineering', 'Tenant coordination', 'Timeline-driven delivery', 'Cost tracking & forecasting', 'Leasing-ready handover'],
    timeline: '8–18 months typical',
    relatedProject: { slug: 'prestige-business-square-kochi', name: 'Prestige Business Square' },
  },
  {
    id: 'residential',
    title: 'Premium Residential',
    summary: 'Bespoke villas and luxury apartments where finish quality, material selection, and owner experience matter.',
    bestFor: ['Individual homeowners building premium residences', 'Apartment developers (20+ units)', 'Villa projects with custom specifications'],
    notFor: ['Budget housing under ₹30L'],
    deliverables: ['Design coordination with architect', 'Material sourcing & QC', 'Smart home integration', 'Landscape coordination', 'Defect-free handover with warranty'],
    timeline: '14–24 months typical',
    relatedProject: null,
  },
  {
    id: 'pmc',
    title: 'Project Management Consulting',
    summary: 'When you have your own contractor but need Septa\'s process discipline, reporting, and quality oversight.',
    bestFor: ['Owners who want independent QA', 'NRI clients managing remotely', 'Large institutional clients with multiple contractors'],
    notFor: ['Projects already under Septa construction delivery'],
    deliverables: ['Independent quality audits', 'Weekly reporting & dashboards', 'Contractor coordination', 'Cost monitoring', 'Handover management'],
    timeline: 'Duration of project',
    relatedProject: null,
  },
];

export default function ServicesPage() {
  useScrollReveal();
  const { blocks, loading } = usePageContent('services');
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); document.title = 'Services — Septa Group'; }, []);

  const comparisons = blocks.filter(b => b.block_type === 'comparison_row').sort((a, b) => a.order - b.order);

  return (
    <div className="pt-16" data-testid="services-page">
      {/* Hero */}
      <section className="bg-[#F6F6F3] py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3 reveal">Services</p>
          <h1 className="text-4xl md:text-5xl font-sora font-light text-[#050505] tracking-tight leading-tight max-w-2xl reveal reveal-delay-1">
            Construction Delivery,<br />Not Just Contracting.
          </h1>
          <p className="text-base font-inter font-light text-[#050505]/55 leading-relaxed max-w-xl mt-5 reveal reveal-delay-2">
            Each service is built around Septa's process discipline — scope clarity, weekly reporting, quality checkpoints, and documented handover.
          </p>
        </div>
      </section>

      {/* Service Items */}
      <section className="py-12 md:py-16 bg-white" data-testid="services-list">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 space-y-4">
          {services.map((svc, i) => (
            <div key={svc.id}
              className={`border transition-colors reveal reveal-delay-${(i % 3) + 1} ${
                expanded === svc.id ? 'border-[#606060]/30 bg-[#F6F6F3]/30' : 'border-[#8A8A8A]/15 hover:border-[#8A8A8A]/30'
              }`}
              data-testid={`service-${svc.id}`}
            >
              <button
                onClick={() => setExpanded(expanded === svc.id ? null : svc.id)}
                className="w-full flex items-center justify-between p-6 text-left"
                data-testid={`service-toggle-${svc.id}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-inter text-[#8A8A8A] uppercase tracking-wider w-8">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-base md:text-lg font-sora font-medium text-[#050505]">{svc.title}</h3>
                    <p className="text-sm font-inter font-light text-[#050505]/50 mt-0.5">{svc.summary}</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-[#8A8A8A] transition-transform flex-shrink-0 ml-4 ${expanded === svc.id ? 'rotate-180' : ''}`} />
              </button>

              {expanded === svc.id && (
                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#8A8A8A]/10 pt-6 ml-12">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#606060] font-inter mb-3">Best For</p>
                    <ul className="space-y-2">
                      {svc.bestFor.map(b => (
                        <li key={b} className="flex items-start gap-2 text-sm font-inter text-[#050505]/60">
                          <Check size={12} className="text-[#606060] mt-0.5 flex-shrink-0" />{b}
                        </li>
                      ))}
                    </ul>
                    {svc.notFor.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-2">Not For</p>
                        <ul className="space-y-1">
                          {svc.notFor.map(n => (
                            <li key={n} className="flex items-start gap-2 text-xs font-inter text-[#8A8A8A]">
                              <XIcon size={10} className="mt-0.5 flex-shrink-0" />{n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-3">Deliverables</p>
                    <ul className="space-y-2">
                      {svc.deliverables.map(d => (
                        <li key={d} className="flex items-start gap-2 text-sm font-inter text-[#050505]/60">
                          <Check size={12} className="text-[#8A8A8A] mt-0.5 flex-shrink-0" />{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-3">Typical Timeline</p>
                    <p className="text-sm font-inter font-medium text-[#050505]">{svc.timeline}</p>
                    {svc.relatedProject && (
                      <div className="mt-6">
                        <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-2">Related Project</p>
                        <Link to={`/projects/${svc.relatedProject.slug}`}
                          className="text-sm font-inter text-[#606060] hover:text-[#8A8A8A] transition-colors inline-flex items-center gap-1.5">
                          {svc.relatedProject.name} <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Block */}
      {comparisons.length > 0 && (
        <section className="py-16 md:py-20 bg-[#F6F6F3]" data-testid="services-comparison">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className="max-w-2xl mb-10 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3">The Difference</p>
              <h2 className="text-2xl md:text-3xl font-sora font-light text-[#050505] tracking-tight">
                Traditional Contractor vs Septa Delivery Studio
              </h2>
            </div>
            <div className="bg-white border border-[#8A8A8A]/15 overflow-hidden reveal reveal-delay-1">
              <div className="grid grid-cols-3 gap-0 border-b border-[#8A8A8A]/20 bg-[#050505]">
                <div className="p-4 text-xs font-inter font-medium text-[#F6F6F3] uppercase tracking-wider">Aspect</div>
                <div className="p-4 text-xs font-inter font-medium text-[#8A8A8A] uppercase tracking-wider border-l border-[#F6F6F3]/10">Traditional</div>
                <div className="p-4 text-xs font-inter font-medium text-[#8A8A8A] uppercase tracking-wider border-l border-[#F6F6F3]/10">Septa Standard</div>
              </div>
              {comparisons.map((row, i) => (
                <div key={row.id || i} className={`grid grid-cols-3 gap-0 ${i < comparisons.length - 1 ? 'border-b border-[#8A8A8A]/10' : ''}`}
                  data-testid={`comparison-row-${i}`}>
                  <div className="p-4 text-sm font-inter font-medium text-[#050505]">{t(row.title)}</div>
                  <div className="p-4 text-sm font-inter font-light text-[#050505]/45 border-l border-[#8A8A8A]/10">{row.metadata?.traditional || ''}</div>
                  <div className="p-4 text-sm font-inter font-light text-[#606060] border-l border-[#8A8A8A]/10">{t(row.body)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-[#050505]" data-testid="services-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3">Not Sure Which Service?</p>
          <h2 className="text-2xl md:text-3xl font-sora font-light text-[#F6F6F3] tracking-tight mb-6">
            Tell us what you're building and we'll recommend the right approach.
          </h2>
          <Link to="/contact?ref=services" data-testid="services-contact-btn"
            className="inline-flex items-center gap-2 h-12 px-8 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#262626] transition-colors">
            Start a Conversation <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}

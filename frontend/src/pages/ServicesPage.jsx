import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const services = [
  {
    id: 'institutional',
    category: 'Institutional & Educational Buildings',
    tagline: 'Campuses that function for decades without compromise.',
    description: 'We deliver academic buildings, administrative blocks, libraries, labs, and auditoriums for schools, colleges, and government institutions. Phased delivery during active use is a core competency.',
    included: [
      'Civil and structural works',
      'External and internal finishing',
      'Plumbing, sanitation, and drainage',
      'Electrical and low-voltage works',
      'Flooring, tile-work, and joinery',
      'Compound wall and landscaping',
      'Painting and façade finishing',
    ],
    notIncluded: [
      'Furniture and fixtures (unless specified)',
      'IT and AV infrastructure',
      'Specialist lab or medical equipment installation',
      'Architect fees and structural engineer fees',
    ],
    timelineFactors: 'Typically 12–24 months depending on scale. Phased delivery plans add 10–20% to timeline but protect operational continuity.',
    type: 'Institutional',
  },
  {
    id: 'healthcare',
    category: 'Healthcare & Wellness Facilities',
    tagline: 'Built to regulatory standards. Coordinated for clinical environments.',
    description: 'Hospitals, clinics, diagnostic centres, and wellness facilities require a higher-than-standard grade of waterproofing, M&E coordination, hygiene-grade finishes, and HVAC integration. We carry the experience to deliver them cleanly.',
    included: [
      'Civil, structural, and waterproofing works',
      'Healthcare-grade wall and floor finishes',
      'Plumbing, medical gas stub-outs (piping only)',
      'HVAC ducting and diffuser installation',
      'Electrical works up to main distribution board',
      'Cleanroom or procedure room finishing (where specified)',
    ],
    notIncluded: [
      'Medical equipment installation and commissioning',
      'Medical gas system engineering design',
      'IT/networking and nurse call systems',
      'HEPA filtration supply and commissioning',
    ],
    timelineFactors: 'Typically 12–18 months. M&E coordination reviews add 3–4 weeks per phase. Health Department inspection readiness is built into our schedule.',
    type: 'Healthcare',
  },
  {
    id: 'commercial',
    category: 'Mixed-use Commercial & Institutional',
    tagline: 'Offices, retail, and multi-purpose spaces built to developer-grade standards.',
    description: 'Commercial buildings, office complexes, retail podiums, and mixed-use developments require programme management at scale. We coordinate multiple trade packages and deliver to shell-and-core or full fit-out specifications.',
    included: [
      'Full structural works and basement waterproofing',
      'Core and shell finishing',
      'Common area finishing to developer spec',
      'Lifts — civil works and shaft preparation',
      'Parking: structure, marking, drainage, lighting',
      'Façade, cladding, and external works',
    ],
    notIncluded: [
      'Tenant fit-outs (separate packages, coordinated)',
      'Lift supply and installation (Septa coordinates with vendor)',
      'Signage and branding',
    ],
    timelineFactors: '18–30 months for mid-scale commercial developments. Floor-by-floor phased handovers are available for investor clients.',
    type: 'Commercial',
  },
  {
    id: 'residential',
    category: 'Premium Apartments & Villas',
    tagline: 'Finish quality that withstands buyer scrutiny at handover.',
    description: 'Residential projects — apartment blocks, villa complexes, and bespoke individual homes — where finish consistency, buyer satisfaction, and snag-free handover are the defining metrics of success.',
    included: [
      'Full civil and structural construction',
      'Premium internal and external finishing',
      'Kitchen and bathroom infrastructure',
      'Common areas: lobby, staircase, terrace',
      'Swimming pool civil works',
      'Landscaping and compound works',
      'Two-round internal snagging before handover',
    ],
    notIncluded: [
      'Kitchen cabinets and modular fittings (unless specified)',
      'Furniture and loose furnishings',
      'Smart home systems',
      'Interior design fees',
    ],
    timelineFactors: '12–22 months depending on number of units and finish specification. Villa projects with natural stone or bespoke cladding add 15–20% to schedule.',
    type: 'Residential',
  },
  {
    id: 'pm',
    category: 'Project Management & Consulting',
    tagline: 'Structured oversight for clients managing their own build.',
    description: 'For clients who have appointed their own contractors but need independent site supervision, progress tracking, quality oversight, and risk management, Septa offers a Project Management Consulting service.',
    included: [
      'Weekly site visits and progress reporting',
      'Quality inspection at key milestones',
      'Contractor coordination and communication',
      'Variation and change management review',
      'Snag documentation and closure tracking',
    ],
    notIncluded: [
      'Design or architectural services',
      'Structural engineering and calculations',
      'Contractor supply or labour management',
      'Legal or contract arbitration',
    ],
    timelineFactors: 'Engagement typically mirrors the construction programme. Initial scope review takes 2–3 weeks.',
    type: 'Project Management',
  },
];

function ServiceCard({ service, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border border-[#1F2328]/8 bg-white reveal reveal-delay-${Math.min(index + 1, 4)}`}
      data-testid={`service-card-${service.id}`}
    >
      <div
        className="p-8 md:p-10 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C6A15B] font-inter mb-3">{service.type}</p>
            <h3 className="text-xl md:text-2xl font-sora font-light text-[#1F2328] leading-tight mb-3">
              {service.category}
            </h3>
            <p className="text-sm font-inter font-light text-[#1F2328]/55 leading-relaxed max-w-2xl">
              {service.tagline}
            </p>
          </div>
          <button
            aria-label={expanded ? 'Collapse' : 'Expand'}
            data-testid={`service-expand-btn-${service.id}`}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-[#1F2328]/15 text-[#1F2328]/50 hover:border-[#0F5E5B] hover:text-[#0F5E5B] transition-colors"
          >
            {expanded ? <ChevronUp size={18} strokeWidth={1.5} /> : <ChevronDown size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-8 md:px-10 pb-10 border-t border-[#1F2328]/8">
          <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed mt-7 mb-8 max-w-3xl">
            {service.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter mb-4">What's Included</p>
              <ul className="space-y-2">
                {service.included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <div className="w-1 h-1 bg-[#0F5E5B] mt-2 flex-shrink-0" />
                    <span className="text-sm font-inter text-[#1F2328]/70 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-4">Not Included</p>
              <ul className="space-y-2">
                {service.notIncluded.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <div className="w-1 h-1 bg-[#A7ADB5] mt-2 flex-shrink-0" />
                    <span className="text-sm font-inter text-[#A7ADB5] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter mb-4">Timeline Variables</p>
              <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed">{service.timelineFactors}</p>
              <Link
                to="/contact"
                data-testid={`service-quote-btn-${service.id}`}
                className="inline-flex items-center gap-2 mt-6 h-10 px-6 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors"
              >
                Request Quote <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  useScrollReveal();

  useEffect(() => {
    document.title = 'Services — Septa Group Kerala Construction';
  }, []);

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 md:py-28 bg-[#F3F0E8]" data-testid="services-hero">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#C6A15B] font-inter mb-4 reveal">
              What We Build
            </p>
            <h1 className="text-4xl md:text-6xl font-sora font-light text-[#1F2328] tracking-tight leading-tight mb-6 reveal reveal-delay-1">
              Services
            </h1>
            <p className="text-base md:text-lg font-inter font-light text-[#1F2328]/55 leading-relaxed reveal reveal-delay-2">
              We work across institutional, healthcare, commercial, and residential sectors. Each category below outlines what is included, what is not, and what shapes the timeline — so you can compare proposals accurately.
            </p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-12 md:py-20 bg-[#F3F0E8]" data-testid="services-list">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 space-y-4">
          {services.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0F5E5B]" data-testid="services-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-2xl font-sora font-light text-white tracking-tight">Not sure which service fits your project?</p>
            <p className="text-sm font-inter text-white/60 mt-1">We will help you scope it correctly before any commitment.</p>
          </div>
          <Link
            to="/contact"
            data-testid="services-cta-btn"
            className="flex-shrink-0 h-12 px-8 bg-white text-[#0F5E5B] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#F3F0E8] transition-colors flex items-center gap-2"
          >
            Talk to Us <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}

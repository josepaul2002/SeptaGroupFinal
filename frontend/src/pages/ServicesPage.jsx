import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const offerings = [
  {
    id: 'design-build',
    number: '01',
    category: 'Design–Build Delivery',
    tagline: 'Architect-led design with Septa delivery — one coordinated team from first schematic to handover.',
    description: 'Design–Build is the most integrated service Septa offers. We partner with an architect from the Septa Ecosystem to deliver the project as a coordinated team: the architect leads design, Septa leads construction, and both are accountable to the client from a single programme. This eliminates the communication gap that causes most construction cost overruns and design dilution.',
    included: [
      'Architect partner selection and introduction (from Septa Ecosystem)',
      'Full civil and structural construction',
      'MEP coordination with Nexus or approved consultant',
      'Material procurement to architect specification',
      'Weekly joint progress reporting (architect + Septa)',
      'Full snag-to-handover management',
    ],
    notIncluded: [
      'Architect fees (paid directly to architect by client)',
      'Interior fit-out (unless specified)',
      'Furniture, fixtures, and loose items',
      'External landscape (available as add-on via Greenseed)',
    ],
    timelineFactors: 'Design–Build timelines include 6–10 weeks for design development before construction starts. Total programmes range from 14 to 30 months depending on project scale.',
    bestFor: 'Clients building their first large project who want one point of coordination accountability.',
  },
  {
    id: 'bespoke-residences',
    number: '02',
    category: 'Bespoke Residences',
    tagline: 'Premium homes and villa complexes where design intent and finish precision are non-negotiable.',
    description: 'Residential projects where the owner will notice every deviation from specification — and where finish consistency across multiple units is as important as the design itself. Septa\'s bespoke residential service coordinates construction with interiors, landscape, and smart home systems from a unified programme.',
    included: [
      'Full civil, structural, and waterproofing works',
      'Premium internal and external finishing to architect specification',
      'Kitchen and bathroom infrastructure to interior designer specification',
      'Pool and terrace civil works coordination',
      'Smart home infrastructure (conduits, panels, network) via Hypha Systems',
      'Two-round internal snagging before buyer or owner walkthrough',
      'Unit-level finish matrix for multi-unit projects',
    ],
    notIncluded: [
      'Interior fit-out design fees (Studio Pith / Woven can be introduced)',
      'Furniture and loose furnishings',
      'Smart home equipment supply and programming (Hypha scope)',
      'Landscape design fees (Greenseed can be introduced)',
    ],
    timelineFactors: '12–22 months depending on unit count and specification level. Natural stone cladding and custom joinery add 15–20% to schedule. Villa projects on hillside terrain require geotechnical pre-assessment.',
    bestFor: 'Boutique developers, individual villa owners, and multi-unit residential developers who value finish quality above all.',
  },
  {
    id: 'institutional-education',
    number: '03',
    category: 'Institutional & Education Delivery',
    tagline: 'Campus and facility delivery with phased construction protocols for organisations that cannot afford disruption.',
    description: 'Schools, government offices, community facilities, and civic buildings where the organisation must continue operating during construction. Septa\'s institutional delivery methodology defines phased site access, stakeholder communication protocols, and operational continuity commitments before the first concrete pour.',
    included: [
      'Full civil and structural construction',
      'Phased delivery schedule aligned to client operational calendar',
      'Dedicated client communication protocol (weekly briefings)',
      'Noise and dust management plan — updated per phase',
      'External third-party structural quality audit',
      'Snag-to-handover with formal sign-off per phase',
    ],
    notIncluded: [
      'IT infrastructure and AV systems (available via Hypha)',
      'Specialist lab or clinical equipment installation',
      'Furniture and institutional fixtures',
      'Architect and structural engineer fees',
    ],
    timelineFactors: '12–28 months. Phased delivery adds 10–20% to programme but protects operational continuity. Approval timelines with municipal and government bodies should be factored at 8–14 weeks pre-start.',
    bestFor: 'Educational institutions, NGOs, and government bodies commissioning new or expanded facilities.',
  },
  {
    id: 'commercial-mixeduse',
    number: '04',
    category: 'Commercial & Mixed-use Delivery',
    tagline: 'Commercial buildings and mixed-use developments where delivery certainty is directly tied to financial outcomes.',
    description: 'For commercial developers and investors where lease-start dates, tenant pre-commitments, and construction cost management are the primary metrics of delivery success. Septa\'s commercial delivery service includes milestone-aligned stage payments, independent QS oversight, and floor-by-floor handover capability for mixed-use buildings.',
    included: [
      'Full structural works and basement waterproofing',
      'Core and shell construction to developer or architect specification',
      'Tenant-ready MEP stub-out infrastructure',
      'Floor-by-floor phased handover (for pre-let developments)',
      'Independent QS cost reporting via ProQS',
      'Post-occupancy structural inspection at 90 days',
    ],
    notIncluded: [
      'Tenant fit-outs (coordinated but contracted separately)',
      'Lift supply and installation (Septa manages civil works and coordinates with vendor)',
      'Branding and signage (Signal Brand Studio can be introduced)',
      'Post-completion property marketing (Narrative Digital can be introduced)',
    ],
    timelineFactors: '18–32 months for mid-scale commercial developments. Floor-by-floor handover programmes require leasing schedule from developer at programme start. Municipal approval time is a critical path item — typically 10–16 weeks.',
    bestFor: 'Commercial developers, investment developers, and institutional investors commissioning office, retail, or mixed-use assets.',
  },
  {
    id: 'pmc',
    number: '05',
    category: 'Project Delivery Management',
    tagline: 'Structured site oversight and delivery management for clients who have appointed their own contractors.',
    description: 'For clients who have already appointed a contractor but want independent site supervision, quality oversight, and progress accountability. Septa\'s PMC service provides weekly inspection, quality checkpoint enforcement, and communication discipline — without replacing the appointed contractor.',
    included: [
      'Weekly site visits with written progress reports',
      'Quality checkpoint inspection at structural, waterproofing, and finishing stages',
      'Contractor coordination and performance review',
      'Variation management — change orders reviewed before approval',
      'Snag list generation and closure tracking',
      'Client-facing progress dashboard (updated weekly)',
    ],
    notIncluded: [
      'Contractor supply or direct labour management',
      'Design or architectural services',
      'Legal, contract arbitration, or dispute resolution',
      'Procurement of materials or subcontractors',
    ],
    timelineFactors: 'PMC engagement mirrors the construction programme. Initial scope review takes 2–3 weeks. Suitable for projects with construction values above ₹50 lakhs.',
    bestFor: 'Clients managing their own contractor appointment who want a professional delivery management layer.',
  },
  {
    id: 'partnership-execution',
    number: '06',
    category: 'Partnership Execution',
    tagline: 'Selected venture and joint delivery projects where Septa participates as a co-investor or co-developer.',
    description: 'For select projects where the development risk profile, partner alignment, and project quality warrant Septa\'s participation beyond a construction contract. Partnership Execution is not a standard offering — it is evaluated on a case-by-case basis for projects where Septa has a material reason to participate in the delivery upside.',
    included: [
      'Evaluated on a project-specific basis',
      'Typically involves Septa\'s co-participation in design-build or develop-and-sell structures',
      'Full construction delivery as part of a wider partnership arrangement',
    ],
    notIncluded: [
      'All enquiries for this service are reviewed on merit and fit',
      'No standard terms — structured per project',
    ],
    timelineFactors: 'Initial discussion and alignment typically takes 4–6 weeks before any formal commitment.',
    bestFor: 'Developers and investment partners with high-quality project pipelines interested in exploring structured delivery partnerships with Septa.',
  },
];

function OfferingCard({ offering, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#1F2328]/8 bg-white reveal" data-testid={`offering-card-${offering.id}`}>
      <div className="p-8 md:p-10 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl font-sora font-light text-[#1F2328]/10 leading-none">{offering.number}</span>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C6A15B] font-inter">{offering.category}</p>
            </div>
            <p className="text-sm font-inter font-light text-[#1F2328]/55 leading-relaxed max-w-2xl">{offering.tagline}</p>
          </div>
          <button aria-label={expanded ? 'Collapse' : 'Expand'} data-testid={`offering-expand-${offering.id}`}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-[#1F2328]/15 text-[#1F2328]/50 hover:border-[#0F5E5B] hover:text-[#0F5E5B] transition-colors">
            {expanded ? <ChevronUp size={18} strokeWidth={1.5} /> : <ChevronDown size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-8 md:px-10 pb-10 border-t border-[#1F2328]/8">
          <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed mt-7 mb-8 max-w-3xl">{offering.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter mb-4">What's Included</p>
              <ul className="space-y-2">
                {offering.included.map(item => (
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
                {offering.notIncluded.map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <div className="w-1 h-1 bg-[#A7ADB5] mt-2 flex-shrink-0" />
                    <span className="text-sm font-inter text-[#A7ADB5] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter mb-4">Timeline Variables</p>
              <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed mb-4">{offering.timelineFactors}</p>
              {offering.bestFor && (
                <div className="border-t border-[#A7ADB5]/20 pt-4">
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-2">Best For</p>
                  <p className="text-xs font-inter text-[#1F2328]/55 leading-relaxed">{offering.bestFor}</p>
                </div>
              )}
              <Link to="/contact" data-testid={`offering-quote-btn-${offering.id}`}
                className="inline-flex items-center gap-2 mt-5 h-10 px-6 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <p className="text-xs uppercase tracking-[0.28em] text-[#C6A15B] font-inter mb-4 reveal">What We Deliver</p>
              <h1 className="text-4xl md:text-6xl font-sora font-light text-[#1F2328] tracking-tight leading-tight mb-6 reveal reveal-delay-1">
                Services
              </h1>
              <p className="text-base md:text-lg font-inter font-light text-[#1F2328]/55 leading-relaxed reveal reveal-delay-2">
                Septa delivers construction as a discipline — not just as a commodity service. Each offering below defines what is included, what is not, and what shapes the programme. Compare accurately.
              </p>
            </div>
            <div className="lg:col-span-5 reveal reveal-delay-3">
              <div className="border-l-2 border-[#C6A15B] pl-5 py-2">
                <p className="text-sm font-inter font-light text-[#1F2328]/55 leading-relaxed italic">
                  "The partner ecosystem behind Septa means that — for clients who want it — architecture, interiors, landscape, and technology are available from one coordinated team, not six separate conversations."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section className="py-8 md:py-12 bg-[#F3F0E8]" data-testid="offerings-list">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 space-y-4">
          {offerings.map((offering, i) => (
            <OfferingCard key={offering.id} offering={offering} index={i} />
          ))}
        </div>
      </section>

      {/* Ecosystem mention */}
      <section className="py-16 md:py-20 bg-[#1F2328]" data-testid="services-ecosystem-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Beyond Construction</p>
              <h2 className="text-2xl md:text-3xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight mb-4">
                Need the full partner stack, not just the build?
              </h2>
              <p className="text-sm font-inter font-light text-[#F3F0E8]/50 leading-relaxed">
                Septa's Ecosystem includes architects, MEP engineers, interiors, landscape, smart home, and marketing partners. Explore the directory or ask us to propose a coordinated team for your project type.
              </p>
            </div>
            <div className="md:col-span-5 flex flex-wrap gap-4">
              <Link to="/ecosystem" data-testid="services-ecosystem-btn"
                className="h-12 px-8 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors flex items-center gap-2">
                Explore Ecosystem <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
              <Link to="/contact" data-testid="services-contact-btn"
                className="h-12 px-8 border border-[#F3F0E8]/20 text-[#F3F0E8] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#F3F0E8] hover:text-[#1F2328] transition-all flex items-center gap-2">
                Talk to Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

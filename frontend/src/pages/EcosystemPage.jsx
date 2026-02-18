import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Info, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { usePartners, getText } from '../hooks/useApi';

const CATEGORIES = [
  'All',
  'Architecture & Design',
  'Interiors & Fit-out',
  'Engineering (MEP/Structural/QS)',
  'Landscape & Outdoor',
  'Materials & Vendors',
  'Smart Home / Technology',
  'Branding, Signage & Wayfinding',
  'Marketing & Digital',
  'Leasing & Real Estate',
  'Legal / Finance',
];

const RELATIONSHIP_COLORS = {
  'Core Partner': 'bg-[#E8F0EF] text-[#0F5E5B] border-[#0F5E5B]/20',
  'Project Partner': 'bg-[#F0EBE5] text-[#7A4E2D] border-[#7A4E2D]/20',
  'Preferred Vendor': 'bg-[#F0F0EA] text-[#5C5C35] border-[#5C5C35]/20',
  'Technology Partner': 'bg-[#EEF0F7] text-[#3B4A8A] border-[#3B4A8A]/20',
  'Group Company': 'bg-[#1F2328]/8 text-[#1F2328] border-[#1F2328]/20',
};

const solutionPacks = [
  {
    id: 'premium-home',
    title: 'Premium Home Pack',
    tagline: 'For clients building a home that is meant to last and feel entirely their own.',
    partners: ['Architect', 'Interiors', 'Landscape', 'Smart Home', 'Septa Delivery'],
    examples: ['Aether / Forma Studio', 'Woven Interiors / Studio Pith', 'Greenseed', 'Hypha Systems'],
    link: '/contact?pack=premium-home',
  },
  {
    id: 'retail-launch',
    title: 'Retail Launch Pack',
    tagline: 'For developers launching a commercial or retail address that needs to attract tenants before completion.',
    partners: ['Architect', 'MEP Engineering', 'Fit-out', 'Signage & Wayfinding', 'Marketing', 'Septa Delivery'],
    examples: ['Axis / Forma Studio', 'Nexus MEP', 'Signal Brand Studio', 'Narrative Digital'],
    link: '/contact?pack=retail-launch',
  },
  {
    id: 'institutional-excellence',
    title: 'Institutional Excellence Pack',
    tagline: 'For institutional clients delivering a campus, facility, or civic building with operational continuity requirements.',
    partners: ['Architect', 'Structural Engineering', 'MEP', 'QS', 'Phased Septa Delivery'],
    examples: ['Axis Architects', 'Meridian Structural', 'Nexus MEP', 'ProQS'],
    link: '/contact?pack=institutional',
  },
];

export default function EcosystemPage() {
  useScrollReveal();
  const { data: partners, loading } = usePartners();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  useEffect(() => {
    document.title = 'The Septa Ecosystem — Curated Partners for Every Project';
  }, []);

  const allDistricts = useMemo(() => {
    const d = new Set(['All']);
    partners.forEach(p => p.districts?.forEach(dist => d.add(dist)));
    return [...d].sort((a, b) => a === 'All' ? -1 : a.localeCompare(b));
  }, [partners]);

  const filtered = useMemo(() => {
    return partners.filter(p => {
      const name = getText(p.name);
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = search === '' ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        p.specialties?.some(s => s.toLowerCase().includes(search.toLowerCase()));
      const matchesDistrict = selectedDistrict === 'All' || p.districts?.includes(selectedDistrict);
      return matchesCategory && matchesSearch && matchesDistrict;
    });
  }, [partners, activeCategory, search, selectedDistrict]);

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 md:py-28 bg-[#1F2328]" data-testid="ecosystem-hero">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <p className="text-xs uppercase tracking-[0.28em] text-[#C6A15B] font-inter mb-4 reveal">
                Partner Network
              </p>
              <h1 className="text-4xl md:text-6xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight mb-6 reveal reveal-delay-1">
                The Septa<br />Ecosystem
              </h1>
              <p className="text-base md:text-lg font-inter font-light text-[#F3F0E8]/55 leading-relaxed reveal reveal-delay-2 max-w-xl">
                Septa is a delivery studio, not just a contractor. Behind every project is a curated network of architects, engineers, designers, material specialists, and technology partners — each selected for quality and discipline of execution.
              </p>
            </div>
            <div className="lg:col-span-5 reveal reveal-delay-3">
              <div className="border border-[#C6A15B]/25 p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Info size={14} className="text-[#C6A15B] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <p className="text-xs font-inter font-medium text-[#C6A15B] uppercase tracking-wider">On partnerships</p>
                </div>
                <p className="text-sm font-inter font-light text-[#F3F0E8]/60 leading-relaxed">
                  Partners listed here are independent specialists. Depending on project scope, they may be engaged directly by the client or introduced via Septa. Septa remains accountable only for the scope contracted under Septa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 bg-white border-b border-[#A7ADB5]/20" data-testid="ecosystem-filter-bar">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-4">
          <div className="flex flex-col gap-4">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2" data-testid="category-filters">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  data-testid={`category-filter-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}
                  className={`text-xs font-inter px-3 py-1.5 border transition-colors whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-[#0F5E5B] text-white border-[#0F5E5B]'
                      : 'text-[#1F2328]/60 border-[#A7ADB5]/30 hover:border-[#0F5E5B] hover:text-[#0F5E5B]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Search + District */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A7ADB5]" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  data-testid="ecosystem-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-xs font-inter border border-[#A7ADB5]/30 bg-transparent text-[#1F2328] placeholder-[#A7ADB5] outline-none focus:border-[#0F5E5B] transition-colors"
                />
              </div>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                data-testid="district-filter"
                className="h-9 px-3 text-xs font-inter border border-[#A7ADB5]/30 bg-transparent text-[#1F2328] outline-none focus:border-[#0F5E5B] transition-colors"
              >
                {allDistricts.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-14 md:py-20 bg-[#F3F0E8]" data-testid="ecosystem-partners-grid">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0F5E5B]" size={32} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[#A7ADB5] font-inter text-sm">No partners match the current filters.</p>
              <button
                onClick={() => { setActiveCategory('All'); setSearch(''); setSelectedDistrict('All'); }}
                className="mt-4 text-sm font-inter text-[#0F5E5B] hover:underline"
                data-testid="clear-filters-btn"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-inter text-[#A7ADB5] mb-8 uppercase tracking-widest">
                {filtered.length} {filtered.length === 1 ? 'partner' : 'partners'} {activeCategory !== 'All' ? `· ${activeCategory}` : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((partner, i) => (
                  <Link
                    key={partner.slug}
                    to={`/ecosystem/${partner.slug}`}
                    data-testid={`partner-card-${partner.slug}`}
                    className={`group block bg-white border border-[#1F2328]/8 hover:border-[#C6A15B]/50 transition-all duration-300 reveal reveal-delay-${Math.min(i % 3 + 1, 4)}`}
                  >
                    {partner.cover_image && (
                      <div className="h-40 overflow-hidden bg-[#E8E6E0]">
                        <img
                          src={partner.cover_image}
                          alt={getText(partner.name)}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-base font-sora font-medium text-[#1F2328] leading-snug group-hover:text-[#0F5E5B] transition-colors">
                          {getText(partner.name)}
                          {partner.relationship_type === 'Group Company' && (
                            <span className="ml-2 text-xs font-inter text-[#C6A15B] normal-case font-normal">Group Co.</span>
                          )}
                        </h3>
                        {partner.featured && (
                          <div className="w-1.5 h-1.5 bg-[#C6A15B] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs font-inter text-[#A7ADB5] mb-3">{partner.category}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {partner.specialties?.slice(0, 2).map(s => (
                          <span key={s} className="text-xs font-inter px-2 py-0.5 bg-[#F3F0E8] text-[#1F2328]/60 border border-[#A7ADB5]/20">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-inter px-2 py-0.5 border ${RELATIONSHIP_COLORS[partner.relationship_type] || 'bg-gray-100 text-gray-600'}`}>
                          {partner.relationship_type}
                        </span>
                        <ArrowRight size={13} className="text-[#A7ADB5] group-hover:text-[#0F5E5B] transition-colors" strokeWidth={1.5} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Solution Packs */}
      <section className="py-20 md:py-28 bg-white" data-testid="solution-packs-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="mb-14 reveal">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Coordinated Delivery</p>
            <h2 className="text-3xl md:text-4xl font-sora font-light text-[#1F2328] tracking-tight leading-tight max-w-lg">
              Solution Packs
            </h2>
            <p className="text-base font-inter font-light text-[#1F2328]/55 mt-4 max-w-xl leading-relaxed">
              For clients who want a fully coordinated team rather than managing multiple appointments separately — Septa can orchestrate a curated partner stack for your project type.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solutionPacks.map((pack, i) => (
              <div
                key={pack.id}
                className={`p-8 border border-[#1F2328]/8 hover:border-[#C6A15B]/50 transition-colors duration-300 reveal reveal-delay-${i + 1}`}
                data-testid={`solution-pack-${pack.id}`}
              >
                <div className="w-5 h-px bg-[#C6A15B] mb-5" />
                <h3 className="text-lg font-sora font-medium text-[#1F2328] mb-3 leading-snug">{pack.title}</h3>
                <p className="text-sm font-inter font-light text-[#1F2328]/55 leading-relaxed mb-5">{pack.tagline}</p>
                <div className="space-y-1.5 mb-6">
                  {pack.partners.map(p => (
                    <div key={p} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#0F5E5B] flex-shrink-0" />
                      <span className="text-xs font-inter text-[#1F2328]/65">{p}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#A7ADB5]/20 pt-4 mb-5">
                  <p className="text-xs font-inter text-[#A7ADB5] uppercase tracking-widest mb-2">Example Partners</p>
                  <p className="text-xs font-inter text-[#1F2328]/55">{pack.examples.join(' · ')}</p>
                </div>
                <Link
                  to={pack.link}
                  data-testid={`pack-enquire-btn-${pack.id}`}
                  className="inline-flex items-center gap-2 text-xs font-inter font-medium text-[#0F5E5B] uppercase tracking-wider hover:text-[#C6A15B] transition-colors"
                >
                  Enquire about this pack <ArrowRight size={11} strokeWidth={1.5} />
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs font-inter text-[#A7ADB5] leading-relaxed max-w-2xl">
            Solution Packs are coordination frameworks — not bundled pricing. Each partner is engaged and contracted independently. Septa facilitates the coordination and is accountable for the construction delivery scope only.
          </p>
        </div>
      </section>
    </div>
  );
}

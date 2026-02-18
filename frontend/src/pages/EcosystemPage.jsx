import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { usePartners, getText } from '../hooks/useApi';
import { useLanguage } from '../components/LanguageToggle';

const relationshipColors = {
  'Group Company': 'bg-[#0F5E5B] text-white',
  'Core Partner': 'bg-[#C6A15B] text-white',
  'Project Partner': 'bg-[#E8F0EF] text-[#0F5E5B]',
  'Preferred Vendor': 'bg-[#F3F0E8] text-[#1F2328]',
};

export default function EcosystemPage() {
  useScrollReveal();
  const { data: partners, loading } = usePartners();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Ecosystem — Septa Group';
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(partners.map(p => p.category))].sort();
    return ['All', ...cats];
  }, [partners]);

  const filtered = useMemo(() => {
    let list = partners;
    if (activeCategory !== 'All') list = list.filter(p => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        getText(p.name).toLowerCase().includes(q) ||
        (p.specialties || []).some(s => s.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [partners, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-[#F3F0E8] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F5E5B]" size={32} />
      </div>
    );
  }

  return (
    <div className="pt-16" data-testid="ecosystem-page">
      {/* Hero */}
      <section className="bg-[#F3F0E8] py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3 reveal">Ecosystem</p>
          <h1 className="text-4xl md:text-5xl font-sora font-light text-[#1F2328] tracking-tight leading-tight max-w-2xl reveal reveal-delay-1">
            The Septa Partner Network
          </h1>
          <p className="text-base font-inter font-light text-[#1F2328]/55 leading-relaxed max-w-xl mt-5 reveal reveal-delay-2">
            A curated network of specialists who bring discipline, quality, and deep domain expertise to every project Septa delivers.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white py-6 border-b border-[#A7ADB5]/15 sticky top-16 z-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div className="flex flex-wrap gap-2" data-testid="ecosystem-category-filter">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  data-testid={`category-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`px-3 py-1.5 text-xs font-inter uppercase tracking-wider transition-colors border ${
                    activeCategory === cat
                      ? 'bg-[#0F5E5B] text-white border-[#0F5E5B]'
                      : 'border-[#A7ADB5]/30 text-[#1F2328]/60 hover:border-[#0F5E5B]/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A7ADB5]" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm font-inter border border-[#A7ADB5]/30 bg-transparent outline-none focus:border-[#0F5E5B] transition-colors"
                data-testid="ecosystem-search"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partner Grid */}
      <section className="py-12 md:py-16 bg-[#F3F0E8]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <p className="text-xs font-inter text-[#A7ADB5] mb-6">{filtered.length} partner{filtered.length !== 1 ? 's' : ''}</p>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg font-sora text-[#1F2328]/40">No partners match your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((partner, i) => {
                const cardImage = partner.media?.card_image || partner.cover_image || partner.logo_url;
                const hasWarning = !cardImage;
                return (
                  <Link
                    key={partner.slug}
                    to={`/ecosystem/${partner.slug}`}
                    className={`group block bg-white border border-[#A7ADB5]/15 hover:border-[#0F5E5B]/30 hover:shadow-md transition-all duration-300 reveal reveal-delay-${(i % 3) + 1}`}
                    data-testid={`partner-card-${partner.slug}`}
                  >
                    {/* Card Image (16:9) */}
                    <div className="aspect-[16/9] overflow-hidden bg-[#E8E6E0] relative">
                      {cardImage ? (
                        <img src={cardImage} alt={getText(partner.name)} loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1F2328]/5">
                          {partner.media?.logo_image || partner.logo_url ? (
                            <img src={partner.media?.logo_image || partner.logo_url} alt=""
                              className="max-w-[50%] max-h-[50%] object-contain opacity-40" />
                          ) : (
                            <span className="text-3xl font-sora font-light text-[#1F2328]/10">
                              {getText(partner.name).charAt(0)}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Relationship badge */}
                      <span className={`absolute top-3 left-3 text-[10px] font-inter font-medium uppercase tracking-wider px-2 py-0.5 ${
                        relationshipColors[partner.relationship_type] || relationshipColors['Project Partner']
                      }`}>
                        {partner.relationship_type}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1.5">
                        <h3 className="text-sm font-sora font-medium text-[#1F2328] group-hover:text-[#0F5E5B] transition-colors">
                          {t(partner.name)}
                        </h3>
                        <ArrowRight size={14} className="text-[#A7ADB5] group-hover:text-[#0F5E5B] transition-colors flex-shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs font-inter text-[#A7ADB5] mb-2">{partner.category}</p>
                      {partner.specialties?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {partner.specialties.slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] font-inter px-1.5 py-0.5 bg-[#F3F0E8] text-[#1F2328]/55 border border-[#A7ADB5]/10">
                              {s}
                            </span>
                          ))}
                          {partner.specialties.length > 3 && (
                            <span className="text-[10px] font-inter px-1.5 py-0.5 text-[#A7ADB5]">
                              +{partner.specialties.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1F2328]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Join our Network</p>
          <h2 className="text-2xl md:text-3xl font-sora font-light text-[#F3F0E8] tracking-tight mb-6">
            Are you a specialist firm looking to collaborate?
          </h2>
          <Link
            to="/contact?ref=ecosystem"
            data-testid="ecosystem-cta-btn"
            className="inline-flex items-center gap-2 h-12 px-8 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors"
          >
            Get in Touch <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}

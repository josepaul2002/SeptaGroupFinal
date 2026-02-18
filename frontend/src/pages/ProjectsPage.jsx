import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import projectsData from '../content/projects.json';
import partnersData from '../content/partners.json';

const { projects } = projectsData;
const { partners } = partnersData;

const typeFilters = ['All', 'Institutional', 'Healthcare', 'Commercial', 'Residential', 'Mixed-use'];
const statusFilters = ['All', 'Completed', 'Ongoing'];

const typeColors = {
  Institutional: 'bg-[#E8F0EF] text-[#0F5E5B]',
  Healthcare: 'bg-[#EEF0F7] text-[#3B4A8A]',
  Commercial: 'bg-[#F0EBE5] text-[#7A4E2D]',
  Residential: 'bg-[#EFF0E8] text-[#4A5C1F]',
  'Mixed-use': 'bg-[#F0EAF4] text-[#6A3A7A]',
};

function getArchitectName(project) {
  const arch = project.partnerStack?.find(ps => ps.roleLabel === 'Architect');
  if (!arch) return null;
  const partner = partners.find(p => p.id === arch.partnerId);
  return partner ? partner.name : null;
}

export default function ProjectsPage() {
  useScrollReveal();
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [partnerFilter, setPartnerFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');

  useEffect(() => {
    document.title = 'Projects — Septa Group Kerala Construction';
  }, []);

  const allTags = useMemo(() => {
    const t = new Set();
    projects.forEach(p => p.design?.designTags?.forEach(tag => t.add(tag)));
    return ['All', ...Array.from(t).sort()];
  }, []);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchType = typeFilter === 'All' || p.type === typeFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchPartner = partnerFilter === 'All' || p.partnerStack?.some(ps => ps.partnerId === partnerFilter);
      const matchTag = tagFilter === 'All' || p.design?.designTags?.includes(tagFilter);
      return matchType && matchStatus && matchPartner && matchTag;
    });
  }, [typeFilter, statusFilter, partnerFilter, tagFilter]);

  const clearFilters = () => { setTypeFilter('All'); setStatusFilter('All'); setPartnerFilter('All'); setTagFilter('All'); };

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 md:py-28 bg-[#F3F0E8]" data-testid="projects-hero">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#C6A15B] font-inter mb-4 reveal">
              Our Work
            </p>
            <h1 className="text-4xl md:text-6xl font-sora font-light text-[#1F2328] tracking-tight leading-tight mb-6 reveal reveal-delay-1">
              Projects
            </h1>
            <p className="text-base md:text-lg font-inter font-light text-[#1F2328]/55 leading-relaxed reveal reveal-delay-2">
              Each project tells three stories: what was built, what challenge was solved, and which partner network made it possible. Filter by type, status, partner, or design approach.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 bg-white border-b border-[#A7ADB5]/20" data-testid="projects-filter-bar">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-4">
          <div className="flex flex-col gap-3">
            {/* Type + Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#A7ADB5] font-inter flex-shrink-0">
                <Filter size={13} strokeWidth={1.5} />
                Type
              </div>
              <div className="flex flex-wrap gap-2">
                {typeFilters.map(f => (
                  <button key={f} onClick={() => setTypeFilter(f)} data-testid={`type-filter-${f.toLowerCase()}`}
                    className={`text-xs font-inter px-3 py-1.5 border transition-colors ${typeFilter === f ? 'bg-[#0F5E5B] text-white border-[#0F5E5B]' : 'text-[#1F2328]/60 border-[#A7ADB5]/30 hover:border-[#0F5E5B] hover:text-[#0F5E5B]'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-4">
                {statusFilters.map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)} data-testid={`status-filter-${f.toLowerCase()}`}
                    className={`text-xs font-inter px-3 py-1.5 border transition-colors ${statusFilter === f ? 'bg-[#1F2328] text-white border-[#1F2328]' : 'text-[#1F2328]/60 border-[#A7ADB5]/30 hover:border-[#1F2328] hover:text-[#1F2328]'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {/* Partner + Tag */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter flex-shrink-0">Partner</div>
              <select
                value={partnerFilter}
                onChange={e => setPartnerFilter(e.target.value)}
                data-testid="partner-filter"
                className="h-8 px-2 text-xs font-inter border border-[#A7ADB5]/30 bg-transparent text-[#1F2328] outline-none focus:border-[#0F5E5B]"
              >
                <option value="All">All Partners</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter flex-shrink-0 sm:ml-3">Design</div>
              <select
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                data-testid="tag-filter"
                className="h-8 px-2 text-xs font-inter border border-[#A7ADB5]/30 bg-transparent text-[#1F2328] outline-none focus:border-[#0F5E5B]"
              >
                {allTags.map(t => <option key={t} value={t}>{t === 'All' ? 'All Approaches' : t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-14 md:py-20 bg-[#F3F0E8]" data-testid="projects-grid-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          {filtered.length === 0 ? (
            <div className="py-20 text-center" data-testid="no-projects-msg">
              <p className="text-[#A7ADB5] font-inter text-sm">No projects match the selected filters.</p>
              <button onClick={clearFilters} className="mt-4 text-sm font-inter text-[#0F5E5B] hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
              {filtered.map((project, i) => {
                const architectName = getArchitectName(project);
                return (
                  <Link
                    key={project.slug}
                    to={`/projects/${project.slug}`}
                    data-testid={`project-item-${project.slug}`}
                    className={`group block reveal reveal-delay-${Math.min(i % 3 + 1, 4)}`}
                  >
                    <div className="relative overflow-hidden aspect-[4/3] bg-[#E8E6E0]">
                      <img src={project.image} alt={project.title} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      {project.status === 'Ongoing' && (
                        <div className="absolute top-4 right-4 bg-[#0F5E5B] text-white text-xs font-inter px-2.5 py-1 uppercase tracking-wider">
                          Ongoing
                        </div>
                      )}
                    </div>
                    <div className="pt-5 pb-6 border-b border-[#A7ADB5]/20">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-base font-sora font-medium text-[#1F2328] leading-snug">{project.title}</h3>
                        <span className={`text-xs font-inter px-2 py-0.5 flex-shrink-0 ${typeColors[project.type] || 'bg-gray-100 text-gray-600'}`}>
                          {project.type}
                        </span>
                      </div>
                      {architectName && (
                        <p className="text-xs font-inter text-[#0F5E5B]/80 mb-1">
                          Arch: {architectName}
                        </p>
                      )}
                      <p className="text-xs font-inter text-[#A7ADB5] mb-3">
                        {project.location} · {project.sqft} sqft · {project.duration}
                      </p>
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-[#C6A15B] mt-1.5 flex-shrink-0" />
                        <p className="text-xs font-inter text-[#1F2328]/60 leading-relaxed">
                          <span className="font-medium text-[#1F2328]/70">Key challenge: </span>
                          {project.challenge}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.design?.designTags?.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs font-inter px-2 py-0.5 bg-[#F3F0E8] text-[#A7ADB5] border border-[#A7ADB5]/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="text-xs font-inter font-medium text-[#0F5E5B] uppercase tracking-wider group-hover:text-[#C6A15B] transition-colors">View Case Study</span>
                        <ArrowRight size={11} className="text-[#0F5E5B] group-hover:text-[#C6A15B] transition-colors" strokeWidth={1.5} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

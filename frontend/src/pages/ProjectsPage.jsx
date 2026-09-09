import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useProjects, usePartners, getText } from '../hooks/useApi';

const typeFilters = ['All', 'Institutional', 'Healthcare', 'Commercial', 'Residential', 'Mixed-use'];
const statusFilters = ['All', 'Completed', 'Ongoing'];

const typeColors = {
  Institutional: 'bg-[#E8F0EF] text-[#606060]',
  Healthcare: 'bg-[#EEF0F7] text-[#3B4A8A]',
  Commercial: 'bg-[#F0EBE5] text-[#7A4E2D]',
  Residential: 'bg-[#EFF0E8] text-[#4A5C1F]',
  'Mixed-use': 'bg-[#F0EAF4] text-[#6A3A7A]',
};

export default function ProjectsPage() {
  useScrollReveal();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: partners, loading: partnersLoading } = usePartners();
  
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [partnerFilter, setPartnerFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');

  useEffect(() => {
    document.title = 'Projects — Septa Group Kerala Construction';
  }, []);

  const getArchitectName = (project) => {
    const arch = project.partner_stack?.find(ps => ps.role_label === 'Architect');
    if (!arch) return null;
    const partner = partners.find(p => p.slug === arch.partner_id || p.id === arch.partner_id);
    return partner ? getText(partner.name) : null;
  };

  const allTags = useMemo(() => {
    const t = new Set();
    projects.forEach(p => p.design?.tags?.forEach(tag => t.add(tag)));
    return ['All', ...Array.from(t).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchType = typeFilter === 'All' || p.type === typeFilter;
      const matchStatus = statusFilter === 'All' || p.project_status === statusFilter;
      const matchPartner = partnerFilter === 'All' || p.partner_stack?.some(ps => ps.partner_id === partnerFilter);
      const matchTag = tagFilter === 'All' || p.design?.tags?.includes(tagFilter);
      return matchType && matchStatus && matchPartner && matchTag;
    });
  }, [projects, typeFilter, statusFilter, partnerFilter, tagFilter]);

  const clearFilters = () => {
    setTypeFilter('All');
    setStatusFilter('All');
    setPartnerFilter('All');
    setTagFilter('All');
  };

  const loading = projectsLoading || partnersLoading;

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 md:py-28 bg-[#F6F6F3]" data-testid="projects-hero">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#8A8A8A] font-inter mb-4 reveal">
              Our Work
            </p>
            <h1 className="text-4xl md:text-6xl font-sora font-light text-[#050505] tracking-tight leading-tight mb-6 reveal reveal-delay-1">
              Projects
            </h1>
            <p className="text-base md:text-lg font-inter font-light text-[#050505]/55 leading-relaxed reveal reveal-delay-2">
              Each project tells three stories: what was built, what challenge was solved, and which partner network made it possible. Filter by type, status, partner, or design approach.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 bg-white border-b border-[#8A8A8A]/20" data-testid="projects-filter-bar">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-4">
          <div className="flex flex-col gap-3">
            {/* Type + Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8A8A8A] font-inter flex-shrink-0">
                <Filter size={13} strokeWidth={1.5} />
                Type
              </div>
              <div className="flex flex-wrap gap-2">
                {typeFilters.map(f => (
                  <button key={f} onClick={() => setTypeFilter(f)} data-testid={`type-filter-${f.toLowerCase()}`}
                    className={`text-xs font-inter px-3 py-1.5 border transition-colors ${typeFilter === f ? 'bg-[#050505] text-white border-[#606060]' : 'text-[#050505]/60 border-[#8A8A8A]/30 hover:border-[#606060] hover:text-[#606060]'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-4">
                {statusFilters.map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)} data-testid={`status-filter-${f.toLowerCase()}`}
                    className={`text-xs font-inter px-3 py-1.5 border transition-colors ${statusFilter === f ? 'bg-[#050505] text-white border-[#050505]' : 'text-[#050505]/60 border-[#8A8A8A]/30 hover:border-[#050505] hover:text-[#050505]'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {/* Partner + Tag */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter flex-shrink-0">Partner</div>
              <select
                value={partnerFilter}
                onChange={e => setPartnerFilter(e.target.value)}
                data-testid="partner-filter"
                className="h-8 px-2 text-xs font-inter border border-[#8A8A8A]/30 bg-transparent text-[#050505] outline-none focus:border-[#606060]"
              >
                <option value="All">All Partners</option>
                {partners.map(p => <option key={p.slug} value={p.slug}>{getText(p.name)}</option>)}
              </select>
              <div className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter flex-shrink-0 sm:ml-3">Design</div>
              <select
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                data-testid="tag-filter"
                className="h-8 px-2 text-xs font-inter border border-[#8A8A8A]/30 bg-transparent text-[#050505] outline-none focus:border-[#606060]"
              >
                {allTags.map(t => <option key={t} value={t}>{t === 'All' ? 'All Approaches' : t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-14 md:py-20 bg-[#F6F6F3]" data-testid="projects-grid-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          {loading ? (
            <div className="py-20 flex items-center justify-center" data-testid="projects-loading">
              <Loader2 className="animate-spin text-[#606060]" size={32} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center" data-testid="no-projects-msg">
              <p className="text-[#8A8A8A] font-inter text-sm">No projects match the selected filters.</p>
              <button onClick={clearFilters} className="mt-4 text-sm font-inter text-[#606060] hover:underline">
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
                    <div className="relative overflow-hidden aspect-[4/3] bg-[#ECECEA]">
                      {project.image ? (
                        <img src={project.image} alt={getText(project.title)} loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" data-testid={`project-noimg-${project.slug}`}
                          style={{ background: 'linear-gradient(135deg, #606060 0%, #262626 60%, #050505 100%)' }}>
                          <span className="text-xs font-inter uppercase tracking-[0.3em] text-[#8A8A8A]">{project.type}</span>
                        </div>
                      )}
                      {project.project_status === 'Ongoing' && (
                        <div className="absolute top-4 right-4 bg-[#050505] text-white text-xs font-inter px-2.5 py-1 uppercase tracking-wider">
                          Ongoing
                        </div>
                      )}
                    </div>
                    <div className="pt-5 pb-6 border-b border-[#8A8A8A]/20">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-base font-sora font-medium text-[#050505] leading-snug">{getText(project.title)}</h3>
                        <span className={`text-xs font-inter px-2 py-0.5 flex-shrink-0 ${typeColors[project.type] || 'bg-gray-100 text-gray-600'}`}>
                          {project.type}
                        </span>
                      </div>
                      {architectName && (
                        <p className="text-xs font-inter text-[#606060]/80 mb-1">
                          Arch: {architectName}
                        </p>
                      )}
                      <p className="text-xs font-inter text-[#8A8A8A] mb-3">
                        {project.location} · {project.sqft} sqft · {project.duration}
                      </p>
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-[#8A8A8A] mt-1.5 flex-shrink-0" />
                        <p className="text-xs font-inter text-[#050505]/60 leading-relaxed">
                          <span className="font-medium text-[#050505]/70">Key challenge: </span>
                          {getText(project.challenge)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.design?.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs font-inter px-2 py-0.5 bg-[#F6F6F3] text-[#8A8A8A] border border-[#8A8A8A]/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="text-xs font-inter font-medium text-[#606060] uppercase tracking-wider group-hover:text-[#8A8A8A] transition-colors">View Case Study</span>
                        <ArrowRight size={11} className="text-[#606060] group-hover:text-[#8A8A8A] transition-colors" strokeWidth={1.5} />
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

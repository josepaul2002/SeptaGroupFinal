import ResponsiveImage from '../components/ResponsiveImage';
import { ManagedIntro } from '../components/PageSections';
import ContentError from '../components/ContentError';
import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Filter, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useProjects, usePartners, getText } from '../hooks/useApi';

const statusFilters = ['All', 'Completed', 'Ongoing'];

const typeColors = {
  Institutional: 'bg-[#ECECEA] text-[#606060]',
  Healthcare: 'bg-[#ECECEA] text-[#666666]',
  Commercial: 'bg-[#ECECEA] text-[#666666]',
  Residential: 'bg-[#ECECEA] text-[#666666]',
  'Mixed-use': 'bg-[#ECECEA] text-[#666666]',
};

export default function ProjectsPage() {
  useScrollReveal();
  const { data: projects, loading: projectsLoading, error: projectsError, retry } = useProjects();
  const { data: partners } = usePartners();
  
  const [searchParams,setSearchParams]=useSearchParams();
  const typeFilter=searchParams.get('type')||'All',statusFilter=searchParams.get('status')||'All',partnerFilter=searchParams.get('partner')||'All',tagFilter=searchParams.get('tag')||'All';
  const updateFilter=(key,value)=>setSearchParams(previous=>{const next=new URLSearchParams(previous);if(value==='All')next.delete(key);else next.set(key,value);return next;},{replace:true});
  const setTypeFilter=v=>updateFilter('type',v),setStatusFilter=v=>updateFilter('status',v),setPartnerFilter=v=>updateFilter('partner',v),setTagFilter=v=>updateFilter('tag',v);
  const [filtersOpen, setFiltersOpen] = useState(false);


  const getArchitectName = (project) => {
    const arch = project.credits?.find(c => c.entity_type === 'partner' && /architect/i.test(c.role));
    if (!arch) return null;
    const partner = partners.find(p => p.slug === arch.entity_slug);
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
      const matchPartner = partnerFilter === 'All' || p.credits?.some(c => c.entity_type === 'partner' && c.entity_slug === partnerFilter);
      const matchTag = tagFilter === 'All' || p.design?.tags?.includes(tagFilter);
      return matchType && matchStatus && matchPartner && matchTag;
    });
  }, [projects, typeFilter, statusFilter, partnerFilter, tagFilter]);

  const clearFilters=()=>setSearchParams(previous=>{const next=new URLSearchParams(previous);['type','status','partner','tag'].forEach(key=>next.delete(key));return next;},{replace:true});

  const activeFilterCount = [typeFilter !== 'All', statusFilter !== 'All', partnerFilter !== 'All', tagFilter !== 'All'].filter(Boolean).length;

  const loading = projectsLoading;

  return (
    <div className="pt-16 lg:pt-[76px]">
      <ManagedIntro pageId="projects"/>

      {/* Filter Bar */}
      <section className="sticky top-16 lg:top-[76px] z-30 bg-white border-b border-[#8A8A8A]/20" data-testid="projects-filter-bar">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-4">
          <button type="button" className="project-filter-mobile-toggle" aria-expanded={filtersOpen} aria-controls="project-filter-options" onClick={() => setFiltersOpen(v => !v)}><span><Filter size={15}/> Filters{activeFilterCount ? ` · ${activeFilterCount} selected` : ''}</span><span>{filtersOpen ? 'Close −' : 'Choose projects +'}</span></button>
          <div id="project-filter-options" className={`project-filter-content ${filtersOpen ? 'is-open' : ''}`}>
          <div className="flex flex-col gap-3">
            {/* Type + Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8A8A8A] font-inter flex-shrink-0">
                <Filter size={13} strokeWidth={1.5} />
                Type
              </div>
              <div className="flex flex-wrap gap-2">
                {['All',...new Set([...projects.map(p=>p.type).filter(Boolean),...(typeFilter==='All'?[]:[typeFilter])])].map(f => (
                  <button key={f} aria-pressed={typeFilter===f} onClick={() => setTypeFilter(f)} data-testid={`type-filter-${f.toLowerCase()}`}
                    className={`text-xs font-inter px-3 py-1.5 border transition-colors ${typeFilter === f ? 'bg-[#050505] text-white border-[#606060]' : 'text-[#050505]/60 border-[#8A8A8A]/30 hover:border-[#606060] hover:text-[#606060]'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-4">
                {statusFilters.map(f => (
                  <button key={f} aria-pressed={statusFilter===f} onClick={() => setStatusFilter(f)} data-testid={`status-filter-${f.toLowerCase()}`}
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
                aria-label="Filter by partner" value={partnerFilter}
                onChange={e => setPartnerFilter(e.target.value)}
                data-testid="partner-filter"
                className="h-8 px-2 text-xs font-inter border border-[#8A8A8A]/30 bg-transparent text-[#050505] outline-none focus:border-[#606060]"
              >
                <option value="All">All Partners</option>
                {partners.map(p => <option key={p.slug} value={p.slug}>{getText(p.name)}</option>)}
              </select>
              <div className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter flex-shrink-0 sm:ml-3">Design</div>
              <select
                aria-label="Filter by design approach" value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                data-testid="tag-filter"
                className="h-8 px-2 text-xs font-inter border border-[#8A8A8A]/30 bg-transparent text-[#050505] outline-none focus:border-[#606060]"
              >
                {allTags.map(t => <option key={t} value={t}>{t === 'All' ? 'All Approaches' : t}</option>)}
              </select>
            </div>
          </div>
          <div className="project-filter-results"><span aria-live="polite">{filtered.length} project{filtered.length===1?'':'s'}</span><button type="button" className="project-filter-apply" onClick={()=>setFiltersOpen(false)}>Show results & close</button></div>{activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="project-filter-clear">Clear filters</button>}
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
          ) : projectsError ? <ContentError label="Projects" retry={retry} back="/contact"/> : filtered.length === 0 ? (
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
                    <div className="relative overflow-hidden aspect-video bg-[#ECECEA]">
                      {project.image ? (
                        <ResponsiveImage src={project.image} alt={getText(project.title)} loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#050505]" data-testid={`project-noimg-${project.slug}`}>
                          <span className="tech-label text-[11px] text-[#C6A15B]">{project.type}</span>
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
                        {[project.location,project.sqft?`${project.sqft} sq.ft.`:'',project.duration].filter(Boolean).join(' · ')}
                      </p>
                      {getText(project.challenge)&&<div className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-[#8A8A8A] mt-1.5 flex-shrink-0" />
                        <p className="text-xs font-inter text-[#050505]/60 leading-relaxed">
                          <span className="font-medium text-[#050505]/70">Key challenge: </span>
                          {getText(project.challenge)}
                        </p>
                      </div>}
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

import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, MapPin, Calendar, Maximize2, Building2, Users, Loader2, Image, Film, Box, FileText } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useProject, useProjects, usePartners, getText } from '../hooks/useApi';
import { useLanguage } from '../components/LanguageToggle';
import PreviewBanner from '../components/PreviewBanner';
import ImageGallery from '../components/ImageGallery';
import VideoPlayer from '../components/VideoPlayer';
import Model3DViewer from '../components/Model3DViewer';
import PlanDrawings from '../components/PlanDrawings';

const typeColors = {
  Institutional: 'bg-[#E8F0EF] text-[#0F5E5B]',
  Healthcare: 'bg-[#EEF0F7] text-[#3B4A8A]',
  Commercial: 'bg-[#F0EBE5] text-[#7A4E2D]',
  Residential: 'bg-[#EFF0E8] text-[#4A5C1F]',
  'Mixed-use': 'bg-[#F0EAF4] text-[#6A3A7A]',
};

const lensLabels = {
  Residential: { storyLabel: 'The Story', designLabel: 'The Design', deliveryLabel: 'The Delivery', storyAccent: 'Lifestyle · Materials · Design Intent' },
  Commercial: { storyLabel: 'The Brief', designLabel: 'The Design', deliveryLabel: 'The Delivery', storyAccent: 'Timeline · Coordination · ROI Logic' },
  Institutional: { storyLabel: 'The Context', designLabel: 'The Design', deliveryLabel: 'The Delivery', storyAccent: 'Phased Delivery · Stakeholder Continuity' },
};

const TABS = [
  { id: 'story', label: 'Story', icon: FileText },
  { id: 'design', label: 'Design', icon: Image },
  { id: 'delivery', label: 'Delivery', icon: Check },
  { id: 'media', label: 'Media', icon: Film },
  { id: 'partners', label: 'Partners', icon: Users },
];

export default function ProjectCaseStudyPage() {
  useScrollReveal();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const { project, loading: projectLoading } = useProject(slug, isPreview);
  const { data: allProjects, loading: projectsLoading } = useProjects();
  const { data: partners, loading: partnersLoading } = usePartners();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('story');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (project) document.title = `${t(project.title)} — Septa Group`;
  }, [project, t]);

  const loading = projectLoading || projectsLoading || partnersLoading;

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-[#F3F0E8] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F5E5B]" size={32} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="pt-16 min-h-screen bg-[#F3F0E8] flex items-center justify-center" data-testid="case-study-not-found">
        <div className="text-center">
          <p className="text-3xl font-sora font-light text-[#1F2328] mb-3">Project Not Found</p>
          <Link to="/projects" className="text-sm font-inter text-[#0F5E5B] hover:underline flex items-center gap-2 justify-center">
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const getPartner = (id) => partners.find(p => p.slug === id || p.id === id);
  const getRelatedProjects = () => allProjects
    .filter(p => p.slug !== project.slug && (p.client_lens === project.client_lens || p.type === project.type))
    .slice(0, 3);

  const labels = lensLabels[project.client_lens] || lensLabels.Commercial;
  const relatedProjects = getRelatedProjects();
  const projectTitle = t(project.title);
  const showPreviewBanner = isPreview || project._preview_mode;

  const hasMedia = project.media?.hero_video || project.media?.images?.length > 0 || project.media?.model_3d || project.media?.plans?.length > 0 || project.gallery?.length > 0;

  return (
    <div className={showPreviewBanner ? "pt-28" : "pt-16"} data-testid="case-study-page">
      {showPreviewBanner && <PreviewBanner type="project" slug={slug} />}

      {/* Back nav */}
      <div className="bg-[#F3F0E8] border-b border-[#A7ADB5]/20 py-4">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <Link to={showPreviewBanner ? "/admin" : "/projects"} data-testid="back-to-projects-btn"
            className="inline-flex items-center gap-2 text-xs font-inter text-[#A7ADB5] hover:text-[#0F5E5B] transition-colors uppercase tracking-widest">
            <ArrowLeft size={13} strokeWidth={1.5} /> {showPreviewBanner ? "Back to Admin" : "All Projects"}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[45vh] md:h-[60vh] overflow-hidden bg-[#E8E6E0]">
        {project.media?.hero_video ? (
          <VideoPlayer src={project.media.hero_video} poster={project.image} title={projectTitle} className="w-full h-full" autoPlay />
        ) : (
          <img src={project.image} alt={projectTitle} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[#1F2328]/45 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16 pointer-events-none">
          <div className="max-w-[1400px] mx-auto">
            <span className="inline-block text-xs font-inter uppercase tracking-widest text-[#C6A15B] mb-3">{project.type}</span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-sora font-light text-white tracking-tight leading-tight">
              {projectTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* Project Meta */}
      <section className="py-8 bg-white border-b border-[#A7ADB5]/15">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {[
              { icon: <MapPin size={12} strokeWidth={1.5} />, label: 'Location', val: project.location },
              { icon: <Maximize2 size={12} strokeWidth={1.5} />, label: 'Area', val: `${project.sqft} sq.ft.` },
              { icon: <Calendar size={12} strokeWidth={1.5} />, label: 'Duration', val: project.duration },
              { icon: <Building2 size={12} strokeWidth={1.5} />, label: 'Client Type', val: project.client_type },
              { icon: <Users size={12} strokeWidth={1.5} />, label: 'Lens', val: project.client_lens },
              { icon: null, label: 'Status', val: project.project_status },
            ].map((m, i) => (
              <div key={i}>
                <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-1">{m.label}</p>
                <div className="flex items-center gap-1.5">
                  {m.icon && <span className="text-[#C6A15B]">{m.icon}</span>}
                  <p className="text-sm font-inter font-medium text-[#1F2328]">{m.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#A7ADB5]/20" data-testid="project-tabs">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="flex overflow-x-auto gap-0">
            {TABS.filter(tab => tab.id !== 'media' || hasMedia).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`project-tab-${tab.id}`}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-inter uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-[#0F5E5B] border-[#0F5E5B] font-medium'
                    : 'text-[#A7ADB5] border-transparent hover:text-[#1F2328] hover:border-[#A7ADB5]/40'
                }`}
              >
                <tab.icon size={14} strokeWidth={1.5} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === STORY TAB === */}
      {activeTab === 'story' && (
        <section className="py-16 md:py-24 bg-[#F3F0E8]" data-testid="case-study-story">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-3 reveal">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-px bg-[#C6A15B]" />
                  <p className="text-xs uppercase tracking-[0.22em] text-[#C6A15B] font-inter">01</p>
                </div>
                <h2 className="text-2xl font-sora font-light text-[#1F2328] mb-2">{labels.storyLabel}</h2>
                <p className="text-xs font-inter text-[#A7ADB5] uppercase tracking-wider">{labels.storyAccent}</p>
              </div>
              <div className="lg:col-span-9 space-y-5 reveal reveal-delay-1">
                {project.story?.paragraphs?.map((para, i) => (
                  <p key={i} className="text-base font-inter font-light text-[#1F2328]/65 leading-relaxed">{t(para)}</p>
                ))}
                {project.story?.owner_quote && t(project.story.owner_quote) && (
                  <div className="mt-8 border-l-2 border-[#C6A15B] pl-5">
                    <p className="text-sm font-inter font-light text-[#1F2328]/60 leading-relaxed italic">
                      "{t(project.story.owner_quote)}"
                    </p>
                  </div>
                )}
                {/* Short description as fallback */}
                {(!project.story?.paragraphs || project.story.paragraphs.length === 0) && t(project.short_description) && (
                  <p className="text-base font-inter font-light text-[#1F2328]/65 leading-relaxed">{t(project.short_description)}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === DESIGN TAB === */}
      {activeTab === 'design' && (
        <section className="py-16 md:py-24 bg-white" data-testid="case-study-design">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-3 reveal">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-px bg-[#C6A15B]" />
                  <p className="text-xs uppercase tracking-[0.22em] text-[#C6A15B] font-inter">02</p>
                </div>
                <h2 className="text-2xl font-sora font-light text-[#1F2328] mb-2">{labels.designLabel}</h2>
                <div className="flex flex-wrap gap-1.5 mt-5">
                  {project.design?.tags?.map(tag => (
                    <span key={tag} className="text-xs font-inter px-2 py-0.5 bg-[#F3F0E8] text-[#1F2328]/55 border border-[#A7ADB5]/20">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-9 reveal reveal-delay-1">
                {project.design?.intent && t(project.design.intent) && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-4">Design Intent</p>
                    <p className="text-base font-inter font-light text-[#1F2328]/65 leading-relaxed italic">
                      "{t(project.design.intent)}"
                    </p>
                  </div>
                )}
                {project.gallery && project.gallery.length > 0 && (
                  <ImageGallery images={project.gallery} />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === DELIVERY TAB === */}
      {activeTab === 'delivery' && (
        <section className="py-16 md:py-24 bg-[#F3F0E8]" data-testid="case-study-delivery">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-3 reveal">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-px bg-[#C6A15B]" />
                  <p className="text-xs uppercase tracking-[0.22em] text-[#C6A15B] font-inter">03</p>
                </div>
                <h2 className="text-2xl font-sora font-light text-[#1F2328] mb-5">{labels.deliveryLabel}</h2>
                {project.delivery?.septa_standards && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter mb-3">Septa Standard Applied</p>
                    <ul className="space-y-2.5">
                      {project.delivery.septa_standards.map(s => (
                        <li key={s} className="flex items-start gap-2.5">
                          <Check size={12} className="text-[#0F5E5B] mt-0.5 flex-shrink-0" strokeWidth={2} />
                          <span className="text-xs font-inter text-[#1F2328]/65">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="lg:col-span-9 space-y-10 reveal reveal-delay-1">
                {project.delivery?.highlights && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-5">Delivery Highlights</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.delivery.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-white border border-[#1F2328]/8">
                          <div className="text-xl font-sora font-light text-[#1F2328]/10 leading-none flex-shrink-0">{String(i + 1).padStart(2, '0')}</div>
                          <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed mt-0.5">{t(h)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-6">
                  {t(project.challenge) && (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-px bg-[#C6A15B]" />
                        <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter">The Challenge</p>
                      </div>
                      <p className="text-sm font-inter font-medium text-[#1F2328] mb-2">{t(project.challenge)}</p>
                      <p className="text-sm font-inter font-light text-[#1F2328]/60 leading-relaxed">{t(project.challenge_detail)}</p>
                    </div>
                  )}
                  {t(project.approach_detail) && (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-px bg-[#0F5E5B]" />
                        <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter">Our Approach</p>
                      </div>
                      <p className="text-sm font-inter font-light text-[#1F2328]/60 leading-relaxed">{t(project.approach_detail)}</p>
                    </div>
                  )}
                  {t(project.outcome_detail) && (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-px bg-[#1F2328]/25" />
                        <p className="text-xs uppercase tracking-widest text-[#1F2328]/45 font-inter">Outcome</p>
                      </div>
                      <p className="text-sm font-inter font-light text-[#1F2328]/60 leading-relaxed">{t(project.outcome_detail)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === MEDIA TAB === */}
      {activeTab === 'media' && hasMedia && (
        <section className="py-16 md:py-24 bg-white" data-testid="case-study-media">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 space-y-16">
            {/* 3D Model */}
            {project.media?.model_3d && (
              <div className="reveal">
                <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter mb-4">3D Walkthrough</p>
                <Model3DViewer
                  modelUrl={project.media.model_3d}
                  fallbackVideoUrl={project.media?.hero_video}
                  posterImage={project.image}
                />
              </div>
            )}

            {/* Gallery */}
            {((project.media?.images?.length > 0) || (project.gallery?.length > 0)) && (
              <div className="reveal">
                <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter mb-4">Project Gallery</p>
                <ImageGallery images={project.media?.images?.length > 0 ? project.media.images : project.gallery} />
              </div>
            )}

            {/* Plan Drawings */}
            {project.media?.plans?.length > 0 && (
              <div className="reveal">
                <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter mb-4">Plan Drawings</p>
                <PlanDrawings
                  plans={project.media.plans}
                  plansPublic={project.media?.plans_public || false}
                  projectTitle={projectTitle}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* === PARTNERS TAB === */}
      {activeTab === 'partners' && (
        <section className="py-12 bg-[#1F2328]" data-testid="partner-stack-section">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-3">
                <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-1">Partner Stack</p>
                <p className="text-sm font-inter font-light text-[#F3F0E8]/40 leading-relaxed">
                  The specialist network behind this project.
                </p>
              </div>
              <div className="md:col-span-9">
                <div className="flex items-start gap-4 py-3.5 border-b border-[#F3F0E8]/10">
                  <span className="text-xs font-inter text-[#A7ADB5] w-28 flex-shrink-0 uppercase tracking-wider pt-0.5">Delivered by</span>
                  <div>
                    <span className="text-sm font-inter font-medium text-[#F3F0E8]">Septa Group</span>
                    <span className="ml-2 text-xs font-inter text-[#0F5E5B] uppercase tracking-wider">Construction Delivery</span>
                  </div>
                </div>
                {project.partner_stack?.map(ps => {
                  const partner = getPartner(ps.partner_id);
                  return (
                    <div key={ps.partner_id} className="flex items-start gap-4 py-3.5 border-b border-[#F3F0E8]/10"
                      data-testid={`stack-row-${ps.partner_id}`}>
                      <span className="text-xs font-inter text-[#A7ADB5] w-28 flex-shrink-0 uppercase tracking-wider pt-0.5">
                        {ps.role_label}
                      </span>
                      <div className="flex-1">
                        {partner ? (
                          <Link to={`/ecosystem/${partner.slug}`}
                            className="text-sm font-inter font-medium text-[#F3F0E8] hover:text-[#C6A15B] transition-colors inline-flex items-center gap-1.5">
                            {t(partner.name)}
                            <ArrowRight size={11} strokeWidth={1.5} />
                          </Link>
                        ) : (
                          <span className="text-sm font-inter font-medium text-[#F3F0E8]">{ps.partner_id}</span>
                        )}
                        <p className="text-xs font-inter font-light text-[#F3F0E8]/45 mt-0.5 leading-relaxed">{t(ps.contribution)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="py-14 md:py-20 bg-[#F3F0E8]" data-testid="related-projects">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3 reveal">Related Work</p>
            <h2 className="text-2xl font-sora font-light text-[#1F2328] tracking-tight mb-10 reveal reveal-delay-1">
              Similar Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedProjects.map((rp, i) => (
                <Link key={rp.slug} to={`/projects/${rp.slug}`} data-testid={`related-project-${rp.slug}`}
                  className={`group block reveal reveal-delay-${i + 1}`}>
                  <div className="aspect-[4/3] overflow-hidden bg-[#E8E6E0] mb-4">
                    <img src={rp.image} alt={t(rp.title)} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-sora font-medium text-[#1F2328]">{t(rp.title)}</h3>
                    <span className={`text-xs font-inter px-1.5 py-0.5 ${typeColors[rp.type] || ''}`}>{rp.type}</span>
                  </div>
                  <p className="text-xs font-inter text-[#A7ADB5]">{rp.location} · {rp.sqft} sqft</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-[#1F2328]" data-testid="case-study-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Build Something Similar</p>
              <h2 className="text-2xl md:text-3xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight">
                If this project is relevant to what you are planning, let us walk you through our approach for your scope.
              </h2>
            </div>
            <div className="md:col-span-5 flex flex-wrap gap-4">
              <Link to="/contact" data-testid="case-study-enquiry-btn"
                className="h-12 px-8 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors flex items-center gap-2">
                Start an Enquiry <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
              <Link to="/ecosystem" data-testid="case-study-ecosystem-btn"
                className="h-12 px-8 border border-[#F3F0E8]/20 text-[#F3F0E8] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#F3F0E8] hover:text-[#1F2328] transition-all flex items-center gap-2">
                View Ecosystem
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

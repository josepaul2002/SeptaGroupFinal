import { useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { usePartner, useProjects, getText } from '../hooks/useApi';
import PreviewBanner from '../components/PreviewBanner';

const RELATIONSHIP_STYLES = {
  'Core Partner': 'bg-[#E8F0EF] text-[#0F5E5B]',
  'Project Partner': 'bg-[#F0EBE5] text-[#7A4E2D]',
  'Preferred Vendor': 'bg-[#F0F0EA] text-[#5C5C35]',
  'Technology Partner': 'bg-[#EEF0F7] text-[#3B4A8A]',
  'Group Company': 'bg-[#1F2328]/10 text-[#1F2328]',
};

const typeColors = {
  Institutional: 'bg-[#E8F0EF] text-[#0F5E5B]',
  Healthcare: 'bg-[#EEF0F7] text-[#3B4A8A]',
  Commercial: 'bg-[#F0EBE5] text-[#7A4E2D]',
  Residential: 'bg-[#EFF0E8] text-[#4A5C1F]',
  'Mixed-use': 'bg-[#F0EAF4] text-[#6A3A7A]',
};

export default function PartnerProfilePage() {
  useScrollReveal();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const { partner, loading: partnerLoading } = usePartner(slug, isPreview);
  const { data: projects, loading: projectsLoading } = useProjects();

  const relatedProjects = projects.filter(p =>
    p.partner_stack && p.partner_stack.some(ps => ps.partner_id === slug)
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    if (partner) {
      document.title = `${getText(partner.name)} — Septa Ecosystem`;
    }
  }, [partner]);

  if (partnerLoading || projectsLoading) {
    return (
      <div className="pt-16 min-h-screen bg-[#F3F0E8] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F5E5B]" size={32} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="pt-16 min-h-screen bg-[#F3F0E8] flex items-center justify-center" data-testid="partner-not-found">
        <div className="text-center">
          <p className="text-3xl font-sora font-light text-[#1F2328] mb-3">Partner Not Found</p>
          <Link to="/ecosystem" className="text-sm font-inter text-[#0F5E5B] hover:underline flex items-center gap-2 justify-center">
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to Ecosystem
          </Link>
        </div>
      </div>
    );
  }

  const partnerName = getText(partner.name);
  const bioLong = getText(partner.bio_long);
  const septaCollab = getText(partner.septa_collaboration);

  return (
    <div className="pt-16" data-testid="partner-profile-page">
      {/* Back */}
      <div className="bg-[#F3F0E8] border-b border-[#A7ADB5]/20 py-4">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <Link
            to="/ecosystem"
            data-testid="back-to-ecosystem-btn"
            className="inline-flex items-center gap-2 text-xs font-inter text-[#A7ADB5] hover:text-[#0F5E5B] transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={13} strokeWidth={1.5} /> Ecosystem
          </Link>
        </div>
      </div>

      {/* Cover image hero */}
      {partner.cover_image && (
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden bg-[#E8E6E0]">
          <img
            src={partner.cover_image}
            alt={partnerName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#1F2328]/45" />
        </div>
      )}

      {/* Profile header */}
      <section className="py-14 md:py-20 bg-[#F3F0E8]" data-testid="partner-header">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3 reveal">
                {partner.category}
              </p>
              <h1 className="text-3xl md:text-5xl font-sora font-light text-[#1F2328] tracking-tight leading-tight mb-4 reveal reveal-delay-1">
                {partnerName}
                {partner.relationship_type === 'Group Company' && (
                  <span className="ml-3 text-lg font-inter font-light text-[#C6A15B]">Group Company</span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-6 reveal reveal-delay-2">
                <span className={`text-xs font-inter px-2.5 py-1 ${RELATIONSHIP_STYLES[partner.relationship_type]}`}>
                  {partner.relationship_type}
                </span>
                {partner.districts?.map(d => (
                  <span key={d} className="flex items-center gap-1 text-xs font-inter text-[#A7ADB5]">
                    <MapPin size={10} strokeWidth={1.5} />{d}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 reveal reveal-delay-2">
                {partner.specialties?.map(s => (
                  <span key={s} className="text-xs font-inter px-2.5 py-1 bg-white border border-[#A7ADB5]/25 text-[#1F2328]/65">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 reveal reveal-delay-3">
              {(partner.website || partner.instagram || partner.email) && (
                <div className="bg-white border border-[#A7ADB5]/20 p-6 space-y-3">
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-4">Contact</p>
                  {partner.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink size={12} className="text-[#C6A15B]" strokeWidth={1.5} />
                      <span className="text-xs font-inter text-[#1F2328]/60">{partner.website}</span>
                    </div>
                  )}
                  {partner.instagram && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#C6A15B] font-inter">IG</span>
                      <span className="text-xs font-inter text-[#1F2328]/60">{partner.instagram}</span>
                    </div>
                  )}
                  {partner.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#C6A15B] font-inter">@</span>
                      <span className="text-xs font-inter text-[#1F2328]/60">{partner.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bio + Known For + Collaboration */}
      <section className="py-14 md:py-20 bg-white" data-testid="partner-bio">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7 space-y-6 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-1">About</p>
              {bioLong.split('\n\n').map((para, i) => (
                <p key={i} className="text-base font-inter font-light text-[#1F2328]/65 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
            <div className="lg:col-span-5 space-y-8">
              {partner.known_for && partner.known_for.length > 0 && (
                <div className="reveal reveal-delay-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#0F5E5B] font-inter mb-5">What they're known for</p>
                  <ul className="space-y-4" data-testid="partner-known-for">
                    {partner.known_for.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check size={13} className="text-[#0F5E5B] mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span className="text-sm font-inter text-[#1F2328]/70 leading-relaxed">{getText(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {septaCollab && (
                <div className="border-t border-[#A7ADB5]/20 pt-7 reveal reveal-delay-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-4">How we collaborate</p>
                  <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed italic">
                    "{septaCollab}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="py-14 md:py-20 bg-[#F3F0E8]" data-testid="partner-related-projects">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className="mb-10 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Joint Work</p>
              <h2 className="text-2xl md:text-3xl font-sora font-light text-[#1F2328] tracking-tight leading-tight">
                Projects delivered with Septa
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedProjects.map((project, i) => {
                const myRole = project.partner_stack.find(ps => ps.partner_id === slug);
                return (
                  <Link
                    key={project.slug}
                    to={`/projects/${project.slug}`}
                    data-testid={`related-project-${project.slug}`}
                    className={`group block bg-white border border-[#1F2328]/8 hover:border-[#C6A15B]/50 transition-colors duration-300 reveal reveal-delay-${Math.min(i + 1, 3)}`}
                  >
                    <div className="h-44 overflow-hidden bg-[#E8E6E0]">
                      <img
                        src={project.image}
                        alt={getText(project.title)}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-sm font-sora font-medium text-[#1F2328] leading-snug">{getText(project.title)}</h3>
                        <span className={`text-xs font-inter px-1.5 py-0.5 flex-shrink-0 ${typeColors[project.type] || ''}`}>
                          {project.type}
                        </span>
                      </div>
                      <p className="text-xs font-inter text-[#A7ADB5] mb-2">{project.location}</p>
                      {myRole && (
                        <div className="flex items-start gap-2 mt-2">
                          <div className="w-1 h-1 bg-[#C6A15B] mt-1.5 flex-shrink-0" />
                          <p className="text-xs font-inter text-[#1F2328]/55">
                            <span className="text-[#0F5E5B] font-medium">{myRole.role_label}: </span>
                            {getText(myRole.contribution)}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="text-xs font-inter font-medium text-[#0F5E5B] uppercase tracking-wider group-hover:text-[#C6A15B] transition-colors">View case study</span>
                        <ArrowRight size={11} className="text-[#0F5E5B] group-hover:text-[#C6A15B] transition-colors" strokeWidth={1.5} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Request Introduction CTA */}
      <section className="py-14 md:py-16 bg-[#0F5E5B]" data-testid="partner-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-2xl font-sora font-light text-white tracking-tight">
              Interested in working with {partnerName}?
            </p>
            <p className="text-sm font-inter text-white/55 mt-1">
              Request an introduction via Septa — we will facilitate based on your project requirements.
            </p>
          </div>
          <Link
            to={`/contact?partner=${encodeURIComponent(partnerName)}`}
            data-testid="partner-introduction-btn"
            className="flex-shrink-0 h-12 px-8 bg-white text-[#0F5E5B] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#F3F0E8] transition-colors flex items-center gap-2"
          >
            Request Introduction <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}

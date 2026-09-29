import ResponsiveImage from '../components/ResponsiveImage';
import PartnerMediaShowcase from '../components/PartnerMediaShowcase';
import {profileIdentity} from '../lib/profiles';
import ContentError from '../components/ContentError';
import { useEffect } from 'react';
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, Facebook, Instagram, Mail, Phone, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { usePartner,useApiData,getText } from '../hooks/useApi';
import { useLanguage } from '../components/LanguageToggle';
import PreviewBanner from '../components/PreviewBanner';



const relationshipLabels = {
  'Group Company': { color: 'bg-[#050505] text-white', desc: 'Part of the Septa Group family' },
  'Core Partner': { color: 'bg-[#8A8A8A] text-white', desc: 'Long-term collaboration across multiple projects' },
  'Project Partner': { color: 'bg-[#ECECEA] text-[#606060]', desc: 'Engaged for specific project requirements' },
  'Preferred Vendor': { color: 'bg-[#F6F6F3] text-[#050505]', desc: 'Trusted supplier in our material network' },
};

export default function PartnerProfilePage() {
  useScrollReveal();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const location=useLocation();
  const isPreview = searchParams.get('preview') === 'true';
  const {partner,loading,error,statusCode,retry}=usePartner(slug,isPreview);
  const {data:partnerProjects,error:projectsError,retry:retryProjects}=useApiData(`/credits/partner/${slug}/projects`,[]);
  const {t}=useLanguage();
  useEffect(()=>{window.scrollTo(0,0);},[slug]);
  if(error&&!partner)return <ContentError label="Partner" notFound={statusCode===404} retry={retry} back="/ecosystem"/>;
  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-[#F6F6F3] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#606060]" size={32} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="pt-16 min-h-screen bg-[#F6F6F3] flex items-center justify-center" data-testid="partner-not-found">
        <div className="text-center">
          <p className="text-3xl font-sora font-light text-[#050505] mb-3">Partner Not Found</p>
          <Link to="/ecosystem" className="text-sm font-inter text-[#606060] hover:underline flex items-center gap-2 justify-center">
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to Ecosystem
          </Link>
        </div>
      </div>
    );
  }

  const media = partner.media && typeof partner.media === 'object' ? partner.media : {};
  const highlights = Array.isArray(partner.highlights) ? partner.highlights.filter(item=>item?.visible!==false&&item?.value&&item?.label) : [];
  const specialties = Array.isArray(partner.specialties) ? partner.specialties : [];
  const sharedProjects = Array.isArray(partnerProjects) ? partnerProjects : [];
  const heroImage = media.hero_image || media.card_image || partner.cover_image;
  const logoImage = profileIdentity(partner);
  const relInfo = relationshipLabels[partner.relationship_type] || relationshipLabels['Project Partner'];
  const showPreview = isPreview || partner._preview_mode;
  const backToEcosystem=typeof location.state?.from==='string'&&/^\/ecosystem(?:\?|$)/.test(location.state.from)?location.state.from:'/ecosystem';

  return (
    <div className={`partner-profile-page ${showPreview ? 'pt-28' : 'pt-16'}`} data-testid="partner-profile-page">
      {showPreview && <PreviewBanner type="partner" slug={slug} />}

      {/* Back nav */}
      <div className="bg-[#F6F6F3] border-b border-[#8A8A8A]/20 py-4">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <Link to={showPreview ? '/admin' : backToEcosystem} data-testid="back-to-ecosystem-btn"
            className="inline-flex items-center gap-2 text-xs font-inter text-[#8A8A8A] hover:text-[#606060] transition-colors uppercase tracking-widest">
            <ArrowLeft size={13} strokeWidth={1.5} /> {showPreview ? 'Back to Admin' : 'Ecosystem'}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="partner-profile-hero relative h-[35vh] md:h-[50vh] overflow-hidden bg-[#050505]">
        {heroImage ? (
          <ResponsiveImage src={heroImage} alt={t(partner.name)} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#606060]/30 to-[#050505]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
          <div className="partner-identity-row max-w-[1400px] mx-auto flex items-center gap-6">
            {logoImage && (
              <div className="partner-identity-image w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                <ResponsiveImage src={logoImage} alt="" className={`w-full h-full ${partner.profile_type==='person'?'object-cover':'object-contain'}`} />
              </div>
            )}
            <div>
              <span className={`inline-block text-xs font-inter uppercase tracking-wider px-2.5 py-1 mb-3 ${relInfo.color}`}>
                {partner.relationship_type}
              </span>
              <h1 className="text-3xl md:text-5xl font-sora font-light text-white tracking-tight" data-testid="partner-name">
                {t(partner.name)}
              </h1>
              <p className="text-sm font-inter text-[#8A8A8A] mt-1">{t(partner.professional_role)||partner.category}{partner.firm&&` · ${partner.firm}`}</p>
            </div>
            {media.show_logo && media.logo_image && logoImage !== media.logo_image && <ResponsiveImage className="partner-company-mark" src={media.logo_image} alt={`${partner.firm || t(partner.name)} logo`}/>}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-12 md:py-20 bg-[#F6F6F3]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="partner-profile-content grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main content */}
            <div className="lg:col-span-8 space-y-12">
              {/* Bio */}
              {t(partner.bio_short) && (
                <div className="reveal" data-testid="partner-short-bio">
                  <p className="text-lg font-inter font-light text-[#050505]/75 leading-relaxed">
                    {t(partner.bio_short)}
                  </p>
                </div>
              )}
              {t(partner.bio_long) && (
                <div className="reveal reveal-delay-1" data-testid="partner-full-bio">
                  <div className="prose prose-sm max-w-none text-[#050505]/60 font-inter font-light leading-relaxed whitespace-pre-line">
                    {t(partner.bio_long)}
                  </div>
                </div>
              )}

              <PartnerMediaShowcase media={media} name={t(partner.name)}/>

              {projectsError&&<p role="alert" className="text-sm">Related projects could not load. <button onClick={retryProjects} className="underline">Try again</button></p>}{/* Septa collaboration */}
              {t(partner.septa_collaboration) && (
                <div className="reveal p-6 bg-white border border-[#8A8A8A]/20" data-testid="partner-collaboration">
                  <p className="text-xs uppercase tracking-widest text-[#606060] font-inter mb-3">Collaboration with Septa</p>
                  <p className="text-sm font-inter font-light text-[#050505]/65 leading-relaxed">
                    {t(partner.septa_collaboration)}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="partner-profile-sidebar lg:col-span-4 space-y-6">
              {/* Relationship */}
              <div className="p-5 bg-white border border-[#8A8A8A]/20 reveal" data-testid="partner-info-card">
                <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-3">Relationship</p>
                <span className={`inline-block text-xs font-inter font-medium px-2.5 py-1 ${relInfo.color}`}>
                  {partner.relationship_type}
                </span>
                <p className="text-xs font-inter text-[#050505]/50 mt-2">{relInfo.desc}</p>
              </div>

              {highlights.length>0&&<div className="partner-highlight-grid">{highlights.map((item,i)=><div key={i} className="partner-highlight"><strong>{item.value}</strong><span>{item.label}</span></div>)}</div>}

              {/* Specialties */}
              {specialties.length > 0 && (
                <div className="p-5 bg-white border border-[#8A8A8A]/20 reveal" data-testid="partner-specialties">
                  <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-3">Specialties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {specialties.map(s => (
                      <span key={s} className="text-xs font-inter px-2 py-0.5 bg-[#F6F6F3] text-[#050505]/60 border border-[#8A8A8A]/15">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="p-5 bg-white border border-[#8A8A8A]/20 space-y-3 reveal" data-testid="partner-links">
                <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-inter mb-2">Links</p>
                {(partner.website_url || partner.website) && (
                  <a href={partner.website_url || partner.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-inter text-[#606060] hover:text-[#8A8A8A] transition-colors">
                    <Globe size={14} strokeWidth={1.5} /> Website
                  </a>
                )}
                {partner.facebook_url && <a href={partner.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline"><Facebook size={16} />Facebook</a>}
                {(partner.instagram_url || partner.instagram) && (
                  <a href={partner.instagram_url || partner.instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-inter text-[#606060] hover:text-[#8A8A8A] transition-colors">
                    <Instagram size={14} strokeWidth={1.5} /> Instagram
                  </a>
                )}
                {partner.contact_email && (
                  <a href={`mailto:${partner.contact_email}`}
                    className="flex items-center gap-2 text-sm font-inter text-[#606060] hover:text-[#8A8A8A] transition-colors">
                    <Mail size={14} strokeWidth={1.5} /> {partner.contact_email}
                  </a>
                )}
                {partner.contact_phone && (
                  <a href={`tel:${partner.contact_phone}`}
                    className="flex items-center gap-2 text-sm font-inter text-[#606060] hover:text-[#8A8A8A] transition-colors">
                    <Phone size={14} strokeWidth={1.5} /> {partner.contact_phone}
                  </a>
                )}
              </div>

              {/* CTA */}
              <Link to={`/contact?partner=${partner.slug}`} data-testid="partner-intro-cta"
                className="block w-full h-12 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#262626] transition-colors flex items-center justify-center gap-2">
                Request an Introduction <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Projects */}
      {sharedProjects.length > 0 && (
        <section className="py-12 md:py-16 bg-white" data-testid="partner-projects">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3">Delivered Together</p>
            <h2 className="text-2xl font-sora font-light text-[#050505] mb-8">
              Projects with {t(partner.name)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sharedProjects.map((proj, i) => (
                <Link key={proj.slug} to={`/projects/${proj.slug}`}
                  className="group block" data-testid={`partner-project-${proj.slug}`}>
                  <div className="aspect-[4/3] overflow-hidden bg-[#ECECEA] mb-3">
                    {proj.image && (
                      <ResponsiveImage src={proj.image} alt={getText(proj.title)} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <h3 className="text-sm font-sora font-medium text-[#050505] group-hover:text-[#606060] transition-colors">
                    {getText(proj.title)}
                  </h3>
                  <p className="text-xs font-inter text-[#8A8A8A] mt-0.5">{proj.type} · {proj.location}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

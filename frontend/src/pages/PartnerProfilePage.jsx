import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, Instagram, Mail, Phone, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getText } from '../hooks/useApi';
import { useLanguage } from '../components/LanguageToggle';
import PreviewBanner from '../components/PreviewBanner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const relationshipLabels = {
  'Group Company': { color: 'bg-[#0F5E5B] text-white', desc: 'Part of the Septa Group family' },
  'Core Partner': { color: 'bg-[#C6A15B] text-white', desc: 'Long-term collaboration across multiple projects' },
  'Project Partner': { color: 'bg-[#E8F0EF] text-[#0F5E5B]', desc: 'Engaged for specific project requirements' },
  'Preferred Vendor': { color: 'bg-[#F3F0E8] text-[#1F2328]', desc: 'Trusted supplier in our material network' },
};

export default function PartnerProfilePage() {
  useScrollReveal();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [partnerProjects, setPartnerProjects] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    axios.get(`${API}/partners/${slug}${isPreview ? '?preview=true' : ''}`)
      .then(res => {
        setPartner(res.data);
        document.title = `${getText(res.data.name)} — Septa Ecosystem`;
        return axios.get(`${API}/partners/${slug}/projects`);
      })
      .then(res => setPartnerProjects(res.data || []))
      .catch(() => setPartner(null))
      .finally(() => setLoading(false));
  }, [slug, isPreview]);

  if (loading) {
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

  const media = partner.media || {};
  const heroImage = media.hero_image || media.card_image || partner.cover_image;
  const logoImage = media.logo_image || partner.logo_url;
  const gallery = media.gallery_images || [];
  const relInfo = relationshipLabels[partner.relationship_type] || relationshipLabels['Project Partner'];
  const showPreview = isPreview || partner._preview_mode;

  return (
    <div className={showPreview ? 'pt-28' : 'pt-16'} data-testid="partner-profile-page">
      {showPreview && <PreviewBanner type="partner" slug={slug} />}

      {/* Back nav */}
      <div className="bg-[#F3F0E8] border-b border-[#A7ADB5]/20 py-4">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <Link to={showPreview ? '/admin' : '/ecosystem'} data-testid="back-to-ecosystem-btn"
            className="inline-flex items-center gap-2 text-xs font-inter text-[#A7ADB5] hover:text-[#0F5E5B] transition-colors uppercase tracking-widest">
            <ArrowLeft size={13} strokeWidth={1.5} /> {showPreview ? 'Back to Admin' : 'Ecosystem'}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[35vh] md:h-[50vh] overflow-hidden bg-[#1F2328]">
        {heroImage ? (
          <img src={heroImage} alt={t(partner.name)} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0F5E5B]/30 to-[#1F2328]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F2328] via-[#1F2328]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
          <div className="max-w-[1400px] mx-auto flex items-end gap-6">
            {logoImage && (
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white p-2 flex-shrink-0">
                <img src={logoImage} alt="" className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <span className={`inline-block text-xs font-inter uppercase tracking-wider px-2.5 py-1 mb-3 ${relInfo.color}`}>
                {partner.relationship_type}
              </span>
              <h1 className="text-3xl md:text-5xl font-sora font-light text-white tracking-tight" data-testid="partner-name">
                {t(partner.name)}
              </h1>
              <p className="text-sm font-inter text-[#C6A15B] mt-1">{partner.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-12 md:py-20 bg-[#F3F0E8]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main content */}
            <div className="lg:col-span-8 space-y-12">
              {/* Bio */}
              {t(partner.bio_short) && (
                <div className="reveal" data-testid="partner-short-bio">
                  <p className="text-lg font-inter font-light text-[#1F2328]/75 leading-relaxed">
                    {t(partner.bio_short)}
                  </p>
                </div>
              )}
              {t(partner.bio_long) && (
                <div className="reveal reveal-delay-1" data-testid="partner-full-bio">
                  <div className="prose prose-sm max-w-none text-[#1F2328]/60 font-inter font-light leading-relaxed whitespace-pre-line">
                    {t(partner.bio_long)}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {gallery.length > 0 && (
                <div className="reveal" data-testid="partner-gallery">
                  <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter mb-4">Gallery</p>
                  <div className="relative aspect-[16/9] bg-[#E8E6E0] overflow-hidden">
                    <img src={gallery[galleryIdx]} alt={`Gallery ${galleryIdx + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-300" />
                    {gallery.length > 1 && (
                      <>
                        <button onClick={() => setGalleryIdx((galleryIdx - 1 + gallery.length) % gallery.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                          data-testid="gallery-prev">
                          <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setGalleryIdx((galleryIdx + 1) % gallery.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                          data-testid="gallery-next">
                          <ChevronRight size={16} />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {gallery.map((_, i) => (
                            <button key={i} onClick={() => setGalleryIdx(i)}
                              className={`w-2 h-2 transition-colors ${i === galleryIdx ? 'bg-white' : 'bg-white/40'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Septa collaboration */}
              {t(partner.septa_collaboration) && (
                <div className="reveal p-6 bg-white border border-[#A7ADB5]/20" data-testid="partner-collaboration">
                  <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter mb-3">Collaboration with Septa</p>
                  <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed">
                    {t(partner.septa_collaboration)}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Relationship */}
              <div className="p-5 bg-white border border-[#A7ADB5]/20 reveal" data-testid="partner-info-card">
                <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-3">Relationship</p>
                <span className={`inline-block text-xs font-inter font-medium px-2.5 py-1 ${relInfo.color}`}>
                  {partner.relationship_type}
                </span>
                <p className="text-xs font-inter text-[#1F2328]/50 mt-2">{relInfo.desc}</p>
              </div>

              {/* Specialties */}
              {partner.specialties?.length > 0 && (
                <div className="p-5 bg-white border border-[#A7ADB5]/20 reveal" data-testid="partner-specialties">
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-3">Specialties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {partner.specialties.map(s => (
                      <span key={s} className="text-xs font-inter px-2 py-0.5 bg-[#F3F0E8] text-[#1F2328]/60 border border-[#A7ADB5]/15">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="p-5 bg-white border border-[#A7ADB5]/20 space-y-3 reveal" data-testid="partner-links">
                <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-2">Links</p>
                {(partner.website_url || partner.website) && (
                  <a href={partner.website_url || partner.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-inter text-[#0F5E5B] hover:text-[#C6A15B] transition-colors">
                    <Globe size={14} strokeWidth={1.5} /> Website
                  </a>
                )}
                {(partner.instagram_url || partner.instagram) && (
                  <a href={partner.instagram_url || partner.instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-inter text-[#0F5E5B] hover:text-[#C6A15B] transition-colors">
                    <Instagram size={14} strokeWidth={1.5} /> Instagram
                  </a>
                )}
                {partner.contact_email && (
                  <a href={`mailto:${partner.contact_email}`}
                    className="flex items-center gap-2 text-sm font-inter text-[#0F5E5B] hover:text-[#C6A15B] transition-colors">
                    <Mail size={14} strokeWidth={1.5} /> {partner.contact_email}
                  </a>
                )}
                {partner.contact_phone && (
                  <a href={`tel:${partner.contact_phone}`}
                    className="flex items-center gap-2 text-sm font-inter text-[#0F5E5B] hover:text-[#C6A15B] transition-colors">
                    <Phone size={14} strokeWidth={1.5} /> {partner.contact_phone}
                  </a>
                )}
              </div>

              {/* CTA */}
              <Link to={`/contact?partner=${partner.slug}`} data-testid="partner-intro-cta"
                className="block w-full h-12 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors flex items-center justify-center gap-2">
                Request an Introduction <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Projects */}
      {partnerProjects.length > 0 && (
        <section className="py-12 md:py-16 bg-white" data-testid="partner-projects">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Delivered Together</p>
            <h2 className="text-2xl font-sora font-light text-[#1F2328] mb-8">
              Projects with {t(partner.name)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {partnerProjects.map((proj, i) => (
                <Link key={proj.slug} to={`/projects/${proj.slug}`}
                  className="group block" data-testid={`partner-project-${proj.slug}`}>
                  <div className="aspect-[4/3] overflow-hidden bg-[#E8E6E0] mb-3">
                    {proj.image && (
                      <img src={proj.image} alt={getText(proj.title)} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <h3 className="text-sm font-sora font-medium text-[#1F2328] group-hover:text-[#0F5E5B] transition-colors">
                    {getText(proj.title)}
                  </h3>
                  <p className="text-xs font-inter text-[#A7ADB5] mt-0.5">{proj.type} · {proj.location}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
  );
}

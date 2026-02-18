import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Info, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useLanguage } from '../components/LanguageToggle';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SolutionPacksPage() {
  useScrollReveal();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    document.title = 'Solution Packs — Septa Group';
    
    async function fetchPacks() {
      try {
        const res = await axios.get(`${API}/solution-packs`);
        setPacks(res.data);
      } catch (err) {
        console.error('Failed to fetch solution packs:', err);
      }
      setLoading(false);
    }
    
    fetchPacks();
  }, []);

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 md:py-28 bg-[#1F2328]" data-testid="solution-packs-hero">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <p className="text-xs uppercase tracking-[0.28em] text-[#C6A15B] font-inter mb-4 reveal">
                Coordinated Delivery
              </p>
              <h1 className="text-4xl md:text-6xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight mb-6 reveal reveal-delay-1">
                Solution Packs
              </h1>
              <p className="text-base md:text-lg font-inter font-light text-[#F3F0E8]/55 leading-relaxed reveal reveal-delay-2 max-w-xl">
                Pre-configured partner stacks for common project types. Instead of managing multiple specialists separately, Septa coordinates the right team for your build.
              </p>
            </div>
            <div className="lg:col-span-5 reveal reveal-delay-3">
              <div className="border border-[#C6A15B]/25 p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Info size={14} className="text-[#C6A15B] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <p className="text-xs font-inter font-medium text-[#C6A15B] uppercase tracking-wider">How it works</p>
                </div>
                <p className="text-sm font-inter font-light text-[#F3F0E8]/60 leading-relaxed">
                  Solution Packs are coordination frameworks. Each partner is engaged and contracted independently. Septa facilitates introductions and coordinates the delivery — we are accountable only for construction scope contracted with us.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packs Grid */}
      <section className="py-20 md:py-28 bg-[#F3F0E8]" data-testid="solution-packs-grid">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0F5E5B]" size={32} />
            </div>
          ) : packs.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[#A7ADB5] font-inter text-sm">No solution packs available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {packs.map((pack, i) => (
                <div
                  key={pack.slug}
                  className={`bg-white border border-[#1F2328]/8 hover:border-[#C6A15B]/50 transition-colors duration-300 reveal reveal-delay-${i + 1}`}
                  data-testid={`solution-pack-${pack.slug}`}
                >
                  {/* Header */}
                  <div className="p-8 border-b border-[#A7ADB5]/15">
                    <div className="w-8 h-px bg-[#C6A15B] mb-6" />
                    <h2 className="text-xl font-sora font-medium text-[#1F2328] mb-3 leading-snug">
                      {getText(pack.name)}
                    </h2>
                    <p className="text-sm font-inter font-light text-[#1F2328]/55 leading-relaxed">
                      {getText(pack.tagline)}
                    </p>
                  </div>

                  {/* Who it's for */}
                  <div className="p-8 border-b border-[#A7ADB5]/15">
                    <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-3">Who it's for</p>
                    <p className="text-sm font-inter text-[#1F2328]/65 leading-relaxed">
                      {getText(pack.who_its_for)}
                    </p>
                  </div>

                  {/* Partner Categories */}
                  <div className="p-8 border-b border-[#A7ADB5]/15">
                    <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter mb-4">What's included</p>
                    <div className="space-y-2.5">
                      {pack.partner_categories?.map((cat, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <Check size={13} className="text-[#0F5E5B] mt-0.5 flex-shrink-0" strokeWidth={2} />
                          <span className="text-sm font-inter text-[#1F2328]/65">{cat}</span>
                        </div>
                      ))}
                      <div className="flex items-start gap-2.5 pt-1">
                        <Check size={13} className="text-[#C6A15B] mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span className="text-sm font-inter text-[#1F2328] font-medium">Septa Construction Delivery</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="p-8 border-b border-[#A7ADB5]/15">
                    <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-2">Typical Timeline</p>
                    <p className="text-lg font-sora font-medium text-[#1F2328]">
                      {pack.typical_timeline}
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-8 bg-[#F8F7F4]">
                    <p className="text-xs font-inter text-[#A7ADB5] leading-relaxed">
                      {getText(pack.disclaimers)}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="p-8">
                    <Link
                      to={`/contact?pack=${pack.slug}`}
                      data-testid={`pack-enquire-btn-${pack.slug}`}
                      className="w-full h-12 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors flex items-center justify-center gap-2"
                    >
                      Enquire About This Pack <ArrowRight size={14} strokeWidth={1.5} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Custom Pack CTA */}
      <section className="py-16 bg-white" data-testid="custom-pack-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <h2 className="text-2xl font-sora font-light text-[#1F2328] tracking-tight mb-3">
                Need a custom partner stack?
              </h2>
              <p className="text-sm font-inter text-[#1F2328]/55 leading-relaxed">
                Every project is different. If none of the Solution Packs fit your requirements exactly, we can help you assemble a custom team from our ecosystem.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <Link
                to="/contact?custom=true"
                data-testid="custom-pack-btn"
                className="h-12 px-8 border border-[#1F2328]/20 text-[#1F2328] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#1F2328] hover:text-[#F3F0E8] transition-all flex items-center gap-2"
              >
                Discuss Your Project <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Link */}
      <section className="py-16 bg-[#1F2328]" data-testid="ecosystem-link-section">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Explore the Network</p>
          <h2 className="text-2xl font-sora font-light text-[#F3F0E8] tracking-tight mb-6">
            Browse all partners in the Septa Ecosystem
          </h2>
          <Link
            to="/ecosystem"
            data-testid="view-ecosystem-btn"
            className="inline-flex items-center gap-2 h-12 px-8 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors"
          >
            View Ecosystem <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}

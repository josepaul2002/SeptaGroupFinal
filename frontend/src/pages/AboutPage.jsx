import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, BarChart2, CheckCircle, FileText, Search, Shield, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { usePageContent, getText } from '../hooks/useApi';
import { useLanguage } from '../components/LanguageToggle';

const iconMap = {
  'clipboard-list': ClipboardList, 'bar-chart-2': BarChart2, 'check-circle': CheckCircle,
  'file-text': FileText, 'search': Search, 'shield': Shield,
};

export default function AboutPage() {
  useScrollReveal();
  const { blocks, loading } = usePageContent('about');
  const { t } = useLanguage();

  useEffect(() => { window.scrollTo(0, 0); document.title = 'About — Septa Group'; }, []);

  const metrics = blocks.filter(b => b.block_type === 'metrics').sort((a, b) => a.order - b.order);
  const steps = blocks.filter(b => b.block_type === 'timeline_step').sort((a, b) => a.order - b.order);
  const proofs = blocks.filter(b => b.block_type === 'proof_callout').sort((a, b) => a.order - b.order);

  return (
    <div className="pt-16" data-testid="about-page">
      {/* Hero */}
      <section className="bg-[#F6F6F3] py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3">About Septa Group</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-sora font-light text-[#050505] tracking-tight leading-tight">
                Built with Clarity.<br />Delivered with Discipline.
              </h1>
              <p className="text-base md:text-lg font-inter font-light text-[#050505]/55 leading-relaxed max-w-xl mt-6">
                Since 2004, Septa Group has been delivering construction projects across Kerala with a focus on process, accountability, and quality that clients can verify — not just trust.
              </p>
            </div>
            <div className="lg:col-span-5 reveal reveal-delay-1">
              <div className="aspect-[4/5] bg-[#050505] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#606060]/20 to-[#050505]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-6xl font-sora font-light text-white/10">S</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#8A8A8A] font-inter mt-2">Est. 2004</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof Strip Metrics */}
      {metrics.length > 0 && (
        <section className="py-12 bg-[#050505]" data-testid="about-metrics">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className={`grid grid-cols-2 md:grid-cols-${Math.min(metrics.length, 4)} gap-8 md:gap-12`}>
              {metrics.map((m, i) => (
                <div key={m.id || i} className={`text-center reveal reveal-delay-${i + 1}`} data-testid={`metric-${m.metadata?.key || i}`}>
                  <p className="text-3xl md:text-4xl font-sora font-light text-[#8A8A8A]">{t(m.title)}</p>
                  <p className="text-xs md:text-sm font-inter text-[#F6F6F3]/60 mt-1 uppercase tracking-wider">{t(m.subtitle)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Septa Standard Timeline */}
      {steps.length > 0 && (
        <section className="py-16 md:py-24 bg-white" data-testid="about-septa-standard">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <div className="max-w-2xl mb-12 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3">The Septa Standard</p>
              <h2 className="text-3xl md:text-4xl font-sora font-light text-[#050505] tracking-tight leading-tight">
                A working protocol applied on every site, every week.
              </h2>
              <p className="text-base font-inter font-light text-[#050505]/55 leading-relaxed mt-4">
                Not aspirational copy — this is our operating system for construction delivery.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((step, i) => {
                const Icon = iconMap[step.icon] || CheckCircle;
                return (
                  <div key={step.id || i} className={`p-6 border border-[#8A8A8A]/15 hover:border-[#606060]/30 transition-colors reveal reveal-delay-${(i % 3) + 1}`}
                    data-testid={`step-${i}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-[#E8F0EF] flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-[#606060]" strokeWidth={1.5} />
                      </div>
                      <span className="text-xs font-inter text-[#8A8A8A] uppercase tracking-wider">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="text-sm font-sora font-medium text-[#050505] mb-2">{t(step.title)}</h3>
                    <p className="text-sm font-inter font-light text-[#050505]/55 leading-relaxed">{t(step.body)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Proof Callouts */}
      {proofs.length > 0 && (
        <section className="py-12 md:py-16 bg-[#F6F6F3]" data-testid="about-proofs">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-6 reveal">Proof Points</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {proofs.map((proof, i) => (
                <div key={proof.id || i} className={`p-6 bg-white border border-[#8A8A8A]/15 hover:border-[#8A8A8A]/40 transition-colors reveal reveal-delay-${i + 1}`}
                  data-testid={`proof-${i}`}>
                  <h3 className="text-sm font-sora font-medium text-[#050505] mb-2">{t(proof.title)}</h3>
                  <p className="text-sm font-inter font-light text-[#050505]/55 leading-relaxed mb-3">{t(proof.body)}</p>
                  {proof.link_url && (
                    <Link to={proof.link_url} className="inline-flex items-center gap-1.5 text-xs font-inter font-medium text-[#606060] hover:text-[#8A8A8A] transition-colors uppercase tracking-wider">
                      {proof.link_label || 'View project'} <ArrowRight size={12} strokeWidth={1.5} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Values */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-2xl mb-12 reveal">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3">Our Values</p>
            <h2 className="text-3xl md:text-4xl font-sora font-light text-[#050505] tracking-tight">What we stand for</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Transparency', body: 'Weekly reporting, documented change orders, and open-book accounting. Clients see everything.' },
              { title: 'Accountability', body: 'Named project leads, structured handoffs, and a quality system that doesn\'t depend on who\'s on site.' },
              { title: 'Craftsmanship', body: 'Material selection, finish quality, and attention to detail that makes the difference between building and building well.' },
            ].map((val, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1}`} data-testid={`value-${i}`}>
                <h3 className="text-lg font-sora font-medium text-[#050505] mb-3">{val.title}</h3>
                <p className="text-sm font-inter font-light text-[#050505]/55 leading-relaxed">{val.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#050505]" data-testid="about-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] font-inter mb-3">Work With Us</p>
          <h2 className="text-2xl md:text-3xl font-sora font-light text-[#F6F6F3] tracking-tight mb-6">
            Ready to build something that matters?
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/projects" className="h-12 px-8 border border-[#F6F6F3]/20 text-[#F6F6F3] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#F6F6F3] hover:text-[#050505] transition-all flex items-center gap-2" data-testid="about-view-work-btn">
              View Our Work
            </Link>
            <Link to="/contact" className="h-12 px-8 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#262626] transition-colors flex items-center gap-2" data-testid="about-contact-btn">
              Start a Conversation <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

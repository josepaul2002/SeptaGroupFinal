import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const values = [
  {
    title: 'Responsibility Over Promises',
    desc: 'We do not make commitments we cannot track. Every delivery milestone is documented, and accountability is built into our weekly reporting — not left to verbal assurance.',
  },
  {
    title: 'Deserving Trust, Not Just Claiming It',
    desc: 'Trust in construction is earned through consistency, not marketing. We focus on doing what we say, showing what we have done, and letting clients compare us against the evidence.',
  },
  {
    title: 'Disciplined Management',
    desc: 'Site management at Septa is structured, not informal. From subcontractor coordination to material tracking, we operate with the discipline of an engineering firm — not a traditional contractor.',
  },
];

const differentiators = [
  {
    label: 'Architect Collaboration',
    point: 'We work alongside architects as partners, not contractors trying to reduce scope. Design intent is protected through construction.',
    proof: 'Multiple projects delivered with full architectural sign-off at handover — not just structural completion.',
  },
  {
    label: 'Long-term Workforce Continuity',
    point: 'Our site leadership and trade supervisors have worked with us for 8–15 years. Continuity in teams means consistency in quality.',
    proof: 'No project has seen mid-delivery leadership change due to workforce attrition — a common failure point with peers.',
  },
  {
    label: 'Documentation Discipline',
    point: 'We generate site records the way an auditable firm would. Weekly reports, checkpoint photographs, and decision logs are produced consistently.',
    proof: 'Clients who have built with other contractors consistently cite our documentation quality as the clearest differentiator.',
  },
];

const team = [
  { role: 'Managing Partner', years: '20+ years industry experience', domain: 'Business Development & Client Relations' },
  { role: 'Site Engineer Lead', years: '12 years on-site experience', domain: 'RCC, Waterproofing & Structural Quality' },
  { role: 'Quantity Surveyor', years: '10 years estimation & billing', domain: 'Cost Control & BOQ Management' },
  { role: 'Procurement Head', years: '15 years procurement', domain: 'Materials, Vendors & Supply Chain' },
];

export default function AboutPage() {
  useScrollReveal();

  useEffect(() => {
    document.title = 'About Septa Group — Legacy Construction, Modern Delivery';
  }, []);

  return (
    <div className="pt-16">
      {/* Page Hero */}
      <section className="py-20 md:py-28 bg-[#1F2328]" data-testid="about-hero">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#C6A15B] font-inter mb-4 reveal">
              About Us
            </p>
            <h1 className="text-4xl md:text-6xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight mb-6 reveal reveal-delay-1">
              Legacy Trust.<br />Modern Execution.
            </h1>
            <p className="text-base md:text-lg font-inter font-light text-[#F3F0E8]/55 leading-relaxed reveal reveal-delay-2">
              Septa Group has been building in Kerala for over two decades — from institutional campuses and healthcare facilities to premium residences. We have evolved from a traditional contractor into a delivery-focused build studio that operates with process, documentation, and long-term workforce continuity.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 md:py-28 bg-[#F3F0E8]" data-testid="about-story">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-5 reveal">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-4">Our Story</p>
              <h2 className="text-3xl md:text-4xl font-sora font-light text-[#1F2328] tracking-tight leading-tight">
                Two Decades of Building,<br />Delivered with Precision
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-5 reveal reveal-delay-1">
              <p className="text-base font-inter font-light text-[#1F2328]/65 leading-relaxed">
                Septa Group was established in Kerala with a simple conviction: that a construction company's most valuable asset is not equipment or capital — it is a consistent, trusted reputation built project by project.
              </p>
              <p className="text-base font-inter font-light text-[#1F2328]/65 leading-relaxed">
                Over twenty years, we have grown from residential builds to institutional and commercial projects, earning mandates from schools, hospitals, commercial developers, and boutique residential clients who value discipline over promises.
              </p>
              <p className="text-base font-inter font-light text-[#1F2328]/65 leading-relaxed">
                The Septa of today is a modern build delivery studio — one that combines the craft knowledge of a long-tenure site workforce with the process rigour of a managed services firm. Weekly reporting, quality checkpoints, and structured handover protocols are not marketing language; they are how we operate every day on every site.
              </p>
              <div className="pt-2">
                <div className="h-px bg-[#C6A15B]/40 mb-4" />
                <p className="text-sm font-inter font-medium text-[#1F2328] italic">
                  "Our word-of-mouth reputation is our most honest marketing. Every referral is a reflection of a project delivered well."
                </p>
                <p className="text-xs font-inter text-[#A7ADB5] mt-2">— Managing Partner, Septa Group</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 bg-white" data-testid="about-values">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="mb-14 reveal">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">What We Stand For</p>
            <h2 className="text-3xl md:text-4xl font-sora font-light text-[#1F2328] tracking-tight leading-tight">
              Our Values
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div
                key={v.title}
                className={`p-8 border border-[#1F2328]/8 hover:border-[#C6A15B]/50 transition-colors duration-300 reveal reveal-delay-${i + 1}`}
                data-testid={`value-card-${i}`}
              >
                <div className="w-6 h-px bg-[#C6A15B] mb-5" />
                <h3 className="text-lg font-sora font-medium text-[#1F2328] mb-3 leading-snug">{v.title}</h3>
                <p className="text-sm font-inter font-light text-[#1F2328]/60 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Different */}
      <section className="py-20 md:py-28 bg-[#F3F0E8]" data-testid="about-differentiators">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="mb-14 reveal">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Proof, Not Claims</p>
            <h2 className="text-3xl md:text-4xl font-sora font-light text-[#1F2328] tracking-tight leading-tight max-w-lg">
              Why Septa Delivers Differently
            </h2>
          </div>
          <div className="space-y-6">
            {differentiators.map((d, i) => (
              <div
                key={d.label}
                className={`grid grid-cols-1 md:grid-cols-12 gap-6 p-8 bg-white border border-[#1F2328]/8 reveal reveal-delay-${i + 1}`}
                data-testid={`differentiator-${i}`}
              >
                <div className="md:col-span-3">
                  <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter font-medium">{d.label}</p>
                </div>
                <div className="md:col-span-5">
                  <p className="text-sm font-inter text-[#1F2328]/75 leading-relaxed">{d.point}</p>
                </div>
                <div className="md:col-span-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-[#0F5E5B] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <p className="text-sm font-inter font-light text-[#A7ADB5] leading-relaxed italic">{d.proof}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 md:py-28 bg-white" data-testid="about-team">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="mb-14 reveal">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">The Team</p>
            <h2 className="text-3xl md:text-4xl font-sora font-light text-[#1F2328] tracking-tight leading-tight">
              Core Leadership
            </h2>
            <p className="text-sm font-inter text-[#A7ADB5] mt-3">
              [Team profiles and photos to be added — content placeholder]
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div
                key={member.role}
                className={`p-7 border border-[#1F2328]/8 reveal reveal-delay-${i + 1}`}
                data-testid={`team-card-${i}`}
              >
                <div className="w-14 h-14 bg-[#E8E6E0] mb-5 flex items-center justify-center">
                  <span className="text-xs font-inter text-[#A7ADB5] uppercase tracking-widest">Photo</span>
                </div>
                <p className="text-base font-sora font-medium text-[#1F2328] mb-1">{member.role}</p>
                <p className="text-xs font-inter text-[#0F5E5B] mb-1">{member.years}</p>
                <p className="text-xs font-inter text-[#A7ADB5] leading-relaxed">{member.domain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#0F5E5B]" data-testid="about-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-2xl font-sora font-light text-white tracking-tight">
            Considering a project? Let us walk you through how we work.
          </p>
          <Link
            to="/contact"
            data-testid="about-cta-btn"
            className="flex-shrink-0 h-12 px-8 bg-white text-[#0F5E5B] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#F3F0E8] transition-colors flex items-center gap-2"
          >
            Get in Touch <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}

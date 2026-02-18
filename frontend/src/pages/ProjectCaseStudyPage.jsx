import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Check, MapPin, Calendar, Maximize2, Building2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProjectCaseStudyPage() {
  useScrollReveal();
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get(`${API}/projects/${slug}`)
      .then(r => {
        setProject(r.data);
        document.title = `${r.data.title} — Septa Group`;
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-[#F3F0E8] flex items-center justify-center" data-testid="case-study-loading">
        <div className="space-y-3 w-80">
          <div className="h-8 bg-[#E8E6E0] animate-pulse" />
          <div className="h-4 bg-[#E8E6E0] animate-pulse w-3/4" />
          <div className="h-4 bg-[#E8E6E0] animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pt-16 min-h-screen bg-[#F3F0E8] flex items-center justify-center" data-testid="case-study-not-found">
        <div className="text-center">
          <p className="text-3xl font-sora font-light text-[#1F2328] mb-3">Project Not Found</p>
          <p className="text-sm font-inter text-[#A7ADB5] mb-6">This project case study is not available.</p>
          <Link to="/projects" className="text-sm font-inter text-[#0F5E5B] hover:underline flex items-center gap-2 justify-center">
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16" data-testid="case-study-page">
      {/* Back nav */}
      <div className="bg-[#F3F0E8] border-b border-[#A7ADB5]/20 py-4">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <Link
            to="/projects"
            data-testid="back-to-projects-btn"
            className="inline-flex items-center gap-2 text-xs font-inter text-[#A7ADB5] hover:text-[#0F5E5B] transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={13} strokeWidth={1.5} /> All Projects
          </Link>
        </div>
      </div>

      {/* Hero image */}
      <div className="relative h-[45vh] md:h-[55vh] overflow-hidden bg-[#E8E6E0]">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1F2328]/40" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-[1400px] mx-auto px-0 md:px-2">
            <span className="inline-block text-xs font-inter uppercase tracking-widest text-[#C6A15B] mb-3">{project.type}</span>
            <h1 className="text-3xl md:text-5xl font-sora font-light text-white tracking-tight leading-tight">
              {project.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Overview */}
      <section className="py-14 md:py-20 bg-white" data-testid="case-study-overview">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Meta */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-1">Location</p>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#C6A15B]" strokeWidth={1.5} />
                    <p className="text-sm font-inter font-medium text-[#1F2328]">{project.location}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-1">Area</p>
                  <div className="flex items-center gap-1.5">
                    <Maximize2 size={12} className="text-[#C6A15B]" strokeWidth={1.5} />
                    <p className="text-sm font-inter font-medium text-[#1F2328]">{project.sqft} sq.ft.</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-1">Duration</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-[#C6A15B]" strokeWidth={1.5} />
                    <p className="text-sm font-inter font-medium text-[#1F2328]">{project.duration}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-1">Client Type</p>
                  <div className="flex items-center gap-1.5">
                    <Building2 size={12} className="text-[#C6A15B]" strokeWidth={1.5} />
                    <p className="text-sm font-inter font-medium text-[#1F2328]">{project.client_type}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-1">Year</p>
                  <p className="text-sm font-inter font-medium text-[#1F2328]">{project.year}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-1">Status</p>
                  <span className={`text-xs font-inter px-2.5 py-1 ${project.status === 'Ongoing' ? 'bg-[#E8F0EF] text-[#0F5E5B]' : 'bg-[#EFF0E8] text-[#4A5C1F]'}`}>
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Septa Standards */}
              {project.septa_standards && project.septa_standards.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter mb-4">Septa Standard Applied</p>
                  <ul className="space-y-2.5" data-testid="septa-standards-list">
                    {project.septa_standards.map((s) => (
                      <li key={s} className="flex items-start gap-2.5">
                        <Check size={12} className="text-[#0F5E5B] mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span className="text-sm font-inter text-[#1F2328]/70">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Challenge / Approach / Outcome */}
            <div className="lg:col-span-8 space-y-10">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Overview</p>
                <p className="text-base font-inter font-light text-[#1F2328]/65 leading-relaxed">
                  {project.short_description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div data-testid="case-study-challenge">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-px bg-[#C6A15B]" />
                    <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter">The Challenge</p>
                  </div>
                  <h3 className="text-lg font-sora font-medium text-[#1F2328] mb-3 leading-snug">{project.challenge}</h3>
                  <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed">{project.challenge_detail}</p>
                </div>

                <div data-testid="case-study-approach">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-px bg-[#0F5E5B]" />
                    <p className="text-xs uppercase tracking-widest text-[#0F5E5B] font-inter">Our Approach</p>
                  </div>
                  <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed">{project.approach_detail}</p>
                </div>

                <div data-testid="case-study-outcome">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-px bg-[#1F2328]/30" />
                    <p className="text-xs uppercase tracking-widest text-[#1F2328]/50 font-inter">Outcome</p>
                  </div>
                  <p className="text-sm font-inter font-light text-[#1F2328]/65 leading-relaxed">{project.outcome_detail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="py-14 bg-[#F3F0E8]" data-testid="case-study-gallery">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-8">Gallery</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {project.gallery.slice(0, 3).map((img, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden bg-[#E8E6E0]">
                  <img
                    src={img}
                    alt={`${project.title} gallery ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#1F2328]" data-testid="case-study-cta">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-inter mb-3">Build Something Similar</p>
              <h2 className="text-2xl md:text-3xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight">
                If this project is relevant to what you are planning, let us have a focused conversation about your scope.
              </h2>
            </div>
            <div className="md:col-span-5 flex flex-wrap gap-4">
              <Link
                to="/contact"
                data-testid="case-study-enquiry-btn"
                className="h-12 px-8 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors flex items-center gap-2"
              >
                Start an Enquiry <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
              <Link
                to="/projects"
                data-testid="case-study-back-projects-btn"
                className="h-12 px-8 border border-[#F3F0E8]/20 text-[#F3F0E8] text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#F3F0E8] hover:text-[#1F2328] transition-all flex items-center gap-2"
              >
                View All Projects
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

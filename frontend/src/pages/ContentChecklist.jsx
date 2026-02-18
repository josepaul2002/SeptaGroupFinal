import { useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const checklist = [
  {
    category: 'Company Details',
    items: [
      { item: 'Real phone number (replace +91 XXXXX XXXXX)', done: false },
      { item: 'Real email address (replace info@septagroup.in)', done: false },
      { item: 'Real office address', done: false },
      { item: 'Exact establishment year (if different from 2004)', done: false },
      { item: 'Operating districts — confirm the list', done: false },
      { item: 'WhatsApp number (replace 919876543210 in WhatsAppButton.jsx)', done: false },
    ],
  },
  {
    category: 'Team & Leadership',
    items: [
      { item: 'Team member names (or confirm anonymous approach)', done: false },
      { item: 'Team photos (high quality, professional)', done: false },
      { item: 'Correct roles and titles', done: false },
      { item: 'Years of experience per team member', done: false },
    ],
  },
  {
    category: 'Projects',
    items: [
      { item: 'Replace placeholder project names with real project names', done: false },
      { item: 'Add real project photos (high-resolution, min 1600px wide)', done: false },
      { item: 'Confirm or update project locations, sqft, and duration', done: false },
      { item: 'Confirm project type and status (Completed/Ongoing)', done: false },
      { item: 'Update challenge/approach/outcome text per project', done: false },
      { item: 'Add gallery images per project (3 per project recommended)', done: false },
      { item: 'Add new projects via Admin panel (/admin)', done: false },
    ],
  },
  {
    category: 'Testimonials',
    items: [
      { item: 'Replace placeholder testimonials with real client quotes', done: false },
      { item: 'Confirm client names and roles', done: false },
      { item: 'Add/update via Admin panel (/admin)', done: false },
    ],
  },
  {
    category: 'SEO & Meta',
    items: [
      { item: 'Update site title and meta descriptions per page', done: false },
      { item: 'Add OpenGraph image (1200x630px, PNG/JPG)', done: false },
      { item: 'Add logo in SVG or PNG format', done: false },
      { item: 'Add favicon', done: false },
      { item: 'Register in Google Search Console', done: false },
    ],
  },
  {
    category: 'Branding & Design',
    items: [
      { item: 'Replace "SEPTA GROUP" text logo with actual logo file (if available)', done: false },
      { item: 'Confirm hero image (replace stock photo with actual project photo)', done: false },
      { item: 'Confirm brand color is correct (#0F5E5B for teal, #C6A15B for bronze)', done: false },
    ],
  },
  {
    category: 'Admin Panel',
    items: [
      { item: 'Change default admin password (septa2024) in backend/.env', done: false },
      { item: 'Test lead submissions from Contact form', done: false },
      { item: 'Test Admin login at /admin', done: false },
    ],
  },
];

export default function ContentChecklist() {
  useScrollReveal();

  useEffect(() => {
    document.title = 'Content Checklist — Septa Group';
  }, []);

  const total = checklist.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="pt-16 min-h-screen bg-[#F3F0E8]">
      <section className="py-16 md:py-24 bg-[#1F2328]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A15B] font-inter mb-3 reveal">Internal Reference</p>
          <h1 className="text-4xl md:text-5xl font-sora font-light text-[#F3F0E8] tracking-tight leading-tight mb-4 reveal reveal-delay-1">
            Content Checklist
          </h1>
          <p className="text-base font-inter font-light text-[#F3F0E8]/50 max-w-xl reveal reveal-delay-2">
            This page lists all content and assets that need to be replaced before the site goes live. {total} items total.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 space-y-10">
          {checklist.map((section, i) => (
            <div key={section.category} className="reveal" data-testid={`checklist-section-${i}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-px bg-[#C6A15B]" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#C6A15B] font-inter">{section.category}</p>
              </div>
              <div className="bg-white border border-[#A7ADB5]/20 divide-y divide-[#A7ADB5]/10">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-3 p-4 md:p-5" data-testid={`checklist-item-${i}-${j}`}>
                    {item.done
                      ? <CheckCircle2 size={16} className="text-[#0F5E5B] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      : <Circle size={16} className="text-[#A7ADB5] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    }
                    <p className="text-sm font-inter text-[#1F2328]/75 leading-relaxed">{item.item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

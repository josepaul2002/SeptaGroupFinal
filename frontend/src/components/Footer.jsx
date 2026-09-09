import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ArrowUpRight } from 'lucide-react';
import { useSiteSettings } from '../hooks/useApi';

const footerPages = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Services' },
  { to: '/projects', label: 'Projects' },
  { to: '/ecosystem', label: 'Ecosystem' },
  { to: '/contact', label: 'Contact' },
];

const footerServices = [
  'Institutional Buildings',
  'Healthcare Facilities',
  'Commercial Spaces',
  'Premium Residences',
  'Project Management',
];

export default function Footer() {
  const { settings } = useSiteSettings();
  const contact = settings?.contact || {};

  return (
    <footer className="bg-[#050505] text-[#F6F6F3]" data-testid="footer">
      <div className="h-px bg-[#8A8A8A]/40" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <img src="/septa-logo.png" alt="Septa Group" className="h-10 w-auto" />
              <span className="flex items-baseline gap-2 font-display uppercase tracking-[0.16em]">
                <span className="text-lg font-semibold text-white">SEPTA</span>
                <span className="text-lg font-light text-[#C6A15B]">GROUP</span>
              </span>
            </div>
            <p className="text-sm font-inter font-light text-[#8A8A8A] leading-relaxed max-w-xs mb-6">
              {settings?.footer_tagline || 'Built with Clarity. Delivered with Discipline.'}
            </p>
            <p className="tech-label text-[11px] text-[#8A8A8A]">Est. 2004 · Kerala</p>
          </div>

          <div className="md:col-span-2">
            <p className="tech-label text-[11px] text-[#8A8A8A] mb-5">Pages</p>
            <ul className="space-y-3">
              {footerPages.map((p) => (
                <li key={p.to}>
                  <Link
                    to={p.to}
                    data-testid={`footer-link-${p.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm font-inter text-[#F6F6F3]/70 hover:text-[#F6F6F3] transition-colors"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="tech-label text-[11px] text-[#8A8A8A] mb-5">Services</p>
            <ul className="space-y-3">
              {footerServices.map((s) => (
                <li key={s}>
                  <span className="text-sm font-inter text-[#F6F6F3]/70">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="tech-label text-[11px] text-[#8A8A8A] mb-5">Contact</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={14} className="text-[#8A8A8A] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <a href={contact.phone_link || '#'} className="text-sm font-inter text-[#F6F6F3]/70 hover:text-[#F6F6F3] transition-colors" data-testid="footer-phone">
                  {contact.phone_display || '+91 XXXXX XXXXX'}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={14} className="text-[#8A8A8A] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <a href={`mailto:${contact.email || ''}`} className="text-sm font-inter text-[#F6F6F3]/70 hover:text-[#F6F6F3] transition-colors" data-testid="footer-email">
                  {contact.email || 'info@septagroup.in'}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={14} className="text-[#8A8A8A] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-inter text-[#F6F6F3]/70" data-testid="footer-address">
                  {contact.office_address || 'Kerala, India'}
                </span>
              </li>
            </ul>
            <Link
              to="/contact"
              data-testid="footer-enquire-btn"
              className="mt-6 inline-flex items-center gap-2 text-sm font-inter font-medium text-[#606060] hover:text-[#8A8A8A] transition-colors"
            >
              Start an Enquiry <ArrowUpRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="font-display font-medium uppercase tracking-[-0.02em] text-white/[0.06] leading-none text-[clamp(48px,12vw,150px)] select-none pointer-events-none">
            SEPTA GROUP
          </div>
          <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="tech-label text-[11px] text-[#8A8A8A]">
              &copy; {new Date().getFullYear()} Septa Group — All Rights Reserved
            </p>
            <div className="flex items-center gap-5">
              <p className="tech-label text-[11px] text-[#8A8A8A]">Built in Kerala</p>
              <span className="w-px h-3 bg-white/15" />
              <Link
                to="/admin"
                data-testid="footer-admin-link"
                className="tech-label text-[11px] text-[#8A8A8A] hover:text-white transition-colors"
              >
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

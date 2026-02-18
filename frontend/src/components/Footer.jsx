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
    <footer className="bg-[#1F2328] text-[#F3F0E8]" data-testid="footer">
      <div className="h-px bg-[#C6A15B]/40" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

          <div className="md:col-span-4">
            <div className="flex items-center gap-1 mb-4">
              <span className="font-sora font-semibold text-2xl text-[#0F5E5B]">SEPTA</span>
              <span className="font-sora font-light text-2xl text-[#F3F0E8]">GROUP</span>
            </div>
            <p className="text-sm font-inter font-light text-[#A7ADB5] leading-relaxed max-w-xs mb-6">
              {settings?.footer_tagline || 'Built with Clarity. Delivered with Discipline.'}
            </p>
            <p className="text-xs uppercase tracking-widest text-[#C6A15B] font-inter">Est. 2004 · Kerala</p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-5">Pages</p>
            <ul className="space-y-3">
              {footerPages.map((p) => (
                <li key={p.to}>
                  <Link
                    to={p.to}
                    data-testid={`footer-link-${p.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm font-inter text-[#F3F0E8]/70 hover:text-[#F3F0E8] transition-colors"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-5">Services</p>
            <ul className="space-y-3">
              {footerServices.map((s) => (
                <li key={s}>
                  <span className="text-sm font-inter text-[#F3F0E8]/70">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-widest text-[#A7ADB5] font-inter mb-5">Contact</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={14} className="text-[#C6A15B] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <a href={contact.phone_link || '#'} className="text-sm font-inter text-[#F3F0E8]/70 hover:text-[#F3F0E8] transition-colors" data-testid="footer-phone">
                  {contact.phone_display || '+91 XXXXX XXXXX'}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={14} className="text-[#C6A15B] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <a href={`mailto:${contact.email || ''}`} className="text-sm font-inter text-[#F3F0E8]/70 hover:text-[#F3F0E8] transition-colors" data-testid="footer-email">
                  {contact.email || 'info@septagroup.in'}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={14} className="text-[#C6A15B] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-inter text-[#F3F0E8]/70" data-testid="footer-address">
                  {contact.office_address || 'Kerala, India'}
                </span>
              </li>
            </ul>
            <Link
              to="/contact"
              data-testid="footer-enquire-btn"
              className="mt-6 inline-flex items-center gap-2 text-sm font-inter font-medium text-[#0F5E5B] hover:text-[#C6A15B] transition-colors"
            >
              Start an Enquiry <ArrowUpRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#F3F0E8]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs font-inter text-[#A7ADB5]">
            &copy; {new Date().getFullYear()} Septa Group. All rights reserved.
          </p>
          <p className="text-xs font-inter text-[#A7ADB5]">Built with care in Kerala.</p>
        </div>
      </div>
    </footer>
  );
}

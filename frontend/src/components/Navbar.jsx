import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import LanguageToggle from './LanguageToggle';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/projects', label: 'Projects' },
  { to: '/ecosystem', label: 'Ecosystem' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#F3F0E8]/92 backdrop-blur-md shadow-[0_1px_0_rgba(31,35,40,0.08)]' : 'bg-transparent'
      }`}
      data-testid="navbar"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12 h-16 md:h-18 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1" data-testid="navbar-logo">
          <span className="font-sora font-semibold text-xl text-[#0F5E5B] tracking-tight">SEPTA</span>
          <span className="font-sora font-light text-xl text-[#1F2328] tracking-tight">GROUP</span>
          <span className="ml-2 w-px h-4 bg-[#C6A15B] hidden md:block" />
          <span className="ml-2 text-xs text-[#A7ADB5] font-inter hidden md:block tracking-widest uppercase">Kerala</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8" data-testid="navbar-desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`nav-link-${link.label.toLowerCase()}`}
              className={`text-sm font-inter transition-colors duration-200 ${
                location.pathname === link.to
                  ? 'text-[#0F5E5B] font-medium'
                  : 'text-[#1F2328]/70 hover:text-[#0F5E5B]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LanguageToggle className="text-[#1F2328]/60 hover:text-[#0F5E5B]" />
          <div className="w-px h-4 bg-[#A7ADB5]/30" />
          <Link
            to="/contact"
            data-testid="navbar-cta-btn"
            className="h-10 px-6 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest hover:bg-[#0D4E4C] transition-colors flex items-center"
          >
            Get a Quote
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-[#1F2328]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          data-testid="navbar-mobile-toggle"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#F3F0E8] border-t border-[#A7ADB5]/20 px-6 py-6 flex flex-col gap-5" data-testid="navbar-mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
              className={`text-base font-inter ${
                location.pathname === link.to ? 'text-[#0F5E5B] font-medium' : 'text-[#1F2328]/80'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-[#A7ADB5]/20 pt-4 mt-2">
            <LanguageToggle className="text-[#1F2328]/60 hover:text-[#0F5E5B]" />
          </div>
          <Link
            to="/contact"
            data-testid="navbar-mobile-cta-btn"
            className="mt-2 h-12 px-6 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-widest flex items-center justify-center"
          >
            Get a Quote
          </Link>
        </div>
      )}
    </header>
  );
}

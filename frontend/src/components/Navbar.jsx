import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { useSiteSettings } from '../hooks/useApi';

const navLinks = [
  { to: '/', label: 'Home', key: 'home' },
  { to: '/about', label: 'About', key: 'about' },
  { to: '/services', label: 'Services', key: 'services' },
  { to: '/projects', label: 'Projects', key: 'projects' },
  { to: '/ecosystem', label: 'Ecosystem', key: 'ecosystem' },
  { to: '/contact', label: 'Contact', key: 'contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSiteSettings();

  const navVis = settings?.nav_visibility || {};
  const visibleLinks = navLinks.filter(
    (link) => link.key === 'home' || navVis[link.key] !== false
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 border-b ${
        scrolled ? 'bg-[#050505]/95 backdrop-blur-md border-white/10' : 'bg-[#050505] border-white/[0.06]'
      }`}
      data-testid="navbar"
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-16 md:h-[76px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" data-testid="navbar-logo-link">
          <img src="/septa-logo.png" alt="Septa Group" className="h-8 md:h-9 w-auto" />
          <span className="hidden sm:flex items-baseline gap-2 font-display uppercase tracking-[0.16em] text-white">
            <span className="text-[15px] font-semibold">SEPTA</span>
            <span className="text-[15px] font-light text-white/70">GROUP</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9" data-testid="navbar-desktop-nav">
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`navbar-nav-item-${link.key}`}
              className={`font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                location.pathname === link.to
                  ? 'text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <LanguageToggle className="text-white/50 hover:text-white" />
          <div className="w-px h-4 bg-white/15" />
          <Link
            to="/contact"
            data-testid="navbar-get-quote-button"
            className="group h-10 px-6 bg-white text-[#050505] border border-white text-[13px] font-body font-medium tracking-[0.02em] hover:bg-transparent hover:text-white transition-colors duration-200 flex items-center gap-2 rounded-[3px]"
          >
            Get a Quote
            <ArrowUpRight size={15} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          data-testid="navbar-mobile-toggle"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#050505] border-t border-white/10 px-6 py-7 flex flex-col gap-5" data-testid="navbar-mobile-menu">
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`mobile-navbar-nav-item-${link.key}`}
              className={`font-mono text-[13px] uppercase tracking-[0.14em] ${
                location.pathname === link.to ? 'text-white' : 'text-white/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-5 mt-1">
            <LanguageToggle className="text-white/50 hover:text-white" />
          </div>
          <Link
            to="/contact"
            data-testid="navbar-mobile-cta-btn"
            className="mt-1 h-12 px-6 bg-white text-[#050505] text-[13px] font-body font-medium tracking-[0.02em] flex items-center justify-center gap-2 rounded-[3px]"
          >
            Get a Quote <ArrowUpRight size={15} strokeWidth={1.75} />
          </Link>
        </div>
      )}
    </header>
  );
}

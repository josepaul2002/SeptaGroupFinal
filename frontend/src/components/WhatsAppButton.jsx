import { contactLinks } from '../lib/contactLinks';
import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSiteSettings } from '../hooks/useApi';

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);
  const { settings } = useSiteSettings();

  const href = contactLinks(settings?.contact, 'Hello Septa, I would like to discuss a project.').whatsapp;
  if (!href) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
      data-testid="whatsapp-float-btn"
    >
      {hovered && (
        <div className="bg-[#050505] text-white text-xs font-inter px-3 py-2 rounded-sm shadow-lg whitespace-nowrap">
          WhatsApp Us
        </div>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Us"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-[52px] h-[52px] bg-[#050505] hover:bg-white text-white hover:text-[#050505] border border-white/15 hover:border-[#050505] flex items-center justify-center transition-colors duration-200 rounded-[4px]"
      >
        <MessageCircle size={24} strokeWidth={1.5} />
      </a>
    </div>
  );
}

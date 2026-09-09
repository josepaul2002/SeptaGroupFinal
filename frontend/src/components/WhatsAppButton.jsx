import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSiteSettings } from '../hooks/useApi';

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);
  const { settings } = useSiteSettings();

  const whatsappLink = settings?.contact?.whatsapp_link;
  const whatsappNumber = settings?.contact?.whatsapp_number;

  if (!whatsappNumber && !whatsappLink) return null;

  const message = encodeURIComponent('Hello, I would like to enquire about construction services from Septa Group.');
  const href = whatsappLink || `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
      data-testid="whatsapp-float-btn"
    >
      {hovered && (
        <div className="bg-[#1F2328] text-white text-xs font-inter px-3 py-2 rounded-sm shadow-lg whitespace-nowrap">
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
        className="w-13 h-13 w-[52px] h-[52px] bg-[#25D366] hover:bg-[#20c05b] text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 rounded-sm"
      >
        <MessageCircle size={24} strokeWidth={1.5} />
      </a>
    </div>
  );
}

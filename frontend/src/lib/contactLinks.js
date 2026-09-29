export function contactLinks(contact = {}, message = '') {
  const phone = (contact.phone_link || contact.phone_display || '').trim().replace(/^tel:/i, '').replace(/[\s().-]/g, '');
  let whatsapp = '';
  try {
    const number = (contact.whatsapp_number || '').trim().replace(/^\+/, '').replace(/[\s().-]/g, '');
    const mode = contact.whatsapp_mode || (contact.whatsapp_link ? 'link' : 'number');
    const destination = mode === 'link' ? (contact.whatsapp_link || '').trim() : (/^[1-9]\d{6,14}$/.test(number) ? `https://wa.me/${number}` : '');
    const url = new URL(destination);
    const isChat = url.hostname === 'wa.me' ? /^\/(?:[1-9]\d{6,14}|message\/[a-z\d]+)\/?$/i.test(url.pathname) : ['api.whatsapp.com','web.whatsapp.com','www.whatsapp.com'].includes(url.hostname) && url.pathname === '/send' && /^[1-9]\d{6,14}$/.test((url.searchParams.get('phone') || '').replace(/^\+/, ''));
    if (url.protocol === 'https:' && !url.username && !url.password && isChat) {
      url.searchParams.set('text', message);
      whatsapp = url.href;
    }
  } catch {}
  const address = (contact.email || '').trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? address : '';
  return {
    call: /^\+?[1-9]\d{6,14}$/.test(phone) ? `tel:${phone.startsWith('+') ? phone : '+'+phone}` : '', whatsapp,
    email: email ? `mailto:${email}?subject=${encodeURIComponent('Septa enquiry')}&body=${encodeURIComponent(message)}` : ''
  };
}

export function contactSettingsError(contact = {}) {
  const links = contactLinks(contact);
  if ((contact.phone_link || contact.phone_display) && !links.call) return 'Enter a call number with its country code, for example +91 followed by the phone number.';
  const mode = contact.whatsapp_mode || (contact.whatsapp_link ? 'link' : 'number');
  if ((mode === 'link' ? contact.whatsapp_link : contact.whatsapp_number) && !links.whatsapp) return 'Enter a WhatsApp number with country code or an official WhatsApp chat link (wa.me or WhatsApp /send).';
  if (contact.email && !links.email) return 'Enter a valid email address, without mailto:.';
  return '';
}

export function mapAddressHref(address='', mapLink='') {
  try { const url=new URL(mapLink.trim()); if(url.protocol==='https:'&&!url.username&&!url.password)return url.href; } catch {}
  const query=String(address||'').trim();
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
}

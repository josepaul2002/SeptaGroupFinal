export function contactLinks(contact = {}, message = '') {
  const phone = (contact.phone_link || contact.phone_display || '').replace(/^tel:/i, '').replace(/[^+\d]/g, '');
  let whatsapp = '';
  try {
    const number = (contact.whatsapp_number || '').replace(/\D/g, '');
    const url = new URL(contact.whatsapp_link || `https://wa.me/${number}`);
    if (url.protocol === 'https:' && ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com', 'www.whatsapp.com'].includes(url.hostname) && (contact.whatsapp_link || number)) {
      url.searchParams.set('text', message);
      whatsapp = url.href;
    }
  } catch {}
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email || '') ? contact.email : '';
  return {
    call: /\d{7}/.test(phone) ? `tel:${phone}` : '', whatsapp,
    email: email ? `mailto:${email}?subject=${encodeURIComponent('Septa enquiry')}&body=${encodeURIComponent(message)}` : ''
  };
}

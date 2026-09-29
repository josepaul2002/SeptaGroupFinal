import {contactLinks,contactSettingsError,mapAddressHref} from './contactLinks';
import {phoneCountries,normaliseEnquiryPhone} from './internationalPhone';
test('explicit number replaces a stale WhatsApp link, and explicit link has its own destination',()=>{
 const contact={whatsapp_number:'+91 90000 00000',whatsapp_link:'https://wa.me/61412345678',whatsapp_mode:'number'};
 expect(contactLinks(contact).whatsapp).toContain('wa.me/919000000000');
 expect(contactLinks({...contact,whatsapp_mode:'link'}).whatsapp).toContain('wa.me/61412345678');
 expect(contactLinks({whatsapp_link:'https://wa.me/message/ABC123'}).whatsapp).toContain('/message/ABC123');
 expect(contactSettingsError({whatsapp_mode:'link',whatsapp_link:'https://evil.example/send'})).toContain('WhatsApp');
 expect(contactSettingsError({whatsapp_mode:'number',whatsapp_number:'abc919000000000'})).toContain('WhatsApp');
});
test('country selection normalises Indian, Australian, UAE and pasted international numbers',()=>{
 expect(phoneCountries.length).toBeGreaterThan(200);
 expect(normaliseEnquiryPhone('9000000000','IN')).toBe('+919000000000');
 expect(normaliseEnquiryPhone('0412 345 678','AU')).toBe('+61412345678');
 expect(normaliseEnquiryPhone('050 123 4567','AE')).toBe('+971501234567');
 expect(normaliseEnquiryPhone('+61 412 345 678','IN')).toBe('+61412345678');
 expect(normaliseEnquiryPhone('12','IN')).toBe('');
 expect(normaliseEnquiryPhone('hello +61412345678','IN')).toBe('');
});
test('contact links and map override use the saved destinations',()=>{
 const links=contactLinks({phone_link:'+61 412 345 678',email:'team@example.com'});
 expect(links.call).toBe('tel:+61412345678');
 expect(links.email).toContain('mailto:team@example.com');
 expect(mapAddressHref('Kottayam','https://maps.apple.com/?q=Kottayam')).toContain('maps.apple.com');
});

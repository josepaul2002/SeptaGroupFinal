import {useSiteSettings} from '../hooks/useApi';
import {contactLinks} from '../lib/contactLinks';
export default function MobileContactBar(){
 const {settings}=useSiteSettings(),links=contactLinks(settings?.contact,'Hello Septa, I would like to discuss a project.');
 if(settings?.appearance?.mobile_contact_bar===false||(!links.call&&!links.whatsapp))return null;
 return <nav className="mobile-contact-bar glass-surface" aria-label="Quick contact">{links.call&&<a href={links.call}>Call Septa</a>}{links.whatsapp&&<a href={links.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}</nav>;
}

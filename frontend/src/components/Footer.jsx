import BrandName from './BrandName';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {useSiteSettings} from '../hooks/useApi';
import {navigationFor,safeHref} from '../lib/pageContent';
import {ContentLink} from './PageSections';
export default function Footer(){
 const {settings}=useSiteSettings(),brand=settings?.brand||{},contact=settings?.contact||{};
 return <footer className="site-footer"><div className="design-container"><div className="footer-grid"><div><Link to="/" className="site-brand"><img src={safeHref(brand.logo_url)||'/septa-logo.png'} alt=""/><BrandName name={brand.name}/></Link><p className="footer-tagline">{settings?.footer_tagline||'Built with Clarity. Delivered with Discipline.'}</p></div><nav aria-label="Footer navigation"><p className="tech-label footer-heading">Pages</p>{navigationFor(settings,'footer').map(link=><ContentLink key={link.key} to={link.url}>{link.label}</ContentLink>)}</nav><div className="footer-contact"><p className="tech-label footer-heading">Contact</p>{contact.email&&<a href={`mailto:${contact.email}`}>{contact.email}</a>}{contact.phone_display&&<ContentLink to={contact.phone_link}>{contact.phone_display}</ContentLink>}{contact.facebook_url&&<ContentLink to={contact.facebook_url}>Facebook ↗</ContentLink>}{contact.instagram_url&&<ContentLink to={contact.instagram_url}>Instagram ↗</ContentLink>}{contact.office_address&&<p>{contact.office_address}</p>}<ContentLink to={brand.cta_url||'/contact'} className="design-text-link">{brand.cta_label||'Discuss your project'}<ArrowUpRight size={16}/></ContentLink></div></div><div className="footer-watermark" aria-hidden="true">{brand.name||'SEPTA GROUP'}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} {brand.name||'Septa Group'}</span><div><Link to="/privacy">Privacy</Link><Link to="/admin">Admin</Link></div></div></div></footer>;
}

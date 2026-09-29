import BrandName from './BrandName';
import {Link} from 'react-router-dom';
import {useSiteSettings} from '../hooks/useApi';
import {navigationFor,footerGroupsFor} from '../lib/navigation';
import {safeHref} from '../lib/pageContent';
import {ContentLink} from './PageSections';
import {mapAddressHref} from '../lib/contactLinks';
export default function Footer(){
 const {settings}=useSiteSettings(),brand=settings?.brand||{},contact=settings?.contact||{},links=navigationFor(settings,'footer');
 return <footer className="site-footer"><div className="design-container"><div className="footer-brand-row"><Link to="/" className="site-brand"><img src={safeHref(brand.logo_url)||'/septa-logo.png'} alt=""/><BrandName name={brand.name}/></Link><p className="footer-tagline">{settings?.footer_tagline||'Built with Clarity. Delivered with Discipline.'}</p></div><div className="footer-grid footer-grouped">{footerGroupsFor(settings).map(group=>{const entries=links.filter(l=>l.footer_group===group.id);if(!entries.length&&!(group.show_address&&contact.office_address))return null;return <nav key={group.id} aria-label={group.label}><p className="tech-label footer-heading">{group.label}</p>{entries.map(link=><ContentLink key={link.key} to={link.url}>{link.label}</ContentLink>)}{group.show_address&&contact.office_address&&<address className="not-italic text-sm text-white/60"><a className="footer-address-link" href={mapAddressHref(contact.office_address,contact.map_link)} target="_blank" rel="noreferrer" aria-label={`Open ${contact.office_address} in Google Maps`}>{contact.office_address}<span aria-hidden="true"> ↗</span></a></address>}</nav>;})}</div><div className="footer-watermark" aria-hidden="true">{brand.name||'SEPTA GROUP'}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} {brand.name||'Septa Group'}</span><div><Link to="/privacy">Privacy</Link><Link to="/admin">Admin</Link></div></div></div></footer>;
}

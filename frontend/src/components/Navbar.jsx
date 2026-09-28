import {useState,useEffect,useRef} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Menu,X,ArrowUpRight} from 'lucide-react';
import BrandName from './BrandName';
import LanguageToggle from './LanguageToggle';
import {useSiteSettings} from '../hooks/useApi';
import {navigationFor,safeHref} from '../lib/pageContent';
import {contactLinks} from '../lib/contactLinks';
import {ContentLink} from './PageSections';
export default function Navbar(){
 const [scrolled,setScrolled]=useState(false),[open,setOpen]=useState(false);
 const {pathname,search,hash}=useLocation(),{settings}=useSiteSettings();
 const toggle=useRef(null),panel=useRef(null),brand=settings?.brand||{},links=navigationFor(settings,'header'),mobile=navigationFor(settings,'mobile'),contact=contactLinks(settings?.contact);
 useEffect(()=>setOpen(false),[pathname,search,hash]);
 useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>20);onScroll();window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll);},[]);
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  const key=e=>{if(e.key==='Escape'){setOpen(false);toggle.current?.focus();}if(e.key==='Tab'){const controls=[toggle.current,...panel.current.querySelectorAll('a[href],button:not([disabled])')].filter(Boolean),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  const mq=window.matchMedia('(min-width: 1024px)'),resize=e=>{if(e.matches)setOpen(false);};mq.addEventListener('change',resize);document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);mq.removeEventListener('change',resize);};
 },[open]);
 const current=url=>pathname===url?'page':undefined;
 return <header className={`site-header ${scrolled?'is-scrolled':''}`} data-testid="navbar"><a className="skip-link" href="#main-content">Skip to content</a><div className="design-container header-inner"><Link to="/" className="site-brand" aria-label={`${brand.name||'Septa Group'} home`}><img src={safeHref(brand.logo_url)||'/septa-logo.png'} alt=""/><BrandName name={brand.name}/></Link><nav className="desktop-navigation" aria-label="Main navigation">{links.map(link=><ContentLink key={link.key} to={link.url} aria-current={current(link.url)}>{link.label}</ContentLink>)}</nav><div className="header-actions"><LanguageToggle className="text-white/50 hover:text-white"/><ContentLink to={brand.cta_url||'/contact'} className="header-cta">{brand.cta_label||'Discuss your project'}<ArrowUpRight size={16}/></ContentLink></div><button ref={toggle} className="mobile-menu-toggle" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open?'Close menu':'Open menu'} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button></div>
 <nav ref={panel} id="mobile-navigation" className={`mobile-navigation ${open?'menu-open':''}`} inert={!open} aria-hidden={!open} aria-label="Mobile navigation" onClick={e=>{if(e.target.closest('a'))setOpen(false);}}>
 {['main','secondary'].map(group=><div className={`mobile-link-group ${group}`} key={group}>{group==='secondary'&&mobile.some(l=>l.mobile_group==='secondary')&&<p className="tech-label">More about Septa</p>}{mobile.filter(l=>(l.mobile_group||'main')===group).map((link,i)=><ContentLink key={link.key} to={link.url} style={{'--link-order':i}} aria-current={current(link.url)}>{link.label}<ArrowUpRight size={14}/></ContentLink>)}</div>)}
 <ContentLink to={brand.cta_url||'/contact'} className="header-cta">{brand.cta_label||'Discuss your project'}<ArrowUpRight size={16}/></ContentLink><div className="mobile-quick-contact">{contact.call&&<a href={contact.call}>Call</a>}{contact.whatsapp&&<a href={contact.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}<LanguageToggle/></div></nav></header>;
}

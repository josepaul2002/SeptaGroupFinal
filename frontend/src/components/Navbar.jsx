import {useState,useEffect} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Menu,X,ArrowUpRight} from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import {useSiteSettings} from '../hooks/useApi';
import {navigationFor,safeHref} from '../lib/pageContent';
import {ContentLink} from './PageSections';
export default function Navbar(){
 const [open,setOpen]=useState(false),{pathname}=useLocation(),{settings}=useSiteSettings();
 const brand=settings?.brand||{},links=navigationFor(settings,'header');
 useEffect(()=>setOpen(false),[pathname]);
 useEffect(()=>{if(!open)return;const key=e=>{if(e.key==='Escape')setOpen(false);};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[open]);
 return <header className="site-header" data-testid="navbar"><a className="skip-link" href="#main-content">Skip to content</a><div className="design-container header-inner"><Link to="/" className="site-brand" aria-label={`${brand.name||'Septa Group'} home`}><img src={safeHref(brand.logo_url)||'/septa-logo.png'} alt=""/><span>{brand.name||'SEPTA GROUP'}</span></Link><nav className="desktop-navigation" aria-label="Main navigation">{links.map(link=><ContentLink key={link.key} to={link.url} aria-current={pathname===link.url?'page':undefined}>{link.label}</ContentLink>)}</nav><div className="header-actions"><LanguageToggle/><ContentLink to={brand.cta_url||'/contact'} className="header-cta">{brand.cta_label||'Discuss your project'}<ArrowUpRight size={16}/></ContentLink></div><button className="mobile-menu-toggle" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open?'Close menu':'Open menu'} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button></div>{open&&<nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation">{links.map(link=><ContentLink key={link.key} to={link.url} aria-current={pathname===link.url?'page':undefined}>{link.label}</ContentLink>)}<LanguageToggle/><ContentLink to={brand.cta_url||'/contact'} className="header-cta">{brand.cta_label||'Discuss your project'}<ArrowUpRight size={16}/></ContentLink></nav>}</header>;
}

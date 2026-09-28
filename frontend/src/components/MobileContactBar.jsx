import {useEffect,useState} from 'react';
import {MessageCircle,Phone,X} from 'lucide-react';
import {useSiteSettings} from '../hooks/useApi';
import {contactLinks} from '../lib/contactLinks';
export default function MobileContactBar(){
 const {settings}=useSiteSettings(),links=contactLinks(settings?.contact,'Hello Septa, I would like to discuss a project.');
 const [open,setOpen]=useState(false),[compact,setCompact]=useState(false);
 useEffect(()=>{let previous=window.scrollY;const scroll=()=>{const current=window.scrollY;if(Math.abs(current-previous)<12)return;setCompact(current>previous&&current>120);setOpen(false);previous=current;};const key=e=>{if(e.key==='Escape')setOpen(false);};window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('keydown',key);return()=>{window.removeEventListener('scroll',scroll);window.removeEventListener('keydown',key);};},[]);
 if(settings?.appearance?.mobile_contact_bar===false||(!links.call&&!links.whatsapp))return null;
 return <nav className={`mobile-contact-dock ${compact&&!open?'is-compact':''}`} aria-label="Quick contact">{open&&<div id="mobile-contact-options" className="mobile-contact-options glass-surface">{links.call&&<a href={links.call}><Phone size={17}/>Call Septa</a>}{links.whatsapp&&<a href={links.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17}/>WhatsApp</a>}</div>}<button type="button" className="mobile-contact-toggle" aria-label={open?'Close contact options':'Contact Septa'} aria-expanded={open} aria-controls={open?'mobile-contact-options':undefined} onClick={()=>setOpen(!open)}>{open?<X size={21}/>:<MessageCircle size={21}/>}<span>Contact</span></button></nav>;
}

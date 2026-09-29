import ResponsiveImage from './ResponsiveImage';
import {useEffect,useState} from 'react';
import {useMotion} from './MotionProvider';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {useLanguage} from './LanguageToggle';
import {safeHref} from '../lib/pageContent';
import {profileImage} from '../lib/profiles';
export default function PartnerCard({partner,projects=[]}){
 const {t:getText}=useLanguage();
 const {mode}=useMotion();const [paused,setPaused]=useState(false),[manualPause,setManualPause]=useState(false);
 const photos=(partner.media?.card_images||[]).map(safeHref).filter(Boolean);
 const [slide,setSlide]=useState(0);
 useEffect(()=>setSlide(0),[partner.slug,photos.length]);
 useEffect(()=>{if(photos.length<2||mode==='off'||paused||manualPause)return;const timer=setInterval(()=>{if(!document.hidden)setSlide(i=>(i+1)%photos.length);},4400);return()=>clearInterval(timer);},[partner.slug,photos.length,mode,paused,manualPause]);
 const photo=safeHref(profileImage(partner));
 const related=projects.filter(p=>(p.credits||[]).some(c=>c.verified&&c.entity_type==='partner'&&c.entity_slug===partner.slug));
 return <article className="collaborator-card" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false);}}><Link to={`/ecosystem/${partner.slug}`} className="collaborator-main">{photos.length>1?<div className="collaborator-card-slides">{photos.map((src,i)=><ResponsiveImage key={`${src}-${i}`} src={src} alt={i===slide?getText(partner.name):''} aria-hidden={i!==slide} className={i===slide?'active':''} loading="lazy"/>)}</div>:photo?<ResponsiveImage src={photo} alt={getText(partner.name)} loading="lazy"/>:<div className="collaborator-initial">{getText(partner.name).slice(0,1)}</div>}<div><p className="design-eyebrow">{getText(partner.professional_role)||partner.category}</p><h3>{getText(partner.name)}</h3>{partner.media?.show_logo&&safeHref(partner.media?.logo_image)&&<ResponsiveImage className="collaborator-logo" src={safeHref(partner.media.logo_image)} alt={`${getText(partner.name)} logo`} loading="lazy"/>}{partner.firm&&<p>{partner.firm}</p>}<span className="design-text-link">View profile <ArrowUpRight size={14}/></span></div></Link>{photos.length>1&&<button className="collaborator-photo-control" type="button" aria-pressed={manualPause} onClick={()=>setManualPause(v=>!v)}>{manualPause?'Resume images':'Pause images'}</button>}{related.length>0&&<section className="collaborator-projects" aria-label={`Projects with ${getText(partner.name)}`}><div className="collaborator-projects-heading"><span>Shared projects · {related.length}</span>{related.length>1&&<span>Swipe to explore ↔</span>}</div><div className="collaborator-projects-track">{related.map(project=><Link key={project.slug} className="collaborator-project" to={`/projects/${project.slug}`}>{project.image&&<ResponsiveImage src={safeHref(project.image)} alt="" loading="lazy"/>}<span>Worked together on<strong>{getText(project.title)}</strong></span><ArrowUpRight size={14}/></Link>)}</div></section>}</article>;
}

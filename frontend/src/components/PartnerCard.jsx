import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {useLanguage} from './LanguageToggle';
import {safeHref} from '../lib/pageContent';
import {profileImage} from '../lib/profiles';
export default function PartnerCard({partner,projects=[]}){
 const {t:getText}=useLanguage();
 const photos=(partner.media?.card_images||[]).map(safeHref).filter(Boolean);
 const [slide,setSlide]=useState(0);
 useEffect(()=>{setSlide(0);if(photos.length<2)return;const timer=setInterval(()=>setSlide(i=>(i+1)%photos.length),4400);return()=>clearInterval(timer);},[partner.slug,photos.length]);
 const photo=safeHref(profileImage(partner));
 const related=projects.filter(p=>(p.credits||[]).some(c=>c.verified&&c.entity_type==='partner'&&c.entity_slug===partner.slug));
 return <article className="collaborator-card"><Link to={`/ecosystem/${partner.slug}`} className="collaborator-main">{photos.length>1?<div className="collaborator-card-slides">{photos.map((src,i)=><img key={`${src}-${i}`} src={src} alt={i===slide?getText(partner.name):''} aria-hidden={i!==slide} className={i===slide?'active':''} loading="lazy"/>)}</div>:photo?<img src={photo} alt={getText(partner.name)} loading="lazy"/>:<div className="collaborator-initial">{getText(partner.name).slice(0,1)}</div>}<div><p className="design-eyebrow">{getText(partner.professional_role)||partner.category}</p><h3>{getText(partner.name)}</h3>{partner.media?.show_logo&&safeHref(partner.media?.logo_image)&&<img className="collaborator-logo" src={safeHref(partner.media.logo_image)} alt={`${getText(partner.name)} logo`} loading="lazy"/>}{partner.firm&&<p>{partner.firm}</p>}<span className="design-text-link">View profile <ArrowUpRight size={14}/></span></div></Link>{related.length>0&&<div className="collaborator-projects" aria-label={`Projects with ${getText(partner.name)}`}>{related.map(project=><Link key={project.slug} className="collaborator-project" to={`/projects/${project.slug}`}>{project.image&&<img src={safeHref(project.image)} alt="" loading="lazy"/>}<span>Worked together on<strong>{getText(project.title)}</strong></span><ArrowUpRight size={14}/></Link>)}</div>}</article>;
}

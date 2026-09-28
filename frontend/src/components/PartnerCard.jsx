import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {useLanguage} from './LanguageToggle';
import {safeHref} from '../lib/pageContent';
import {profileImage} from '../lib/profiles';
export default function PartnerCard({partner,projects=[]}){
 const {t:getText}=useLanguage();
 const photo=safeHref(profileImage(partner));
 const project=projects.find(p=>(p.credits||[]).some(c=>c.verified&&c.entity_type==='partner'&&c.entity_slug===partner.slug));
 return <article className={`collaborator-card ${partner.profile_type==='person'?'person-profile':''}`}><Link to={`/ecosystem/${partner.slug}`} className="collaborator-main">{photo?<img src={photo} alt={getText(partner.name)} loading="lazy"/>:<div className="collaborator-initial">{getText(partner.name).slice(0,1)}</div>}<div><p className="design-eyebrow">{getText(partner.professional_role)||partner.category}</p><h3>{getText(partner.name)}</h3>{partner.firm&&<p>{partner.firm}</p>}<span className="design-text-link">View profile <ArrowUpRight size={14}/></span></div></Link>{project&&<Link className="collaborator-project" to={`/projects/${project.slug}`}>{project.image&&<img src={safeHref(project.image)} alt="" loading="lazy"/>}<span>Worked together on<strong>{getText(project.title)}</strong></span><ArrowUpRight size={14}/></Link>}</article>;
}

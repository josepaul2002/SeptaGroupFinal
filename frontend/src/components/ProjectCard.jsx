import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {useLanguage} from './LanguageToggle';
import {safeHref} from '../lib/pageContent';
export default function ProjectCard({project,partners=[],leaders=[]}){
 const {t:getText}=useLanguage();
 const credits=(project.credits||[]).filter(c=>c.verified).map(c=>({...c,profile:(c.entity_type==='leader'?leaders:partners).find(p=>p.slug===c.entity_slug)})).filter(c=>c.profile).slice(0,2);
 return <article className="selected-project"><Link to={`/projects/${project.slug}`}><div className="project-image">{safeHref(project.image)?<img src={safeHref(project.image)} alt={getText(project.title)} loading="lazy"/>:<div className="project-media-placeholder"><span className="tech-label">{project.type}</span></div>}<span className="project-open glass-surface"><ArrowUpRight size={20}/></span></div><div className="project-caption"><div><p className="design-eyebrow">{project.type}{project.location&&` / ${project.location}`}</p><h3>{getText(project.title)}</h3></div></div></Link>{credits.length>0&&<div className="project-card-credits">{credits.map(c=><p key={`${c.entity_type}-${c.entity_slug}-${c.role}`}>{c.role}: <Link to={c.display_as==='company'?`/projects/${project.slug}#team`:`/${c.entity_type==='leader'?'project-leaders':'ecosystem'}/${c.entity_slug}`}>{c.display_as==='company'?c.affiliation_at_time:getText(c.profile.name)}</Link></p>)}</div>}</article>;
}

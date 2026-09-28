import {Link} from 'react-router-dom';
import {useLanguage} from './LanguageToggle';
import {safeHref} from '../lib/pageContent';
const nameOf=(c,t)=>c.display_as==='company'&&c.affiliation_at_time?c.affiliation_at_time:t(c.name);
function IdentityLink({credit,children,...props}){const external=credit.display_as==='company'?safeHref(credit.affiliation_url):null;return credit.display_as==='company'?external?<a href={external} target="_blank" rel="noreferrer" {...props}>{children}</a>:<div {...props}>{children}</div>:<Link to={credit.url} {...props}>{children}</Link>;}
export function CompactCredits({credits=[]}){
 const {t}=useLanguage();if(!credits.length)return null;
 const sorted=[...credits].sort((a,b)=>Number(b.entity_type==='leader')-Number(a.entity_type==='leader'));
 return <div className="compact-credits">{sorted.slice(0,3).map(c=><span key={`${c.entity_slug}-${c.role}`}>{c.entity_type==='leader'?'Septa team · ':''}{c.role}: <IdentityLink credit={c}>{nameOf(c,t)}</IdentityLink></span>)}{credits.length>3&&<a href="#team">Meet the full team</a>}</div>;
}
export default function ProjectCredits({credits=[]}){
 const {t}=useLanguage();if(!credits.length)return null;
 return <div className="project-team-grid">{credits.map(c=><article key={`${c.entity_type}-${c.entity_slug}-${c.role}`}><IdentityLink credit={c} className="project-team-person">{c.display_as!=='company'&&safeHref(c.photo)?<img src={c.photo} alt={nameOf(c,t)} loading="lazy" className={c.profile_type==='company'?'company-logo':''}/>:<span className="team-initial">{nameOf(c,t).slice(0,1)}</span>}<div><p className="design-eyebrow">{c.role}</p><h3>{nameOf(c,t)}</h3></div></IdentityLink>{t(c.contribution)&&<p>{t(c.contribution)}</p>}{c.display_as!=='company'&&c.affiliation_at_time&&<p className="credit-affiliation">Company represented: {safeHref(c.affiliation_url)?<a href={safeHref(c.affiliation_url)} target="_blank" rel="noreferrer">{c.affiliation_at_time} ↗</a>:c.affiliation_at_time}</p>}<Link className="design-text-link" to={`/contact?${c.entity_type==='leader'?'leader':'partner'}=${encodeURIComponent(c.entity_slug)}&enquiry_type=introduction`}>{c.entity_type==='leader'?'Talk to our team':'Request an introduction'} ↗</Link></article>)}</div>;
}

import ResponsiveImage from './ResponsiveImage';
import {Link} from 'react-router-dom';
import {useLanguage} from './LanguageToggle';
import {safeHref} from '../lib/pageContent';
export default function TestimonialCard({item,project}){
 const {t}=useLanguage(),cover=safeHref(item.cover_image)||safeHref(project?.image),portrait=safeHref(item.profile_image);
 return <figure id={`testimonial-${item.id}`} className="testimonial-card">{cover&&<ResponsiveImage className="testimonial-cover" src={cover} alt={project?t(project.title):`Testimonial from ${t(item.client_name)}`} loading="lazy"/>}<blockquote>{t(item.content||item.quote)}</blockquote><figcaption className="testimonial-person">{portrait&&<ResponsiveImage className="testimonial-portrait" src={portrait} alt={t(item.client_name)} loading="lazy"/>}<span>{t(item.client_name||item.name)}{item.client_role&&<small>{t(item.client_role)}</small>}</span></figcaption>{project&&<Link className="design-text-link" to={`/projects/${project.slug}#client-perspectives`}>View project: {t(project.title)} ↗</Link>}</figure>;
}

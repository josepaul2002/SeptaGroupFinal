import TestimonialCard from '../components/TestimonialCard';
import {useEffect,useState} from 'react';
import {useParams,Link,useSearchParams} from 'react-router-dom';
import {ArrowLeft,ArrowUpRight,Loader2} from 'lucide-react';
import {useTestimonials,useProject,useProjects,usePartners,useApiData,getText} from '../hooks/useApi';
import {useLanguage} from '../components/LanguageToggle';
import {safeHref} from '../lib/pageContent';
import PreviewBanner from '../components/PreviewBanner';
import ImageGallery from '../components/ImageGallery';
import VideoPlayer from '../components/VideoPlayer';
import Model3DViewer from '../components/Model3DViewer';
import ProjectCredits,{CompactCredits} from '../components/ProjectCredits';
import ProjectCard from '../components/ProjectCard';
import PlanDrawings from '../components/PlanDrawings';

export default function ProjectCaseStudyPage(){
 const {slug}=useParams(),[params]=useSearchParams(),preview=params.get('preview')==='true';
 const {project,loading}=useProject(slug,preview),{data:projects}=useProjects(),{data:partners}=usePartners(),{data:leaders}=useApiData('/leaders',[]);
 const {data:credits}=useApiData(`/projects/${slug}/credits${preview?'?preview=true':''}`,[]),{t}=useLanguage();
 const {data:testimonials}=useTestimonials();
 const [active,setActive]=useState('photos');
 useEffect(()=>{window.scrollTo(0,0);setActive('photos');},[slug]);
 useEffect(()=>{if(!project||!window.IntersectionObserver)return;const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length)setActive(visible[0].target.id);},{rootMargin:'-100px 0px -45% 0px',threshold:[0,.1,.5]});document.querySelectorAll('[data-project-section]').forEach(el=>observer.observe(el));return()=>observer.disconnect();},[project,credits.length]);
 if(loading)return <div className="pt-32 min-h-screen flex justify-center"><Loader2 className="animate-spin" aria-label="Loading project"/></div>;
 if(!project)return <div className="pt-32 px-6 pb-24"><h1 className="text-3xl">Project not found</h1><Link to="/projects">Explore projects</Link></div>;
 const media=project.media||{},visibility=project.tab_visibility||{},showMedia=project.media_visible!==false;
 const allImages=[...(project.image?[{url:project.image,alt:t(project.title)}]:[]),...(media.images||[]),...(project.gallery||[])];
 const seen=new Set();const images=showMedia?allImages.map(item=>typeof item==='string'?{url:item}:item).filter(item=>{if(!safeHref(item?.url)||seen.has(item.url))return false;seen.add(item.url);return true;}):[];
 const hero=safeHref(project.image)||images[0]?.url;
 const hasStory=visibility.story!==false&&(t(project.short_description)||(project.story?.paragraphs||[]).some(t)||t(project.story?.owner_quote));
 const hasDesign=visibility.design!==false&&(t(project.design?.intent)||project.design?.tags?.length);
 const hasDelivery=visibility.delivery!==false&&((project.delivery?.highlights||[]).some(t)||t(project.challenge)||t(project.approach_detail)||t(project.outcome_detail)||project.delivery?.septa_standards?.length);
 const clientQuotes=testimonials.filter(item=>item.project_ref===slug);
 const hasTeam=visibility.partners!==false&&credits.length>0;
 const hasExtras=showMedia&&(media.hero_video||media.owner_testimonial_video||media.model_3d||(media.plans_public&&media.plans?.length));
 const sections=[images.length&&['photos','Photos'],['overview','Overview'],hasDesign&&['design','Design'],hasDelivery&&['delivery','Delivery'],hasTeam&&['team','People'],clientQuotes.length>0&&['client-perspectives','Client perspective'],hasExtras&&['explore','Video & drawings']].filter(Boolean);
 const related=projects.filter(p=>p.slug!==slug&&(p.type===project.type||p.client_lens===project.client_lens)).slice(0,3);
 return <div className={`project-flow ${preview?'pt-28':'pt-16 lg:pt-[76px]'}`} data-testid="case-study-page">
 {preview&&<PreviewBanner type="project" slug={slug}/>}
 <div className="design-container py-5"><Link to={preview?'/admin':'/projects'} className="design-text-link" data-testid="back-to-projects-btn"><ArrowLeft size={14}/>{preview?'Back to admin':'All projects'}</Link></div>
 <header className={`project-opening ${hero?'has-photo':''}`}>{hero&&<img src={hero} alt={t(project.title)} fetchPriority="high"/>}<div className="project-opening-copy design-container"><p className="design-eyebrow">{project.type}{project.location&&` / ${project.location}`}</p><h1>{t(project.title)}</h1>{images.length>0&&<a className="project-photo-link glass-surface" href="#photos">View photos <ArrowUpRight size={16}/></a>}</div></header>
 <div className="design-container project-at-a-glance">{t(project.scope)&&<div className="project-scope mb-8"><p className="design-eyebrow">Septa Group · Our responsibility</p><p>{t(project.scope)}</p></div>}<div className="project-facts">{[['Location',project.location],['Area',project.sqft?`${project.sqft} sq.ft.`:''],['Year',project.year],['Status',project.project_status]].filter(([,value])=>value).map(([label,value])=><div key={label}><p className="design-eyebrow">{label}</p><p>{value}</p></div>)}</div>{hasTeam&&<CompactCredits credits={credits}/>}</div>
 <nav className="project-jump-nav" aria-label="Project sections" data-testid="project-sections"><div className="design-container">{sections.map(([id,label])=><a key={id} href={`#${id}`} aria-current={active===id?'location':undefined} onClick={()=>setActive(id)}>{label}</a>)}</div></nav>
 {images.length>0&&<section id="photos" data-project-section className="design-container project-flow-section motion-section"><h2 className="sr-only">Project photographs</h2><ImageGallery images={images} previewCount={4}/></section>}
 <section id="overview" data-project-section className="project-flow-section motion-section bg-white"><div className="design-container project-editorial"><div><p className="design-eyebrow">The project</p><h2>A closer look.</h2></div><div>{hasStory&&<>{t(project.short_description)&&<p className="project-lead">{t(project.short_description)}</p>}{(project.story?.paragraphs||[]).map((paragraph,i)=>t(paragraph)&&<p key={i}>{t(paragraph)}</p>)}{t(project.story?.owner_quote)&&<blockquote>{t(project.story.owner_quote)}</blockquote>}</>}{t(project.scope)&&<div className="project-scope"><h3>Septa’s scope</h3><p>{t(project.scope)}</p></div>}<dl className="project-facts">{[['Duration',project.duration],['Client type',project.client_type]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt className="design-eyebrow">{label}</dt><dd>{value}</dd></div>)}</dl></div></div></section>
 {hasDesign&&<section id="design" data-project-section className="project-flow-section motion-section"><div className="design-container project-editorial"><h2>Design intent.</h2><div>{t(project.design?.intent)&&<p>{t(project.design.intent)}</p>}<div className="project-tags">{(project.design?.tags||[]).map(tag=><span key={tag}>{tag}</span>)}</div></div></div></section>}
 {hasDelivery&&<section id="delivery" data-project-section className="project-flow-section motion-section bg-white"><div className="design-container project-editorial"><h2>How it came together.</h2><div>{[['The challenge',project.challenge,project.challenge_detail],['Our approach',project.approach_detail],['The outcome',project.outcome_detail]].map(([label,body,detail])=>t(body)&&<div className="delivery-note" key={label}><h3>{label}</h3><p>{t(body)}</p>{t(detail)&&<p>{t(detail)}</p>}</div>)}{project.delivery?.highlights?.length>0&&<ul className="delivery-highlights">{project.delivery.highlights.map((item,i)=>t(item)&&<li key={i}>{t(item)}</li>)}</ul>}{project.delivery?.septa_standards?.length>0&&<div className="project-tags">{project.delivery.septa_standards.map(item=><span key={item}>{item}</span>)}</div>}</div></div></section>}
 {hasTeam&&<section id="team" data-project-section className="project-flow-section motion-section"><div className="design-container"><div className="section-heading"><h2>The people behind the project.</h2><p className="section-description">The roles and contributions that brought this work together.</p></div>{credits.some(c=>c.entity_type==='leader')&&<div className="septa-delivery-team"><p className="design-eyebrow">Septa Group · Delivery team</p><h3 className="text-2xl mb-6">Our people responsible for delivery.</h3><ProjectCredits credits={credits.filter(c=>c.entity_type==='leader')}/></div>}{credits.some(c=>c.entity_type!=='leader')&&<><h3 className="text-2xl mb-6">Project collaborators</h3><ProjectCredits credits={credits.filter(c=>c.entity_type!=='leader')}/></>}</div></section>}
 {clientQuotes.length>0&&<section id="client-perspectives" data-project-section className="project-flow-section design-container"><h2 className="mb-8">From our clients.</h2><div className="testimonial-grid">{clientQuotes.map(item=><TestimonialCard key={item.id} item={item} project={project}/>)}</div></section>}
 {hasExtras&&<section id="explore" data-project-section className="project-flow-section motion-section bg-white" data-testid="case-study-media"><div className="design-container"><h2 className="mb-8">Explore the details.</h2><div className="project-extra-media">{media.hero_video&&<div><h3>Project film</h3><VideoPlayer src={media.hero_video} poster={hero} title={t(project.title)} className="aspect-video"/></div>}{media.owner_testimonial_video&&<div><h3>Client perspective</h3><VideoPlayer src={media.owner_testimonial_video} title="Client perspective" className="aspect-video"/></div>}{media.model_3d&&<div><h3>3D walkthrough</h3><Model3DViewer modelUrl={media.model_3d} fallbackVideoUrl={media.hero_video} posterImage={hero}/></div>}{media.plans_public&&media.plans?.length>0&&<div><h3>Approved drawings</h3><PlanDrawings plans={media.plans} plansPublic projectTitle={t(project.title)}/></div>}</div></div></section>}
 <section className="project-flow-section tone-dark"><div className="design-container"><h2 className="mb-6">Planning something similar?</h2><Link className="design-button" to={`/contact?project=${encodeURIComponent(slug)}`}>Discuss your project <ArrowUpRight size={16}/></Link></div></section>
 {related.length>0&&<section className="project-flow-section motion-section"><div className="design-container"><h2 className="mb-8">More work to explore.</h2><div className="selected-projects">{related.map(p=><ProjectCard key={p.slug} project={p} partners={partners} leaders={leaders}/>)}</div></div></section>}
 </div>;
}

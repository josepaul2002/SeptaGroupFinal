import TestimonialCard from './TestimonialCard';
import PartnerCard from './PartnerCard';
import ProjectCard from './ProjectCard';
import {contactLinks} from '../lib/contactLinks';
import CoverageGlobe from './CoverageGlobe';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Plus, MapPin, Building2, Home, Layers } from 'lucide-react';
import { useApiData, useProjects, useSiteSettings, usePartners, useTestimonials, getText } from '../hooks/useApi';
import { useLanguage } from './LanguageToggle';
import { safeHref, useSitePage } from '../lib/pageContent';
import './pageDesign.css';

export function ContentLink({to,children,className='',...props}) {
  const href=safeHref(to);
  if(!href)return null;
  return href.startsWith('/')?<Link to={href} className={className} {...props}>{children}</Link>:<a href={href} className={className} {...props}>{children}</a>;
}

export function ProjectMediaPlaceholder(){
  return <div className="project-media-placeholder"><span className="tech-label">Approved project media will appear here</span></div>;
}

export function PageHero({hero,compact=false,pageId}) {
  const {t}=useLanguage();
  const {data:projects}=useProjects();
  if(!hero)return null;
  const featured=pageId==='home'?projects.find(project=>project.slug===hero.featured_project_slug)||projects.find(project=>safeHref(project.image)):null;
  const imageUrl=safeHref(hero.image_url)||safeHref(featured?.image);
  const hasImage=!!imageUrl;
  const showArt=hero.layout!=='text'&&(hasImage||!compact);
  return <section className={`page-hero tone-${hero.theme||'light'} ${compact?'page-hero-compact':''} ${pageId==='home'?'page-hero-home':''}`}>
    <div className={`design-container hero-layout ${!showArt?'hero-text-only':''}`}>
      <div className="hero-copy"><p className="design-eyebrow">{t(hero.eyebrow)}</p><h1>{t(hero.title)}</h1>{t(hero.body)&&<p className="hero-description">{t(hero.body)}</p>}<div className="design-actions"><ContentLink className="design-button" to={hero.primary_url}>{t(hero.primary_label)}<ArrowUpRight size={17}/></ContentLink><ContentLink className="design-text-link" to={hero.secondary_url}>{t(hero.secondary_label)}<ArrowRight size={16}/></ContentLink></div></div>
      {showArt&&<div className="hero-art">{hasImage?<img src={imageUrl} alt={hero.image_alt||t(featured?.title)||''} style={{objectPosition:hero.image_position||'center'}} fetchPriority="high"/>:pageId==='home'?<ProjectMediaPlaceholder/>:<div className="brand-media-placeholder" aria-hidden="true"><img src="/septa-logo.png" alt=""/></div>}</div>}
    </div>
  </section>;
}

export function ManagedIntro({pageId}) {
  const {page}=useSitePage(pageId);
  return <><PageHero hero={page.hero} compact pageId={pageId}/><PageSections sections={page.sections}/></>;
}

function SectionHeading({section}) {
  const {t}=useLanguage();
  return <div className="section-heading"><div><p className="design-eyebrow">{t(section.eyebrow)}</p><h2>{t(section.title)}</h2></div>{t(section.body)&&<p className="section-description">{t(section.body)}</p>}</div>;
}
function SectionShell({section,children,className=''}) {
  return <section id={section.id} className={`design-section motion-section tone-${section.theme||'light'} ${className}`}><div className="design-container"><SectionHeading section={section}/>{children}</div></section>;
}

function CapabilityCards({section}) {
  const {page:services}=useSitePage('services');
  const {t}=useLanguage();
  const items=section.source==='services'?services.sections.filter(s=>s.enabled!==false&&s.type==='cards'&&s.source!=='services').flatMap(s=>s.items||[]).slice(0,section.limit||3):section.items||[];
  if(!items.length)return null;
  return <SectionShell section={section}><div className="capability-grid">{items.map((item,i)=><article className="capability-card" key={item.id}><div className="card-topline"><span className="design-eyebrow">{String(i+1).padStart(2,'0')}</span>{item.image_url?<img loading="lazy" src={safeHref(item.image_url)} alt={item.image_alt||''}/>:<div className="capability-symbol" aria-hidden="true">{i%3===0?<Building2 size={20} strokeWidth={1.5}/>:i%3===1?<Home size={20} strokeWidth={1.5}/>:<Layers size={20} strokeWidth={1.5}/>}</div>}</div><h3>{t(item.title)}</h3>{t(item.subtitle)&&<p className="design-eyebrow">{t(item.subtitle)}</p>}<p>{t(item.body)}</p><ContentLink className="design-text-link" to={item.link_url||(item.tag?`/projects?type=${encodeURIComponent(item.tag)}`:'/contact')}>{t(item.link_label)||'Explore'}<ArrowUpRight size={16}/></ContentLink></article>)}</div></SectionShell>;
}

function ProjectSelection({section}) {
  const {data:projects}=useProjects(),{data:partners}=usePartners(),{data:leaders}=useApiData('/leaders',[]);
  const {t}=useLanguage();
  let selected=section.selected_slugs?.length?section.selected_slugs.map(slug=>projects.find(p=>p.slug===slug)).filter(Boolean):projects;
  if(section.project_type)selected=selected.filter(p=>p.type===section.project_type);
  selected=selected.slice(0,section.limit||3);
  if(!selected.length)return null;
  return <SectionShell section={section}><div className="selected-projects">{selected.map(p=><ProjectCard key={p.slug} project={p} partners={partners} leaders={leaders}/>)}</div><ContentLink to={section.link_url||'/projects'} className="design-text-link section-end-link">{t(section.link_label)||'Explore all projects'}<ArrowUpRight size={16}/></ContentLink></SectionShell>;
}
function Collaborators({section}){
 const {data:partners}=usePartners(),{data:projects}=useProjects();
 const selected=section.selected_slugs?.length?section.selected_slugs.map(slug=>partners.find(p=>p.slug===slug)).filter(Boolean):[...partners].sort((a,b)=>Number(!!b.is_featured)-Number(!!a.is_featured));
 if(!selected.length)return null;
 return <SectionShell section={section}><div className="collaborator-grid">{selected.slice(0,section.limit||3).map(partner=><PartnerCard key={partner.slug} partner={partner} projects={projects}/>)}</div><ContentLink to={section.link_url||'/ecosystem'} className="design-text-link section-end-link">{getText(section.link_label)||'Meet our collaborators'}<ArrowUpRight size={16}/></ContentLink></SectionShell>;
}
function SharedCoverage({section}){
 const {page}=useSitePage('about');
 const source=page.sections.find(s=>s.type==='locations'&&s.enabled!==false);
 if(!source)return null;
 return <Coverage section={{...source,...section,items:source.items,image_url:source.image_url,image_alt:source.image_alt,graphic_label:source.graphic_label}}/>;
}
function ContactSection({section}){
 const {settings}=useSiteSettings(),links=contactLinks(settings?.contact,'Hello Septa, I would like to discuss a project.'),{t}=useLanguage();
 return <SectionShell section={section} className="cta-section"><div className="cta-contact-actions">{links.call&&<a href={links.call} className="design-button">Call Septa</a>}{links.whatsapp&&<a href={links.whatsapp} className="design-button" target="_blank" rel="noreferrer">WhatsApp</a>}<ContentLink className="design-text-link" to={section.link_url||'/contact'}>{t(section.link_label)||'Request a callback'}<ArrowUpRight size={18}/></ContentLink></div></SectionShell>;
}

function Coverage({section}) {
  const {settings}=useSiteSettings();
  const {data:projects}=useProjects();
  const {t}=useLanguage();
  const [selected,setSelected]=useState(null);
  const items=section.items?.length?section.items:(settings?.contact?.operating_districts||[]).map((name,i)=>({id:`district-${i}`,title:{en:name},body:{en:''},tag:name}));
  const active=items.find(i=>i.id===selected)||items[0];
  const related=active&&active.tag?projects.filter(p=>(p.location||'').toLowerCase().includes(active.tag.toLowerCase())).slice(0,2):[];
  return <SectionShell section={section} className="coverage-section"><div className="coverage-layout"><div className="coverage-art">{section.image_url?<img src={safeHref(section.image_url)} alt={section.image_alt||''} loading="lazy"/>:<CoverageGlobe items={items} active={active} t={t}/>}<span className="coverage-caption">{t(section.graphic_label)||'Operating areas'}</span></div><div className="coverage-detail">{items.length>0?<><div className="location-options" aria-label="Operating areas">{items.map(item=><button key={item.id} onClick={()=>setSelected(item.id)} aria-pressed={active?.id===item.id} className={active?.id===item.id?'active':''}>{t(item.title)}<ArrowUpRight size={15}/></button>)}</div><div className="location-description" aria-live="polite"><h3>{t(active?.title)}</h3><p>{t(active?.body)}</p>{related.map(p=><Link key={p.slug} to={`/projects/${p.slug}`} className="design-text-link">{t(p.title)}<ArrowUpRight size={15}/></Link>)}<ContentLink to={active?.link_url||'/contact'} className="design-text-link">{t(active?.link_label)||'Discuss a project here'}<ArrowRight size={15}/></ContentLink></div></>:<div className="location-description"><h3>{t(section.graphic_label)||'Your project location'}</h3><ContentLink to={section.link_url||'/contact'} className="design-text-link">{t(section.link_label)||'Ask about your project location'}<ArrowUpRight size={16}/></ContentLink></div>}</div></div></SectionShell>;
}

function People({section}) {
  const {data}=useApiData('/leaders',[]);
  const {t}=useLanguage();
  const selected=(section.selected_slugs?.length?section.selected_slugs.map(slug=>data.find(p=>p.slug===slug)).filter(Boolean):data).slice(0,section.limit||3);
  if(!selected.length)return null;
  return <SectionShell section={section}><div className="people-grid">{selected.map(p=><Link key={p.slug} to={`/project-leaders/${p.slug}`} className="person-card">{p.photo?<img src={safeHref(p.photo)} alt={t(p.name)} loading="lazy"/>:<div className="person-initial">{t(p.name).slice(0,1)}</div>}<h3>{t(p.name)}</h3><p>{t(p.title)}</p><ArrowUpRight size={18}/></Link>)}</div></SectionShell>;
}
function Testimonials({section}) {
  const {data}=useTestimonials(),{data:projects}=useProjects();
  const {t}=useLanguage();
  const selected=(section.selected_slugs?.length?section.selected_slugs.map(id=>data.find(p=>(p.id||p.slug)===id)).filter(Boolean):data).slice(0,section.limit||1);
  if(!selected.length)return null;
  return <SectionShell section={section}><div className="testimonial-grid">{selected.map((item,i)=>{const project=projects.find(p=>p.slug===item.project_ref);return <TestimonialCard key={item.id||i} item={item} project={project}/>;})}</div></SectionShell>;
}

export function PageSection({section}) {
  const {t}=useLanguage();
  if(section.enabled===false)return null;
  if(section.type==='cards')return <CapabilityCards section={section}/>;
  if(section.type==='projects')return <ProjectSelection section={section}/>;
  if(section.type==='locations')return section.source==='about'?<SharedCoverage section={section}/>:<Coverage section={section}/>;
  if(section.type==='collaborators')return <Collaborators section={section}/>;
  if(section.type==='people')return <People section={section}/>;
  if(section.type==='testimonials')return <Testimonials section={section}/>;
  if(section.type==='cta')return <ContactSection section={section}/>;
  if(section.type==='text')return <SectionShell section={section} className="editorial-section">{section.image_url&&<img className="editorial-image" src={safeHref(section.image_url)} alt={section.image_alt||''} loading="lazy"/>}<ContentLink to={section.link_url} className="design-text-link">{t(section.link_label)}<ArrowRight size={16}/></ContentLink></SectionShell>;
  if(!section.items?.length)return null;
  return <SectionShell section={section}>{section.type==='faq'?<div className="faq-list">{section.items.map(item=><details key={item.id}><summary>{t(item.title)}<Plus size={18}/></summary><p>{t(item.body)}</p></details>)}</div>:<div className={section.type==='stats'?'stats-grid':'process-grid'}>{section.items.map((item,i)=><article key={item.id}>{section.type==='process'&&<span className="process-number">{String(i+1).padStart(2,'0')}</span>}<h3>{t(item.title)}</h3><p>{t(item.subtitle)}</p><p>{t(item.body)}</p><ContentLink to={item.link_url} className="design-text-link">{t(item.link_label)}<ArrowUpRight size={15}/></ContentLink></article>)}</div>}</SectionShell>;
}
export function PageSections({sections=[]}) {return sections.map(section=><PageSection section={section} key={section.id}/>);}

export function DesignedPage({pageId}) {
  const {page,preview,error}=useSitePage(pageId);
  const {pathname}=useLocation();
  useEffect(()=>{window.scrollTo(0,0);},[pathname]);
  return <div className="designed-page" data-testid={`${pageId}-page`}>{preview&&<div className="design-preview-banner">Saved draft preview · Only visible to signed-in editors. <Link to="/admin">Back to admin</Link>{error&&<p role="alert">Draft could not load. Showing the default layout.</p>}</div>}<PageHero hero={page.hero} pageId={pageId}/><PageSections sections={page.sections}/></div>;
}

import {safeHref} from './safeHref';
export function homepageSlides(hero={},projects=[]){
 const available=projects.filter(p=>p.status==='published'&&p.publication_reviewed!==false);
 const marked=available.filter(p=>p.homepage_feature?.enabled).sort((a,b)=>(a.homepage_feature?.order||0)-(b.homepage_feature?.order||0));
 const fromProject=p=>({project_slug:p.slug,image_url:(p.homepage_feature?.use_video?safeHref(p.media?.hero_poster):'')||safeHref(p.image),video_url:p.homepage_feature?.use_video?safeHref(p.media?.hero_video):'',image_alt:''});
 if(marked.length)return marked.map(fromProject).filter(s=>s.image_url||s.video_url).slice(0,6);
 const manual=(hero.slides||[]).filter(s=>!s.project_slug||available.some(p=>p.slug===s.project_slug)).map(s=>{const p=available.find(p=>p.slug===s.project_slug);return {...s,image_url:safeHref(s.image_url)||safeHref(p?.image),video_url:safeHref(s.video_url)};}).filter(s=>s.image_url||s.video_url);
 if(manual.length)return manual.slice(0,6);
 const ordered=[...available].sort((a,b)=>Number(b.slug===hero.featured_project_slug)-Number(a.slug===hero.featured_project_slug));
 if(hero.image_url||hero.video_url){const first={image_url:safeHref(hero.image_url),video_url:safeHref(hero.video_url),image_alt:hero.image_alt,project_slug:hero.featured_project_slug||''};return [first,...ordered.filter(p=>p.slug!==first.project_slug).map(fromProject)].filter(s=>s.image_url||s.video_url).slice(0,6);}
 return ordered.map(fromProject).filter(s=>s.image_url||s.video_url).slice(0,6);
}

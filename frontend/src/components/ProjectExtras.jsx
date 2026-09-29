import {useState} from 'react';
import VideoPlayer from './VideoPlayer';
import Model3DViewer from './Model3DViewer';
import ImageGallery from './ImageGallery';
import PlanDrawings from './PlanDrawings';
import {safeHref} from '../lib/pageContent';

export default function ProjectExtras({media,hero,title}) {
 const options=[media.hero_video&&['film','Project film'],media.owner_testimonial_video&&['client','Client film'],media.plans_public&&media.plans?.length&&['plans','Approved drawings'],media.renders_3d?.length&&['renders','3D visuals'],media.tour_public&&(media.virtual_tour_url||media.model_3d)&&['tour','Explore the space']].filter(Boolean);
 const [selected,setSelected]=useState(options[0]?.[0]),[showModel,setShowModel]=useState(false);
 if(!options.length)return null;
 const current=options.some(([id])=>id===selected)?selected:options[0][0];
 return <div className="project-media-selector"><div className="project-media-options" aria-label="Choose project media">{options.map(([id,label])=><button type="button" key={id} aria-pressed={id===current} aria-controls="project-selected-media" onClick={()=>{setSelected(id);setShowModel(false);}}>{label}</button>)}</div><div id="project-selected-media" className="project-selected-media">
 {current==='film'&&<VideoPlayer src={media.hero_video} poster={safeHref(media.hero_poster)||hero} title={`${title} project film`} className="aspect-video"/>}
 {current==='client'&&<VideoPlayer src={media.owner_testimonial_video} title="Client perspective" className="aspect-video"/>}
 {current==='plans'&&<PlanDrawings plans={media.plans} plansPublic projectTitle={title}/>}
 {current==='renders'&&<><p className="text-sm text-[#606060] mb-4">Concept imagery; not photographs of completed work.</p><ImageGallery images={media.renders_3d} previewCount={3}/></>}
 {current==='tour'&&<div className="project-tour space-y-5">{safeHref(media.virtual_tour_url)?.startsWith('https://')&&<a className="design-button" href={safeHref(media.virtual_tour_url)} target="_blank" rel="noopener noreferrer">{media.virtual_tour_label||'Open 360° tour'} ↗</a>}{media.model_3d&&<><button type="button" className="design-text-link" onClick={()=>setShowModel(v=>!v)}>{showModel?'Close 3D model':'Open interactive 3D model'}</button>{showModel&&<Model3DViewer modelUrl={media.model_3d} posterImage={hero}/>}</>}</div>}
 </div></div>;
}

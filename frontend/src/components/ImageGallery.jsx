import ResponsiveImage from './ResponsiveImage';
import {useEffect,useRef,useState} from 'react';
import {X,ChevronLeft,ChevronRight,ZoomIn} from 'lucide-react';
import {safeHref} from '../lib/pageContent';
import {getText} from '../hooks/useApi';
export default function ImageGallery({images=[],className='',previewCount}){
 const items=images.map(item=>typeof item==='string'?{url:item}:item).filter(item=>safeHref(item?.url));
 const [open,setOpen]=useState(false),[index,setIndex]=useState(0),dialog=useRef(null),trigger=useRef(null),touch=useRef(null);
 const count=items.length,current=items[index%count];
 const show=(i,event)=>{trigger.current=event.currentTarget;setIndex(i);setOpen(true);};
 useEffect(()=>{
  if(!open||!count||!dialog.current)return;
  const node=dialog.current,previous=document.body.style.overflow;document.body.style.overflow='hidden';
  if(node.showModal)node.showModal();else node.setAttribute('open','');
  const keys=e=>{if(e.key==='ArrowRight'){e.preventDefault();setIndex(i=>(i+1)%count);}if(e.key==='ArrowLeft'){e.preventDefault();setIndex(i=>(i-1+count)%count);}if(e.key==='Escape'){e.preventDefault();setOpen(false);}};
  document.addEventListener('keydown',keys);
  return()=>{document.removeEventListener('keydown',keys);document.body.style.overflow=previous;if(node.close)node.close();trigger.current?.focus();};
 },[open,count]);
 useEffect(()=>{if(!count)setOpen(false);},[count]);
 if(!count)return null;
 return <><div className="gallery-toolbar"><p className="tech-label">{count} photograph{count===1?'':'s'}</p><button type="button" className="design-text-link" onClick={e=>show(0,e)}>View all photos <ZoomIn size={15}/></button></div><div className={`image-gallery-grid ${className}`} data-testid="image-gallery">{items.slice(0,previewCount||count).map((item,i)=><button type="button" key={`${item.url}-${i}`} onClick={e=>show(i,e)} className="gallery-thumbnail" data-testid={`gallery-image-${i}`} aria-label={`Open photograph ${i+1}: ${item.alt||getText(item.caption)||'Project photo'}`}><ResponsiveImage src={item.url} alt={item.alt||getText(item.caption)||`Project photograph ${i+1}`} loading="lazy"/><span className="gallery-zoom glass-surface"><ZoomIn size={16}/>{previewCount&&i===previewCount-1&&count>previewCount?`+${count-previewCount}`:''}</span></button>)}</div>
 {open&&<dialog ref={dialog} className="gallery-dialog" aria-label="Project photographs" data-testid="lightbox" onCancel={e=>{e.preventDefault();setOpen(false);}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}><div className="gallery-dialog-toolbar glass-surface"><span aria-live="polite">{index%count+1} / {count}</span><button type="button" aria-label="Close photographs" autoFocus onClick={()=>setOpen(false)} data-testid="lightbox-close"><X size={22}/></button></div><figure onTouchStart={e=>{touch.current=e.touches.length===1?e.touches[0].clientX:null;}} onTouchEnd={e=>{if(touch.current!=null){const delta=e.changedTouches[0].clientX-touch.current;if(Math.abs(delta)>60)setIndex(i=>(i+(delta<0?1:-1)+count)%count);}touch.current=null;}}><ResponsiveImage key={current.url} src={current.url} alt={current.alt||getText(current.caption)||`Project photograph ${index%count+1}`}/><figcaption>{getText(current.caption)}{current.credit&&<span>Photo: {current.credit}</span>}</figcaption></figure>{count>1&&<><button type="button" className="gallery-previous glass-surface" aria-label="Previous photograph" onClick={()=>setIndex(i=>(i-1+count)%count)} data-testid="lightbox-prev"><ChevronLeft/></button><button type="button" className="gallery-next glass-surface" aria-label="Next photograph" onClick={()=>setIndex(i=>(i+1)%count)} data-testid="lightbox-next"><ChevronRight/></button></>}</dialog>}</>;
}

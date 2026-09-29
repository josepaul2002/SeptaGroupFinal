import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import MediaDialog from '../components/MediaDialog';
import {mediaRules,validateMediaRatio} from './mediaRules';

function CropEditor({file,field,finish}) {
 const [mode,setMode]=useState(['logo_image','public_plan'].includes(field)?'pad':'crop'),[x,setX]=useState(50),[y,setY]=useState(50),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const canvas=useRef(null),source=useRef(null);
 const [ratio,name,min,preferred]=mediaRules[field]||mediaRules.page_image;
 useEffect(()=>{const url=URL.createObjectURL(file),img=new Image();source.current=img;img.onload=()=>setLoaded(true);img.onerror=()=>setError('This image could not be opened. Try JPG, PNG or WebP.');img.src=url;return()=>{img.onload=null;URL.revokeObjectURL(url);};},[file]);
 useEffect(()=>{if(!loaded)return;const img=source.current,node=canvas.current;node.width=Math.max(min,Math.min(parseInt(preferred,10),img.naturalWidth));node.height=Math.round(node.width/ratio);const ctx=node.getContext('2d');ctx.clearRect(0,0,node.width,node.height);if(field!=='logo_image'){ctx.fillStyle='#F6F6F3';ctx.fillRect(0,0,node.width,node.height);}const scale=(mode==='crop'?Math.max:Math.min)(node.width/img.naturalWidth,node.height/img.naturalHeight);const width=img.naturalWidth*scale,height=img.naturalHeight*scale;ctx.drawImage(img,(node.width-width)*x/100,(node.height-height)*y/100,width,height);},[loaded,ratio,min,preferred,mode,x,y,field]);
 const apply=()=>canvas.current.toBlob(blob=>{if(!blob){setError('Could not prepare this image.');return;}finish(new File([blob],file.name.replace(/\.[^.]+$/,'')+(field==='logo_image'?'.png':'.webp'),{type:blob.type}));},field==='logo_image'?'image/png':'image/webp',.92);
 return <MediaDialog label="Fit image to its required frame" className="media-crop-dialog" onClose={()=>finish(null)}><h2 className="text-2xl mb-3">Fit to {name}</h2><p className="text-sm mb-4">Choose the framing before uploading. Your original file is unchanged. Padding keeps the whole image; cropping removes edges. No AI alterations are made.</p><canvas ref={canvas} aria-label="Preview of the framed image"/><label>Framing<select className="form-input text-black" value={mode} onChange={e=>setMode(e.target.value)}><option value="crop">Crop to fill the frame</option><option value="pad">Keep whole image with padding</option></select></label><label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={e=>setX(Number(e.target.value))}/></label><label>Vertical position<input type="range" min="0" max="100" value={y} onChange={e=>setY(Number(e.target.value))}/></label>{field==='logo_image'&&<p className="text-sm">Padding is transparent. A background already inside the source logo is not automatically removed.</p>}{error&&<p role="alert">{error}</p>}<div className="flex gap-5 mt-5"><button className="border px-5 py-3" disabled={!loaded} onClick={apply}>Use this framing</button><button className="px-5 py-3" onClick={()=>finish(null)}>Cancel upload</button></div></MediaDialog>;
}

export async function prepareMediaFile(file,field) {
 const issue=await validateMediaRatio(file,field);
 if(!issue)return file;
 if(!file.type.startsWith('image/')||file.type==='image/gif'||!issue.includes('required.'))throw new Error(issue);
 return new Promise((resolve,reject)=>{const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);const finish=value=>{queueMicrotask(()=>{root.unmount();host.remove();});if(value)resolve(value);else reject(new Error('Upload cancelled. No file was uploaded.'));};root.render(<CropEditor file={file} field={field} finish={finish}/>);});
}

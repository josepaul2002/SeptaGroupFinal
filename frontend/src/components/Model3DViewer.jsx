import { useEffect, useRef, useState } from 'react';
import { Box, Loader2 } from 'lucide-react';
import { modelSource } from '../lib/modelSource';
import { safeHref } from '../lib/pageContent';

let rendererPromise;
function loadRenderer() {
  if (window.customElements?.get('model-viewer')) return Promise.resolve();
  if (!rendererPromise) rendererPromise = new Promise((resolve,reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js';
    const timer = setTimeout(() => fail(), 15000);
    const fail = () => { clearTimeout(timer); script.remove(); rendererPromise = null; reject(new Error('Renderer unavailable')); };
    script.onerror = fail;
    script.onload = () => { clearTimeout(timer); window.customElements.whenDefined('model-viewer').then(resolve); };
    document.head.appendChild(script);
  });
  return rendererPromise;
}

export default function Model3DViewer({modelUrl, fallbackVideoUrl, posterImage, className=''}) {
  const source = modelSource(modelUrl);
  const [state,setState] = useState('idle'), [attempt,setAttempt] = useState(0);
  const viewer = useRef(null);
  const type=source?.type, src=source?.src, idle=state==='idle';
  useEffect(() => { setState('idle'); }, [modelUrl]);
  useEffect(() => {
    if (state !== 'loading') return;
    let active = true;
    const timer = setTimeout(() => active && setState('slow'), 20000);
    if (type === 'file') loadRenderer().catch(() => active && setState('error'));
    return () => { active=false; clearTimeout(timer); };
  }, [state,type,attempt]);
  useEffect(() => {
    const node = viewer.current;
    if (!node) return;
    const loaded=()=>setState('ready'), failed=()=>setState('error');
    node.addEventListener('load',loaded); node.addEventListener('error',failed);
    return ()=>{node.removeEventListener('load',loaded);node.removeEventListener('error',failed);};
  }, [idle,src,attempt]);
  if (!modelUrl && !fallbackVideoUrl) return null;
  const open = state !== 'idle' && source;
  return <div className={`bg-[#050505] text-white ${className}`} data-testid="model-3d-viewer">
    <div className="relative aspect-video overflow-hidden">
      {!open && <>{posterImage&&<img src={safeHref(posterImage)} alt="Project model preview" className="w-full h-full object-cover opacity-50"/>}<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Box size={32} strokeWidth={1}/>{source ? <button type="button" className="px-6 py-3 bg-white text-black text-sm" data-testid="view-3d-btn" onClick={()=>setState('loading')}>Explore in 3D</button> : <p className="text-sm">3D preview is unavailable for this address.</p>}
      </div></>}
      {open && type === 'sketchfab' && <iframe key={attempt} title="Interactive project model — Sketchfab" src={src} allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full border-0" onLoad={()=>setState('ready')} onError={()=>setState('error')}/>}
      {open && type === 'file' && <model-viewer key={attempt} ref={viewer} src={src} poster={safeHref(posterImage)} alt="Interactive project model" camera-controls="" touch-action="pan-y" style={{width:'100%',height:'100%',background:'#050505'}}/>}
      {state==='loading' && <div className="absolute top-3 left-3 flex gap-2 items-center bg-black/80 px-3 py-2 text-xs pointer-events-none" role="status"><Loader2 size={14} className="animate-spin"/>Opening 3D…</div>}
    </div>
    <div className="p-4 flex flex-wrap items-center gap-4 text-xs text-white/70">
      {(state==='slow'||state==='error') && <p role="status" className="w-full">{state==='slow'?'This model is taking longer than expected. You can keep waiting or open it directly.':'The model could not load. Check the link or try opening it directly.'}</p>}
      {source && <a href={source.external} target="_blank" rel="noopener noreferrer" className="underline">{type==='sketchfab'?'Open on Sketchfab ↗':'Open model file ↗'}</a>}
      {safeHref(fallbackVideoUrl) && <a href={safeHref(fallbackVideoUrl)} target="_blank" rel="noopener noreferrer" className="underline">Watch project video ↗</a>}
      {open && <><button type="button" className="underline" onClick={()=>{setAttempt(a=>a+1);setState('loading');}}>Reload viewer</button><button type="button" className="ml-auto underline" onClick={()=>setState('idle')}>Close 3D</button></>}
      {open&&type==='sketchfab'&&<p className="w-full">Drag to explore. If the model is private or embedding is disabled, open it on Sketchfab.</p>}
    </div>
  </div>;
}

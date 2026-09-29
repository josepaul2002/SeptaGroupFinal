import {useEffect,useState} from 'react';
import {Play} from 'lucide-react';
import {safeHref} from '../lib/pageContent';

export function videoEmbed(src) {
  try {
    const url=new URL(src);
    if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(url.hostname)){
      const id=/^\/(shorts|embed)\//.test(url.pathname)?url.pathname.split('/')[2]:url.searchParams.get('v');
      if(/^[\w-]{11}$/.test(id||''))return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if(['youtu.be','www.youtu.be'].includes(url.hostname)&&/^[\w-]{11}$/.test(url.pathname.slice(1)))return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(url.hostname)){
      const id=url.pathname.match(/(?:\/video)?\/(\d+)/)?.[1];
      if(id)return `https://player.vimeo.com/video/${id}${url.searchParams.get('h')?'?h='+encodeURIComponent(url.searchParams.get('h')):''}`;
    }
  } catch {}
  return null;
}

export default function VideoPlayer({src,poster,title='Video',className='',autoPlay=false,tracks=[]}) {
  const [started,setStarted]=useState(autoPlay),[failed,setFailed]=useState(false);
  useEffect(()=>{setStarted(autoPlay);setFailed(false);},[src,autoPlay]);
  const safe=safeHref(src),embed=videoEmbed(safe);
  if(!safe)return null;
  return <div className={`video-player bg-black relative ${className}`} data-testid="video-player">
    {embed&&!started?<button type="button" className="video-start" aria-label={`Play ${title}`} onClick={()=>setStarted(true)}>{poster&&<img src={safeHref(poster)} alt="" loading="lazy"/>}<span><Play size={28}/>Play {title}</span></button>:embed?<iframe src={`${embed}${embed.includes('?')?'&':'?'}autoplay=1&playsinline=1`} title={title} className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<video key={safe} src={safe} poster={safeHref(poster)||undefined} aria-label={title} className="w-full h-full object-contain" controls playsInline preload="metadata" autoPlay={autoPlay} muted={autoPlay} onError={()=>setFailed(true)}>{tracks.map(track=><track key={track.src} kind="captions" src={safeHref(track.src)} srcLang={track.lang||'en'} label={track.label||'English'} default={!!track.default}/>)}</video>}
    {failed&&<p role="alert" className="p-4 text-sm text-white bg-black">This video could not be played. Check the file or try opening it directly.</p>}
    <a className="video-external" href={safe} target="_blank" rel="noopener noreferrer">Open video separately ↗</a>
  </div>;
}

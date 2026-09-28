import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
export default function HashNavigation(){
 const {pathname,hash}=useLocation();
 useEffect(()=>{
  if(!hash)return;
  let id;try{id=decodeURIComponent(hash.slice(1));}catch{return;}
  let observer,timer;
  const jump=()=>{const el=document.getElementById(id);if(!el)return false;el.scrollIntoView?.({behavior:document.documentElement.dataset.motion==='off'?'auto':'smooth',block:'start'});observer?.disconnect();return true;};
  const frame=requestAnimationFrame(()=>{if(!jump()){observer=new MutationObserver(jump);observer.observe(document.body,{childList:true,subtree:true});timer=setTimeout(()=>observer.disconnect(),8000);}});
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();clearTimeout(timer);};
 },[pathname,hash]);
 return null;
}

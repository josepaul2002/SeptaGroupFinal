import {createContext,useContext,useEffect,useState} from 'react';
import {useSiteSettings} from '../hooks/useApi';
const MotionContext=createContext({mode:'off',globe:false,glass:true});
export const useMotion=()=>useContext(MotionContext);
export default function MotionProvider({children}){
 const {settings}=useSiteSettings(),appearance=settings?.appearance||{};
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');setReduced(mq.matches);const change=e=>setReduced(e.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change);},[]);
 const mode=reduced?'off':['off','subtle','expressive'].includes(appearance.motion)?appearance.motion:'subtle';
 const glass=appearance.header_glass!==false,globe=mode!=='off'&&appearance.globe_animation!==false;
 useEffect(()=>{document.documentElement.dataset.motion=mode;document.documentElement.dataset.glass=String(glass);document.documentElement.dataset.contactBar=String(appearance.mobile_contact_bar!==false);},[mode,glass,appearance.mobile_contact_bar]);
 useEffect(()=>{
  if(mode==='off'||!window.IntersectionObserver)return;
  const seen=new WeakSet();
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('motion-enter');observer.unobserve(entry.target);}}),{threshold:.08});
  const scan=()=>document.querySelectorAll('.motion-section,.reveal,.hero-copy').forEach(el=>{if(!seen.has(el)){seen.add(el);observer.observe(el);}});
  scan();const mutations=new MutationObserver(scan);mutations.observe(document.body,{childList:true,subtree:true});
  return()=>{observer.disconnect();mutations.disconnect();};
 },[mode]);
 return <MotionContext.Provider value={{mode,glass,globe}}>{children}</MotionContext.Provider>;
}

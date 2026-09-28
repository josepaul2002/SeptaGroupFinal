import {useEffect,useState} from 'react';
import { DesignedPage } from '../components/PageSections';
export default function HomePage(){
 const [intro,setIntro]=useState(()=>!sessionStorage.getItem('septa-welcomed')&&!(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
 useEffect(()=>{if(!intro)return;const timer=window.setTimeout(()=>{sessionStorage.setItem('septa-welcomed','1');setIntro(false);},1050);return()=>clearTimeout(timer);},[intro]);
 const dismiss=()=>{sessionStorage.setItem('septa-welcomed','1');setIntro(false);};
 return <>{intro&&<div className="septa-welcome" role="status" aria-label="Welcome to Septa Group" onClick={dismiss}><span>SEPTA GROUP</span><small>Built with purpose.</small><button type="button" onClick={dismiss} aria-label="Skip introduction">Skip ↗</button></div>}<DesignedPage pageId="home"/></>;
}

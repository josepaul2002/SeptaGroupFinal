import {useMotion} from './MotionProvider';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

// Simplified original continent outlines for an illustrative, low-bandwidth globe.
// These are decorative land silhouettes, not operating-area boundaries.
const LAND = [
  [[-168,70],[-140,70],[-125,58],[-125,49],[-117,32],[-100,16],[-84,10],[-80,24],[-66,45],[-54,52],[-64,62],[-100,73]],
  [[-80,10],[-60,7],[-48,-2],[-35,-8],[-42,-23],[-56,-40],[-69,-55],[-76,-30],[-81,-5]],
  [[-54,59],[-25,63],[-20,80],[-45,84],[-65,75]],
  [[-17,35],[10,37],[32,31],[43,12],[51,11],[42,-13],[32,-30],[18,-35],[10,-20],[0,5],[-16,14]],
  [[-10,36],[-10,44],[2,50],[8,58],[20,71],[42,68],[65,72],[100,76],[140,70],[177,64],[160,50],[140,45],[129,32],[120,22],[109,20],[108,8],[101,1],[98,12],[90,22],[81,8],[76,8],[69,23],[56,26],[44,13],[35,29],[28,40],[14,41]],
  [[112,-11],[135,-12],[145,-20],[153,-28],[146,-39],[130,-34],[114,-35]],
  [[47,-13],[50,-18],[47,-26],[44,-23]], [[130,31],[141,42],[145,44],[141,35]],
  [[95,5],[108,-7],[119,-9],[115,-3]], [[166,-35],[179,-38],[170,-47]]
];
function inside(x,y,p) { let hit=false; for(let i=0,j=p.length-1;i<p.length;j=i++) {const [a,b]=p[i],[c,d]=p[j];if(((b>y)!==(d>y))&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit; }
const DOTS=[];
for(let lat=-55;lat<=80;lat+=3.5)for(let lon=-180;lon<180;lon+=3.5)if(LAND.some(p=>inside(lon,lat,p)))DOTS.push([lat,lon]);
const DISTRICTS = {kasaragod:[12.50,74.99],kannur:[11.87,75.37],wayanad:[11.69,76.13],kozhikode:[11.26,75.78],calicut:[11.26,75.78],malappuram:[11.07,76.07],palakkad:[10.79,76.65],thrissur:[10.53,76.21],ernakulam:[9.98,76.30],kochi:[9.93,76.27],idukki:[9.92,77.10],kottayam:[9.59,76.52],alappuzha:[9.50,76.34],pathanamthitta:[9.26,76.79],kollam:[8.89,76.61],thiruvananthapuram:[8.52,76.94],trivandrum:[8.52,76.94]};
function coordinates(item,t) {
  if(Number.isFinite(item?.latitude)&&Number.isFinite(item?.longitude)) return [item.latitude,item.longitude];
  const name=(item?.tag||t(item?.title)||'').trim().toLowerCase();
  return DISTRICTS[name];
}
function project(lat,lon,centre) {
  const r=Math.PI/180,p=lat*r,d=(lon-centre)*r,tilt=18*r;
  return {x:250+177*Math.cos(p)*Math.sin(d),y:218-177*(Math.cos(tilt)*Math.sin(p)-Math.sin(tilt)*Math.cos(p)*Math.cos(d)),z:Math.sin(tilt)*Math.sin(p)+Math.cos(tilt)*Math.cos(p)*Math.cos(d)};
}
export default function CoverageGlobe({items,active,t}) {
  const {globe:motionAllowed}=useMotion();
  const id=useId().replace(/:/g,''),root=useRef(null);
  const [angle,setAngle]=useState(62),[paused,setPaused]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false);
  const activePoint=coordinates(active,t);
  const activeLat=activePoint?.[0],activeLon=activePoint?.[1];
  useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');setReduced(mq.matches);const fn=e=>setReduced(e.matches);mq.addEventListener('change',fn);return()=>mq.removeEventListener('change',fn);},[]);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)));observer.observe(root.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{setAngle(activeLon??62);},[active?.id,activeLon]);
  useEffect(()=>{if(paused||reduced||!visible||!motionAllowed)return;const timer=setInterval(()=>{if(!document.hidden)setAngle(a=>(a+0.18)%360);},80);return()=>clearInterval(timer);},[paused,reduced,visible,motionAllowed]);
  const dots=useMemo(()=>DOTS.map(([lat,lon])=>project(lat,lon,angle)).filter(p=>p.z>0),[angle]);
  const kerala=project(10.85,76.27,angle);
  const marker=activeLat!=null?project(activeLat,activeLon,angle):kerala;
  const meridians=Array.from({length:12},(_,i)=>Array.from({length:61},(_,j)=>project(-90+j*3,i*30,angle)));
  const parallels=[-60,-30,0,30,60].map(lat=>Array.from({length:121},(_,j)=>project(lat,j*3,angle)));
  const path=points=>points.map((p,i)=>p.z>0?`${i&&points[i-1].z>0?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`:'').join(' ');
  return <div ref={root} className="coverage-globe" data-testid="coverage-globe">
    <svg viewBox="0 0 500 440" role="img" aria-label={`Illustrative rotating globe focused on Kerala${active ? `. Selected operating area: ${t(active.title)}` : ''}`}>
      <defs><radialGradient id={`sea-${id}`} cx="35%" cy="28%"><stop stopColor="#30302d"/><stop offset="1" stopColor="#090909"/></radialGradient></defs>
      <circle cx="250" cy="218" r="179" fill={`url(#sea-${id})`} stroke="#ffffff24"/>
      {[...meridians,...parallels].map((p,i)=><path key={i} d={path(p)} fill="none" stroke="#ffffff12" strokeWidth=".7"/>)}
      {dots.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={1.1+p.z*.6} fill="#e4e3db" opacity={.2+p.z*.6}/>)}
      {kerala.z>0&&<g><circle cx={kerala.x} cy={kerala.y} r="5" fill="#c6a15b"/><circle className="globe-pulse" cx={kerala.x} cy={kerala.y} r="11" fill="none" stroke="#c6a15b"/><path d={`M${kerala.x+9},${kerala.y} l28,-30 h54`} stroke="#c6a15b" fill="none"/><text x={kerala.x+42} y={kerala.y-37} fill="#eee" fontSize="11" letterSpacing="1.5">KERALA</text></g>}
      {items.map(item=>{const coords=coordinates(item,t);if(!coords||item.id===active?.id)return null;const point=project(...coords,angle);return point.z>0?<circle key={item.id} cx={point.x} cy={point.y} r="2" fill="#c6a15b"><title>{t(item.title)}</title></circle>:null;})}
      {activePoint&&marker.z>0&&<circle cx={marker.x} cy={marker.y} r="3" fill="#fff"/>}
    </svg>
    <div className="globe-location"><span className="tech-label">Rooted in Kerala</span><strong key={active?.id}>{active?t(active.title):'Connected by craft.'}</strong></div>
    <div className="globe-controls"><button type="button" onClick={()=>{setAngle(76.27);setPaused(true);}}>Focus on Kerala</button>{!reduced&&motionAllowed&&<button type="button" onClick={()=>setPaused(v=>!v)}>{paused?'Rotate globe':'Pause rotation'}</button>}</div>
  </div>;
}

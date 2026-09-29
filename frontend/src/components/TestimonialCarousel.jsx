import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import TestimonialCard from './TestimonialCard';
import {useMotion} from './MotionProvider';

export default function TestimonialCarousel({ items = [], projects = [] }) {
  const {mode}=useMotion();
  const [manualPause,setManualPause]=useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touch = useRef(null);
  useEffect(() => { setActive(0); }, [items.length]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  useEffect(() => {
    if (items.length < 2 || paused || reduced || manualPause || mode==='off') return undefined;
    const timer = setInterval(() => {if(!document.hidden)setActive(i => (i + 1) % items.length);}, 9000);
    return () => clearInterval(timer);
  }, [items.length, paused, reduced, manualPause, mode]);
  if (!items.length) return null;
  const item = items[active % items.length];
  const project = projects.find(p => p.slug === item.project_ref);
  return <div className="testimonial-carousel" aria-label="Client testimonials" aria-roledescription="carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }} onTouchStart={e => { touch.current = e.touches[0].clientX; }} onTouchEnd={e => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) setActive(i => (i + (dx < 0 ? 1 : items.length - 1)) % items.length); touch.current = null; }}>
    <div key={item.id || active} className="testimonial-slide"><TestimonialCard item={item} project={project}/></div>
    {items.length > 1 && <div className="testimonial-controls"><button type="button" onClick={()=>setManualPause(v=>!v)} aria-pressed={manualPause}>{manualPause?'Resume':'Pause'}</button><span aria-live="off">{String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span><div className="testimonial-dots">{items.map((entry, i) => <button type="button" key={entry.id || i} aria-label={`Show testimonial ${i + 1}`} aria-current={i === active ? 'true' : undefined} onClick={() => setActive(i)} className={i === active ? 'is-active' : ''}/>)}</div><button type="button" onClick={() => setActive(i => (i + 1) % items.length)} aria-label="Next testimonial">Next <ArrowRight size={16}/></button></div>}
  </div>;
}

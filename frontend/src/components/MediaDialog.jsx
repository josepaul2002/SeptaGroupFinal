import {useEffect,useRef} from 'react';

export default function MediaDialog({children,onClose,label,className=''}) {
  const dialog=useRef(null),close=useRef(onClose);
  close.current=onClose;
  useEffect(()=>{
    const node=dialog.current,trigger=document.activeElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    if(node.showModal)node.showModal();else node.setAttribute('open','');
    node.querySelector('button')?.focus();
    const keys=e=>{
      if(e.key==='Escape'){e.preventDefault();close.current();}
      if(e.key==='Tab'){
        const items=[...node.querySelectorAll('button,a[href],input,select,textarea,video[controls],iframe,[tabindex="0"]')].filter(el=>!el.disabled);
        const first=items[0],last=items.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    node.addEventListener('keydown',keys);
    return()=>{node.removeEventListener('keydown',keys);if(node.close)node.close();document.body.style.overflow=overflow;trigger?.focus();};
  },[]);
  return <dialog ref={dialog} className={`media-dialog ${className}`} aria-label={label} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>{children}</dialog>;
}

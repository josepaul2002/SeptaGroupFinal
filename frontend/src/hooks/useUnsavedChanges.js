import {useEffect,useRef} from 'react';

export function confirmLeave() {
  const event = new Event('septa-before-leave', {cancelable:true});
  window.dispatchEvent(event);
  return !event.defaultPrevented || window.confirm('Discard unsaved changes? Save your work first if you want to keep it.');
}

export function useUnsavedChanges(dirty) {
  useEffect(()=>{
    if(!dirty)return;
    const warn=e=>{e.preventDefault();e.returnValue='';};
    const check=e=>e.preventDefault();
    window.addEventListener('beforeunload',warn);
    window.addEventListener('septa-before-leave',check);
    return()=>{window.removeEventListener('beforeunload',warn);window.removeEventListener('septa-before-leave',check);};
  },[dirty]);
}

export function useUnsavedRecord(value, key='record') {
  const baseline=useRef({key,value:JSON.stringify(value)});
  if(baseline.current.key!==key)baseline.current={key,value:JSON.stringify(value)};
  const dirty=JSON.stringify(value)!==baseline.current.value;
  useUnsavedChanges(dirty);
  return {dirty,markSaved:()=>{baseline.current={key,value:JSON.stringify(value)};}};
}

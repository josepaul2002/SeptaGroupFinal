import {useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';

// Route changes should open at the beginning. Hash links retain their own target.
export default function RouteScroll(){
  const {pathname,hash}=useLocation();
  useLayoutEffect(()=>{
    if(hash)return;
    window.scrollTo({top:0,left:0,behavior:'instant'});
  },[pathname,hash]);
  return null;
}

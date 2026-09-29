import {useState} from 'react';
export default function ResponsiveImage({src,sizes='(max-width: 767px) 100vw, 50vw',...props}){
 const [failed,setFailed]=useState('');
 const local=typeof src==='string'&&src.startsWith('/uploads/')&&/\.(jpe?g|png|webp|gif)$/i.test(src)&&failed!==src;
 const api=(process.env.REACT_APP_BACKEND_URL||'').replace(/\/$/,'');
 const variant=w=>`${api}/api/media/image?path=${encodeURIComponent(src)}&width=${w}`;
 return <img {...props} src={src} decoding="async" sizes={local?sizes:undefined} srcSet={local?[480,960,1600].map(w=>`${variant(w)} ${w}w`).join(', '):undefined} onError={e=>{setFailed(src);props.onError?.(e);}}/>;
}

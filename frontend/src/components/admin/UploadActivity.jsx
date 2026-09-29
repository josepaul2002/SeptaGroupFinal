import {useEffect,useState} from 'react';
export default function UploadActivity(){
 const [upload,setUpload]=useState(null);
 useEffect(()=>{const listener=e=>setUpload(e.detail);window.addEventListener('septa-upload-progress',listener);return()=>window.removeEventListener('septa-upload-progress',listener);},[]);
 if(!upload)return null;
 return <aside className="fixed bottom-5 right-5 z-[70] bg-white text-black shadow-lg border p-4 w-[min(360px,90vw)]" aria-live="polite"><div className="flex justify-between gap-4"><strong className="text-sm truncate">{upload.name}</strong>{upload.done&&<button onClick={()=>setUpload(null)} aria-label="Dismiss upload status">×</button>}</div><p className="text-sm mt-2">{upload.error?'Upload failed. Select the file again to retry.':upload.done?'Upload complete. Save the record to keep it.':upload.percent>=100?'File sent. Server is validating and storing it…':`Uploading ${upload.percent}%`}</p>{!upload.done&&<progress className="w-full mt-2" max="100" value={upload.percent}/>}</aside>;
}

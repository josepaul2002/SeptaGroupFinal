import {useId,useState} from 'react';
import {uploadFile} from '../../hooks/useApi';
import MediaGuide from './MediaGuide';
export default function ImageInput({label,value,onChange,field='page_image',token,onBusy}){
 const id=useId(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const upload=async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);onBusy?.(true);setError('');try{const r=await uploadFile(token,file,field);onChange(r.url);}catch(err){setError(err.response?.data?.detail||err.message);}finally{setBusy(false);onBusy?.(false);e.target.value='';}};
 return <section className="admin-image-field"><label htmlFor={id} className="block text-xs uppercase tracking-wider mb-2">{label}</label><MediaGuide field={field}/><input id={id} className="form-input" value={value||''} onChange={e=>onChange(e.target.value)} placeholder="Upload an image or paste its direct HTTPS address"/>{token&&<label className="block text-sm mt-3">{busy?'Uploading…':'Upload image'}<input className="block mt-2" aria-label={`Upload ${label}`} type="file" accept={field==='logo_image'?'image/png,image/webp':'image/jpeg,image/png,image/webp'} disabled={busy} onChange={upload}/></label>}{value&&<img src={value} alt={`${label} preview`} className={`admin-image-preview ${field==='logo_image'?'transparent-preview':''}`}/>}<p className="text-sm text-red-700" role={error?'alert':undefined}>{error}</p></section>;
}

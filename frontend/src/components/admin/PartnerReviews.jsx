import {useCallback,useEffect,useState} from 'react';
import axios from 'axios';

const API=(process.env.REACT_APP_BACKEND_URL||'').replace(/\/$/,'')+'/api';
const auth=token=>({headers:{Authorization:`Bearer ${token}`}});

export default function PartnerReviews({token,partners}){
  const [reviews,setReviews]=useState([]),[newLink,setNewLink]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState('');
  const load=useCallback(async()=>{try{const result=await axios.get(`${API}/admin/partner-reviews`,auth(token));setReviews(result.data);}catch(err){setError(err.response?.data?.detail||'Review status could not load.');}},[token]);
  useEffect(()=>{if(token)load();},[token,load]);
  const create=async partner=>{setBusy(partner.slug);setError('');setNewLink(null);try{const result=await axios.post(`${API}/admin/partners/${partner.slug}/review-links`,{expires_days:7},auth(token));setNewLink(result.data);await load();}catch(err){setError(err.response?.data?.detail||'Could not create a review link. Save the draft first.');}finally{setBusy('');}};
  const revoke=async review=>{setBusy(review.id);setError('');try{await axios.post(`${API}/admin/partner-reviews/${review.id}/revoke`,{},auth(token));await load();}catch(err){setError(err.response?.data?.detail||'Could not revoke the link.');}finally{setBusy('');}};
  return <section className="bg-white border border-[#8A8A8A]/20 p-6" aria-label="Collaborator approval links">
    <h2 className="font-sora text-lg mb-2">Collaborator approval</h2>
    <p className="text-sm text-[#606060] mb-5">Save a draft, then create a seven-day review link. Send it to the collaborator yourself. They can approve or request changes; their name and email are self-declared, so confirm their identity before publication. New edits invalidate the old link. Uploaded media has separately accessible URLs.</p>
    {error&&<p role="alert" className="text-red-700 mb-4">{typeof error==='string'?error:JSON.stringify(error)}</p>}
    {newLink&&<div className="bg-[#F6F6F3] border p-4 mb-5"><p className="font-medium mb-2">Copy this link now — it is shown only once.</p><input readOnly value={newLink.url} aria-label="New review link" className="form-input w-full mb-3" onFocus={e=>e.target.select()}/><button type="button" className="bg-[#050505] text-white px-4 py-2 text-sm" onClick={async()=>{try{await navigator.clipboard.writeText(newLink.url);}catch{setError('Select and copy the link from the field above.');}}}>Copy link</button>{newLink.url.includes('localhost')&&<p className="text-sm text-amber-800 mt-3">This local link works only on your computer. Create a new link after the site is hosted on HTTPS before sending it.</p>}</div>}
    <div className="space-y-3">{partners.filter(p=>p.status==='draft'||p.status==='review').map(partner=>{const latest=reviews.find(r=>r.slug===partner.slug);return <div key={partner.slug} className="border-t pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><strong>{typeof partner.name==='string'?partner.name:partner.name?.en}</strong><p className="text-xs text-[#606060]">{latest?`${latest.status}${latest.stale?' · content changed':latest.expired?' · expired':''}${latest.response?.name?` · response by ${latest.response.name}`:''}`:'No review link yet'}</p>{latest?.response?.comment&&<p className="text-sm mt-1">“{latest.response.comment}”</p>}</div><div className="flex gap-2"><button type="button" disabled={!!busy} className="border px-3 py-2 text-xs disabled:opacity-50" onClick={()=>create(partner)}>{busy===partner.slug?'Creating…':'Create review link'}</button>{latest&&latest.status!=='revoked'&&!latest.expired&&<button type="button" disabled={!!busy} className="border px-3 py-2 text-xs text-red-700" onClick={()=>revoke(latest)}>Revoke</button>}</div></div>;})}</div>
    {!partners.some(p=>p.status==='draft'||p.status==='review')&&<p className="text-sm text-[#606060]">Save a collaborator as Draft to request approval before publication.</p>}
  </section>;
}

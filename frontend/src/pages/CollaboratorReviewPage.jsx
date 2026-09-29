import {useEffect,useState} from 'react';
import {useParams} from 'react-router-dom';
import axios from 'axios';
import PartnerMediaShowcase from '../components/PartnerMediaShowcase';
import ResponsiveImage from '../components/ResponsiveImage';
import {getText} from '../hooks/useApi';

const API=(process.env.REACT_APP_BACKEND_URL||'').replace(/\/$/,'')+'/api';

export default function CollaboratorReviewPage(){
  const {token}=useParams();
  const [review,setReview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  const [decision,setDecision]=useState('approved'),[name,setName]=useState(''),[email,setEmail]=useState(''),[comment,setComment]=useState(''),[confirmed,setConfirmed]=useState(false);
  useEffect(()=>{let active=true;axios.get(`${API}/collaborator-review/${encodeURIComponent(token)}`).then(({data})=>{if(active)setReview(data);}).catch(err=>{if(active)setError(err.response?.data?.detail||'Unable to load this review. Ask Septa for a new link.');});return()=>{active=false;};},[token]);
  const profile=review?.profile;
  const submit=async event=>{
    event.preventDefault();setBusy(true);setError('');
    try{
      await axios.post(`${API}/collaborator-review/${encodeURIComponent(token)}/respond`,{decision,name,email,comment,permission_confirmed:decision==='approved'&&confirmed});
      setDone(true);
    }catch(err){setError(err.response?.data?.detail||'Your response could not be saved. Please try again.');}
    finally{setBusy(false);}
  };
  return <div className="min-h-screen bg-[#F6F6F3] text-[#050505]">
    <header className="bg-[#050505] text-white px-6 py-5"><div className="max-w-5xl mx-auto flex justify-between items-center"><strong className="tracking-[0.2em] text-sm">SEPTA GROUP</strong><span className="text-xs uppercase tracking-widest text-[#C6A15B]">Private profile review</span></div></header>
    <main className="max-w-5xl mx-auto px-6 py-10 md:py-16">
      {!review&&!error&&<p role="status">Loading your review…</p>}
      {!review&&error&&<section role="alert" className="bg-white border p-8"><h1 className="text-2xl font-sora mb-3">Review link unavailable</h1><p>{error}</p></section>}
      {profile&&<>
        <p className="text-xs uppercase tracking-[0.18em] text-[#606060]">Shared for your approval before publication</p>
        <h1 className="font-sora text-3xl md:text-5xl mt-3 mb-4">{getText(profile.name)}</h1>
        <p className="text-[#606060] mb-8">{getText(profile.professional_role)||profile.category}{profile.firm?` · ${profile.firm}`:''}</p>
        <p className="bg-[#ECECEA] px-5 py-4 text-sm leading-relaxed mb-8">Please check your name, role, written description, images and company details. Only the person holding this link can see this review page. Uploaded media files may have their own public URLs, so share only media cleared for external review. This link expires on {new Date(review.expires_at).toLocaleDateString()}.</p>
        <div className="bg-white border border-[#8A8A8A]/20">
          {profile.media?.hero_image||profile.media?.card_image?<ResponsiveImage src={profile.media.hero_image||profile.media.card_image} alt="" className="w-full max-h-[420px] object-cover"/>:null}
          <div className="px-6 py-8 md:p-10 space-y-7">
            {getText(profile.bio_short)&&<p className="text-xl leading-relaxed">{getText(profile.bio_short)}</p>}
            {getText(profile.bio_long)&&<p className="whitespace-pre-line leading-relaxed text-[#606060]">{getText(profile.bio_long)}</p>}
            {profile.highlights?.length>0&&<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{profile.highlights.filter(h=>h.visible!==false).map((h,i)=><div key={i} className="border-t pt-4"><strong className="block font-sora text-2xl">{h.value}</strong><span className="text-sm text-[#606060]">{h.label}</span></div>)}</div>}
            {profile.specialties?.length>0&&<div><h2 className="font-sora text-lg mb-2">Areas of work</h2><p className="text-[#606060]">{profile.specialties.join(' · ')}</p></div>}
            {profile.media&&<PartnerMediaShowcase media={profile.media} name={getText(profile.name)}/>}
          </div>
        </div>
        <section className="mt-10 bg-white border border-[#8A8A8A]/20 p-6 md:p-10">
          <h2 className="font-sora text-2xl mb-3">Your response</h2>
          {done?<p role="status">Thank you. Your response has been recorded for the Septa team to review.</p>:review.status!=='pending'?<p>This link has already received a response.</p>:<form onSubmit={submit} className="space-y-5 max-w-xl">
            <fieldset><legend className="text-sm mb-2">Choose a response</legend><label className="mr-6"><input type="radio" checked={decision==='approved'} onChange={()=>setDecision('approved')}/> Approve</label><label><input type="radio" checked={decision==='changes_requested'} onChange={()=>setDecision('changes_requested')}/> Request changes</label></fieldset>
            <label className="block text-sm">Your name<input className="form-input mt-1" required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
            <label className="block text-sm">Email for follow-up (optional)<input className="form-input mt-1" type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
            <label className="block text-sm">Notes or changes<textarea className="form-input mt-1" rows={4} maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)} required={decision==='changes_requested'}/></label>
            {decision==='approved'&&<label className="flex gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} required/>I am authorised to review this profile and approve the text and media for publication by Septa Group.</label>}
            {error&&<p role="alert" className="text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className="bg-[#050505] text-white px-6 py-3 text-sm disabled:opacity-50">{busy?'Sending…':'Send response'}</button>
          </form>}
        </section>
      </>}
    </main>
  </div>;
}

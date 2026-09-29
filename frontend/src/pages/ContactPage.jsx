import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Mail, MessageCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { ManagedIntro } from '../components/PageSections';
import { useSiteSettings, useApiData, getText } from '../hooks/useApi';
import { enquiryContext, errorMessage, API } from '../lib/cms';
import { newId } from '../lib/pageContent';
import { contactLinks, mapAddressHref } from '../lib/contactLinks';
import {phoneCountries, normaliseEnquiryPhone} from '../lib/internationalPhone';

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [params] = useSearchParams();
  const partnerRef = params.get('partner') || '', leaderRef = params.get('leader') || '';
  const {data: person} = useApiData(partnerRef ? `/partners/${encodeURIComponent(partnerRef)}` : leaderRef ? `/leaders/${encodeURIComponent(leaderRef)}` : '/settings', null);
  const [form, setForm] = useState({name:'',phone:'',email:'',message:'',project_location:'',project_type:'',honeypot:'',answers:{}});
  const [submissionId] = useState(newId);
  const [phoneCountry,setPhoneCountry] = useState('IN');
  const [sending,setSending] = useState(false), [sent,setSent] = useState(false), [error,setError] = useState('');
  useEffect(() => { window.scrollTo(0,0); }, []);
  const questions=(settings?.enquiry?.questions||[]).filter(q=>q.label);
  const labels=settings?.enquiry?.labels||{};
  const renderQuestion=q=><label className="block text-sm" key={q.id}>{q.label}{q.required?' *':''}{q.type==='select'?<select className="form-input mt-2" required={q.required} value={form.answers[q.id]||''} onChange={e=>setForm({...form,answers:{...form.answers,[q.id]:e.target.value}})}><option value="">Select an option</option>{(q.options||[]).filter(Boolean).map(o=><option key={o}>{o}</option>)}</select>:q.type==='textarea'?<textarea className="form-input mt-2" required={q.required} maxLength={2000} value={form.answers[q.id]||''} onChange={e=>setForm({...form,answers:{...form.answers,[q.id]:e.target.value}})}/>:<input className="form-input mt-2" required={q.required} maxLength={2000} value={form.answers[q.id]||''} onChange={e=>setForm({...form,answers:{...form.answers,[q.id]:e.target.value}})}/>}</label>;
  const contact = settings?.contact || {};
  const introduction = !!(partnerRef || leaderRef || params.get('enquiry_type') === 'introduction');
  const personName = getText(person?.name);
  const message = introduction ? `Hello Septa, I'd like an introduction${personName ? ` to ${personName}` : ''}.${partnerRef ? ` Profile: ${window.location.origin}/ecosystem/${encodeURIComponent(partnerRef)}` : ''}` : `Hello Septa, I'd like to discuss ${params.get('project') ? `the ${params.get('project')} project` : 'a project'}.`;
  const links = contactLinks(contact, message);
  const submit = async e => {
    e.preventDefault(); if (form.honeypot) return;
    const internationalPhone = normaliseEnquiryPhone(form.phone, phoneCountry);
    if (!internationalPhone) { setError('Enter a phone number for the selected country, or paste a complete number starting with + and its country code.'); return; }
    setSending(true); setError('');
    try {
      await axios.post(`${API}/leads`, {...form, name:form.name.trim(), phone:internationalPhone, ...enquiryContext(), submission_id:submissionId,
        enquiry_type:introduction?'introduction':params.get('enquiry_type')==='collaboration'?'collaboration':'project',
        partner_ref:partnerRef, leader_ref:leaderRef, project_ref:params.get('project')||'', service_ref:params.get('ref')||'', page_source:'contact', preferred_contact:'phone'});
      setForm(f=>({...f,phone:internationalPhone}));
      setSent(true);
    } catch (e) { setError(errorMessage(e)); } finally { setSending(false); }
  };
  return <div className="pt-16 lg:pt-[76px]" data-testid="contact-page">
    <ManagedIntro pageId="contact"/>
    <section className="py-12 md:py-20 bg-white"><div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-12">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
        <div><p className="tech-label mb-4">Let’s talk</p><h2 className="text-3xl md:text-4xl font-sora mb-5">{introduction ? 'One introduction away.' : 'Start with a conversation.'}</h2>
          {introduction && personName && <p className="text-lg mb-5">Connect with {personName} through Septa.</p>}
          <p className="text-sm text-[#606060] mb-7">{links.call||links.whatsapp||links.email ? 'Choose what works for you. No form needed.' : 'Leave your name and number. Our team will call you back.'}</p>
          {contact.contact_person&&<p className="mb-5 text-sm"><strong>{contact.contact_person}</strong>{contact.contact_person_role&&<span className="block text-[#606060] mt-1">{contact.contact_person_role}</span>}</p>}
          <div className="flex flex-col gap-3" data-testid="direct-contact-actions">
            {links.call && <a className="design-button primary justify-between" href={links.call} data-testid="contact-call"><span className="flex gap-3"><Phone size={18}/>Call Septa</span><ArrowRight size={16}/></a>}
            {links.whatsapp && <a className="design-button justify-between" href={links.whatsapp} target="_blank" rel="noopener noreferrer" data-testid="contact-whatsapp"><span className="flex gap-3"><MessageCircle size={18}/>WhatsApp us</span><ArrowRight size={16}/></a>}
            {links.email && <a className="design-button justify-between" href={links.email} data-testid="contact-email"><span className="flex gap-3"><Mail size={18}/>Email us</span><ArrowRight size={16}/></a>}
          </div>
          {(links.whatsapp||links.email) && <p className="text-xs text-[#606060] mt-4">Your message opens ready to send. You can edit it first.</p>}
          {contact.office_address && <a className="mt-10 inline-block text-sm text-[#606060] underline underline-offset-4 hover:text-[#050505]" href={mapAddressHref(contact.office_address,contact.map_link)} target="_blank" rel="noopener noreferrer" aria-label="Open Septa Group office address in Google Maps">{contact.office_address} ↗</a>}
        </div>
        <div className="border border-[#8A8A8A]/20 p-6 md:p-8">
          {sent ? <div role="status" data-testid="contact-success"><CheckCircle2 className="mb-5"/><h2 className="text-2xl mb-3">Callback requested.</h2><p>Thank you, {form.name}. Our team will contact you on {form.phone}.</p></div> : <>
            <h2 className="text-2xl font-sora mb-2">Prefer us to call?</h2><p className="text-sm text-[#606060] mb-7">{questions.some(q=>q.required)?'Your contact details and a few quick questions.':'Just your name and phone number.'}</p>
            <form className="space-y-5" onSubmit={submit} data-testid="enquiry-form">
              <div className="absolute -left-[9999px]" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" value={form.honeypot} onChange={e=>setForm({...form,honeypot:e.target.value})}/></div>
              <label className="block text-sm">{labels.name||'Your name'}<input className="form-input mt-2" required minLength={2} maxLength={120} autoComplete="name" data-testid="input-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
              <fieldset className="space-y-2"><legend className="text-sm">{labels.phone||'Phone number'}</legend><div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3"><label className="text-xs text-[#606060]">Country / calling code<select className="form-input mt-2 w-full min-w-0" aria-label="Country calling code" value={phoneCountry} onChange={e=>setPhoneCountry(e.target.value)}>{phoneCountries.map(country=><option key={country.code} value={country.code}>{country.name} (+{country.dial})</option>)}</select></label><label className="text-xs text-[#606060]">Your number<input className="form-input mt-2 w-full min-w-0" type="tel" inputMode="tel" required maxLength={32} autoComplete="tel-national" placeholder="Local number or +country code" data-testid="input-phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div><p className="text-xs text-[#606060]">We accept international numbers. A complete number starting with + uses its own country code.</p></fieldset>
              {questions.filter(q=>q.required).map(renderQuestion)}<details className="border-y py-4"><summary className="text-sm cursor-pointer">Add details (optional)</summary><div className="space-y-4 mt-5">
                <label className="block text-sm">{labels.email||'Email'}<input type="email" className="form-input mt-2" autoComplete="email" maxLength={254} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
                <label className="block text-sm">{labels.project_location||'Project location'}<input className="form-input mt-2" value={form.project_location} onChange={e=>setForm({...form,project_location:e.target.value})}/></label>
                <label className="block text-sm">{labels.project_type||'Project type'}<select className="form-input mt-2" value={form.project_type} onChange={e=>setForm({...form,project_type:e.target.value})}><option value="">Choose if relevant</option>{(settings?.enquiry?.project_types||[]).map(t=><option key={t}>{t}</option>)}</select></label>
                <label className="block text-sm">{labels.message||'Anything we should know?'}<textarea className="form-input mt-2" rows={3} maxLength={5000} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></label>
              {questions.filter(q=>!q.required).map(renderQuestion)}</div></details>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <button type="submit" className="design-button primary w-full justify-center" disabled={sending}>{sending?<><Loader2 size={16} className="animate-spin"/>Sending…</>:'Request a callback'}</button>
              <p className="text-xs text-[#606060]">We’ll use these details to respond to your request. <a className="underline" href="/privacy">Privacy</a></p>
            </form></>}
        </div>
      </div>
    </div></section>
  </div>;
}

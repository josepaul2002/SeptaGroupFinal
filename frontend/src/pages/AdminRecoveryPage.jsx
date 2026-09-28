import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API, errorMessage } from '../lib/cms';
export default function AdminRecoveryPage() {
  const [token] = useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[done,setDone]=useState(false);
  useEffect(()=>{if(window.location.hash) window.history.replaceState(null,'',window.location.pathname);},[]);
  const submit=async e=>{
    e.preventDefault();setError('');setMessage('');
    if(token && password!==confirm){setError('The passwords do not match.');return;}
    if(token && new TextEncoder().encode(password).length>72){setError('Use a password no longer than 72 UTF-8 bytes.');return;}
    setBusy(true);
    try {
      const result=await axios.post(`${API}/admin/${token?'reset-password':'forgot-password'}`,token?{token,password}:{email});
      setMessage(result.data.message);setDone(true);
      if(token) sessionStorage.removeItem('septa-admin-token');
    }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
  };
  return <div className="min-h-screen flex items-center justify-center px-6 py-16"><div className="max-w-md w-full bg-white border p-8">
    <p className="tech-label mb-4">Septa / Account recovery</p><h1 className="text-2xl font-sora mb-4">{token?'Set a new password':'Forgot your password?'}</h1>
    {!done&&<form onSubmit={submit} className="space-y-5">
      {token?<><label className="block text-sm">New password<input className="form-input mt-2" type="password" required minLength={12} maxLength={72} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="block text-sm">Confirm password<input className="form-input mt-2" type="password" required minLength={12} maxLength={72} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><p className="text-xs text-neutral-600">At least 12 characters. Your other admin sessions will be signed out.</p></>:<><p className="text-sm text-neutral-600">Enter the email registered to your admin account.</p><label className="block text-sm">Admin email<input className="form-input mt-2" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label></>}
      <button disabled={busy} className="w-full bg-black text-white py-3 text-sm">{busy?'Please wait…':token?'Update password':'Email a reset link'}</button>
    </form>}
    {message&&<p role="status" className="text-sm mt-5">{message}</p>}{error&&<p role="alert" className="text-sm text-red-700 mt-5">{error}</p>}
    {token&&error&&<a href="/admin/recover" className="block mt-5 underline text-sm">Request a new reset link</a>}
    <Link className="block mt-6 underline text-sm" to="/admin">Back to admin login</Link>
  </div></div>;
}

import {useEffect,useState} from 'react';
import axios from 'axios';
const API=`${(process.env.REACT_APP_BACKEND_URL||'').replace(/\/$/,'')}/api`;
export default function IntegrationsPanel({token}){
 const [items,setItems]=useState([]),[error,setError]=useState('');
 const load=()=>axios.get(`${API}/admin/integrations`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>{setItems(r.data);setError('');}).catch(()=>setError('Could not load connected integrations.'));
 useEffect(()=>{load();},[token]); // eslint-disable-line react-hooks/exhaustive-deps
 const revoke=async id=>{try{await axios.post(`${API}/admin/integrations/${encodeURIComponent(id)}/revoke`,{},{headers:{Authorization:`Bearer ${token}`}});load();}catch{setError('Could not revoke access. Please try again.');}};
 return <section className="mt-6 max-w-xl bg-white border border-black/15 p-6 space-y-4"><h2 className="text-lg font-sora">Connected assistants</h2><p className="text-sm">Connections use the permissions you selected during sign-in. Revoking access stops future assistant requests. Connections expire after eight hours.</p>{error&&<p role="alert">{error}</p>}{!items.length&&!error&&<p className="text-sm text-neutral-500">No active connections.</p>}{items.map(item=><div key={item.id} className="border-t pt-3 flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm break-words">{item.scopes.join(', ')}</p><p className="text-xs text-neutral-500">Expires {new Date(item.expires_at).toLocaleString()}</p></div><button type="button" className="border px-4 py-2 text-sm" onClick={()=>revoke(item.id)}>Revoke access</button></div>)}</section>;
}

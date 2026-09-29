import {prepareMediaFile} from '../lib/prepareMediaFile';
import {rememberImage} from '../lib/mediaRules';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
localStorage.removeItem('septa-admin-token');
const API = `${(process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '')}/api`;

// A static-only host may return index.html for API calls; never treat that as a save.
axios.interceptors.response.use(response => {
  if (String(response.config.url).includes('/api/') && typeof response.data === 'string')
    throw new Error('The API returned a web page instead of data. Run Septa with start-local.sh and open http://localhost:8000.');
  if(response.config.method && response.config.method.toLowerCase()!=='get')publicCache.clear();
  return response;
});

// Helper to get text from bilingual object
export function getText(bilingual, lang = 'en') {
  if (!bilingual) return '';
  if (typeof bilingual === 'string') return bilingual;
  return bilingual[lang] || bilingual.en || '';
}

// Short-lived public request cache; authenticated previews are never shared.
const publicCache=new Map(),pendingPublic=new Map();
async function readContent(endpoint,options){
 const cacheable=!endpoint.includes('preview=true')&&!endpoint.startsWith('/admin')&&!endpoint.startsWith('/page-status');
 if(!cacheable)return axios.get(API+endpoint,options);
 const cached=publicCache.get(endpoint);
 if(cached&&Date.now()-cached.time<10000)return cached.response;
 if(pendingPublic.has(endpoint))return pendingPublic.get(endpoint);
 const promise=axios.get(API+endpoint,options).then(response=>{publicCache.set(endpoint,{time:Date.now(),response});return response;}).finally(()=>pendingPublic.delete(endpoint));
 pendingPublic.set(endpoint,promise);return promise;
}
export function useApiData(endpoint,defaultValue=[]){
 const fallback=useRef({endpoint,value:defaultValue});
 if(fallback.current.endpoint!==endpoint)fallback.current={endpoint,value:defaultValue};
 const fallbackValue=fallback.current.value;
 const [nonce,setNonce]=useState(0);
 const [state,setState]=useState(()=>{
  let data=fallbackValue;
  try{data=JSON.parse(document.getElementById('septa-bootstrap')?.textContent||'{}')[endpoint]??publicCache.get(endpoint)?.response.data??fallbackValue;}catch{}
  return {endpoint,data,loading:data===fallbackValue,error:null,statusCode:null};
 });
 useEffect(()=>{
  let cancelled=false;
  setState(previous=>({...previous,endpoint,data:previous.endpoint===endpoint?previous.data:fallbackValue,loading:previous.endpoint!==endpoint||previous.data===fallbackValue,error:null,statusCode:null}));
  const token=sessionStorage.getItem('septa-admin-token');
  const options=endpoint.includes('preview=true')&&token?{headers:{Authorization:'Bearer '+token}}:{};
  readContent(endpoint,options).then(res=>{
   const valid=Array.isArray(fallbackValue)?Array.isArray(res.data):fallbackValue===null||typeof fallbackValue==='object'?Boolean(res.data&&typeof res.data==='object'&&!Array.isArray(res.data)):true;
   if(!valid)throw new Error('The content service returned an invalid response.');
   if(!cancelled)setState({endpoint,data:res.data,loading:false,error:null,statusCode:null});
  }).catch(err=>{publicCache.delete(endpoint);if(!cancelled)setState(previous=>({...previous,endpoint,data:previous.endpoint===endpoint?previous.data:fallbackValue,loading:false,error:err.message,statusCode:err.response?.status||null}));});
  const changed=event=>{publicCache.delete('/settings');if(endpoint==='/settings')setState({endpoint,data:event.detail,loading:false,error:null,statusCode:null});};
  window.addEventListener('septa-settings-updated',changed);
  return()=>{cancelled=true;window.removeEventListener('septa-settings-updated',changed);};
 },[endpoint,fallbackValue,nonce]);
 const retry=()=>{publicCache.delete(endpoint);setNonce(n=>n+1);};
 const setData=value=>setState(previous=>({...previous,data:typeof value==='function'?value(previous.data):value}));
 return state.endpoint===endpoint?{...state,setData,retry}:{data:fallbackValue,loading:true,error:null,statusCode:null,setData,retry};
}

// Site settings hook
export function useSiteSettings() {
  const { data, loading } = useApiData('/settings', null);
  return { settings: data, loading };
}

// Page content hook
export function usePageContent(pageId) {
  const { data, loading } = useApiData(`/pages/${pageId}`, { blocks: [] });
  return { page: data, blocks: data?.blocks || [], loading };
}

// Projects hook
export function useProjects(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  
  const endpoint = `/projects${params.toString() ? '?' + params.toString() : ''}`;
  return useApiData(endpoint, []);
}

// Single project hook with preview support
export function useProject(slug, preview = false) {
  const endpoint = preview ? `/projects/${slug}?preview=true` : `/projects/${slug}`;
  const { data, ...state } = useApiData(endpoint, null);
  return { project: data, ...state };
}

// Partners hook
export function usePartners(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.featured !== undefined) params.set('featured', filters.featured);
  
  const endpoint = `/partners${params.toString() ? '?' + params.toString() : ''}`;
  return useApiData(endpoint, []);
}

// Single partner hook with preview support
export function usePartner(slug, preview = false) {
  const endpoint = preview ? `/partners/${slug}?preview=true` : `/partners/${slug}`;
  const { data, ...state } = useApiData(endpoint, null);
  return { partner: data, ...state };
}

// Testimonials hook
export function useTestimonials() {
  return useApiData('/testimonials', []);
}

// Solution Packs hook
export function useSolutionPacks() {
  return useApiData('/solution-packs', []);
}

// Categories hook
export function usePartnerCategories() {
  return useApiData('/categories/partners', []);
}

export function useProjectCategories() {
  return useApiData('/categories/projects', { types: [], statuses: [], client_lens: [] });
}

// Admin hooks
export function useAdminAuth() {
  const [token, setToken] = useState(() => sessionStorage.getItem('septa-admin-token'));
  const [admin, setAdmin] = useState(null);
  const [authMode, setAuthMode] = useState('password');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      let mode = 'password';
      try {
        const config = await axios.get(`${API}/admin/auth/config`);
        mode = config.data.mode === 'google' ? 'google' : 'password';
        setAuthMode(mode);
      } catch { /* Old local installs continue with password sign-in. */ }
      if (!token) {
        if (mode === 'google') {
          try {
            const session = await axios.get(`${API}/admin/session`);
            sessionStorage.setItem('septa-admin-token', session.data.access_token);
            setToken(session.data.access_token);
            setAdmin({id:session.data.admin_id,email:session.data.email,role:session.data.role});
          } catch { /* No Workspace session yet. */ }
        }
        setLoading(false);
        return;
      }
      
      try {
        const res = await axios.get(`${API}/admin/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAdmin(res.data);
      } catch {
        // Token invalid/expired
        sessionStorage.removeItem('septa-admin-token');
        setToken(null);
      }
      setLoading(false);
    }
    
    checkAuth();
  }, [token]);

  const login = async (email, password, challenge, code) => {
    const res = challenge ? await axios.post(`${API}/admin/login/verify`, {challenge,code}) : await axios.post(`${API}/admin/login`, { email, password });
    if(res.data.requires_otp)return res.data;
    const newToken = res.data.access_token;
    sessionStorage.setItem('septa-admin-token', newToken);
    setToken(newToken);
    setAdmin({ id: res.data.admin_id, email: res.data.email, role: res.data.role });
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/admin/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    sessionStorage.removeItem('septa-admin-token');
    setToken(null);
    setAdmin(null);
  };

  return { token, admin, authMode, loading, login, logout, isAuthenticated: !!admin };
}

// Admin data hooks
export function useAdminLeads(token) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    async function fetch() {
      try {
        const res = await axios.get(`${API}/leads`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeads(res.data);
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      }
      setLoading(false);
    }
    
    fetch();
  }, [token]);

  const updateStatus = async (id, status) => {
    await axios.patch(`${API}/leads/${id}`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
  };

  const deleteLead = async (id) => {
    await axios.delete(`${API}/leads/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setLeads(leads.filter(l => l.id !== id));
  };

  return { leads, loading, setLeads, updateStatus, deleteLead };
}

export function useAdminProjects(token) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    async function fetch() {
      try {
        const res = await axios.get(`${API}/projects?published_only=false`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
      setLoading(false);
    }
    
    fetch();
  }, [token]);

  const createProject = async (project) => {
    const res = await axios.post(`${API}/projects`, project, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const newProject = { ...project, id: res.data.id };
    setProjects([...projects, newProject]);
    return res.data;
  };

  const updateProject = async (slug, updates) => {
    await axios.put(`${API}/projects/${slug}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProjects(projects.map(p => p.slug === slug ? { ...p, ...updates } : p));
  };

  const deleteProject = async (slug) => {
    await axios.delete(`${API}/projects/${slug}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProjects(projects.filter(p => p.slug !== slug));
  };

  return { projects, loading, setProjects, createProject, updateProject, deleteProject };
}

export function useAdminPartners(token) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    async function fetch() {
      try {
        const res = await axios.get(`${API}/partners?published_only=false`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPartners(res.data);
      } catch (err) {
        console.error('Failed to fetch partners:', err);
      }
      setLoading(false);
    }
    
    fetch();
  }, [token]);

  const createPartner = async (partner) => {
    const res = await axios.post(`${API}/partners`, partner, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const newPartner = { ...partner, id: res.data.id };
    setPartners([...partners, newPartner]);
    return res.data;
  };

  const updatePartner = async (slug, updates) => {
    await axios.put(`${API}/partners/${slug}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPartners(partners.map(p => p.slug === slug ? { ...p, ...updates } : p));
  };

  const deletePartner = async (slug) => {
    await axios.delete(`${API}/partners/${slug}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPartners(partners.filter(p => p.slug !== slug));
  };

  return { partners, loading, setPartners, createPartner, updatePartner, deletePartner };
}

export function useAdminTestimonials(token) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    async function fetch() {
      try {
        const res = await axios.get(`${API}/testimonials?published_only=false`, { headers: { Authorization: `Bearer ${token}` } });
        setTestimonials(res.data);
      } catch (err) {
        console.error('Failed to fetch testimonials:', err);
      }
      setLoading(false);
    }
    
    fetch();
  }, [token]);

  const deleteTestimonial = async (id) => {
    await axios.delete(`${API}/testimonials/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTestimonials(testimonials.filter(t => t.id !== id));
  };

  return { testimonials, loading, setTestimonials, deleteTestimonial };
}

// Export content
export async function exportContent(token) {
  const res = await axios.get(`${API}/export/content`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Upload file
export async function uploadFile(token, file, role = 'page_image') {
  if (!file || !file.size) throw new Error('Choose a non-empty file to upload.');
  if (file.size > 50 * 1024 * 1024) throw new Error('Use a file under 50 MB.');
  if (!/\.(jpe?g|png|webp|gif|pdf|mp4|webm|mov|glb|gltf)$/i.test(file.name))
    throw new Error('Use JPG, PNG, WebP or GIF for images. Export HEIC photos as JPG first. PDF, MP4, WebM, MOV, GLB and GLTF files are also supported.');
  file=await prepareMediaFile(file,role);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('media_role',role);
  
  const report=(percent,done=false,error=false)=>window.dispatchEvent(new CustomEvent('septa-upload-progress',{detail:{name:file.name,percent,done,error}}));
  report(0);
  let res;
  try {res = await axios.post(`${API}/upload`, formData, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('septa-admin-token') || token}`
    }, timeout: 120000, onUploadProgress:event=>report(event.total?Math.round(event.loaded/event.total*100):0)
  });report(100,true);}catch(error){report(0,true,true);throw error;}
  
  if (!res.data?.url) throw new Error('Upload returned no image address. Check that the API server is running.');
  rememberImage(res.data.url,role);
  return res.data;
}

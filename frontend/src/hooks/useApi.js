import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
localStorage.removeItem('septa-admin-token');
const API = `${(process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '')}/api`;

// A static-only host may return index.html for API calls; never treat that as a save.
axios.interceptors.response.use(response => {
  if (String(response.config.url).includes('/api/') && typeof response.data === 'string')
    throw new Error('The API returned a web page instead of data. Run Septa with start-local.sh and open http://localhost:8000.');
  return response;
});

// Helper to get text from bilingual object
export function getText(bilingual, lang = 'en') {
  if (!bilingual) return '';
  if (typeof bilingual === 'string') return bilingual;
  return bilingual[lang] || bilingual.en || '';
}

// Generic fetch hook
export function useApiData(endpoint, defaultValue = []) {
  const fallback = useRef({endpoint, value:defaultValue});
  if (fallback.current.endpoint !== endpoint) fallback.current = {endpoint, value:defaultValue};
  const fallbackValue = fallback.current.value;
  const [state, setState] = useState(() => {
    let data = fallbackValue;
    try { data = JSON.parse(document.getElementById('septa-bootstrap')?.textContent || '{}')[endpoint] ?? fallbackValue; } catch {}
    return {endpoint, data, loading:true, error:null};
  });
  useEffect(() => {
    let cancelled = false;
    setState(previous => ({endpoint, data:previous.endpoint===endpoint ? previous.data : fallbackValue, loading:true, error:null}));
    async function fetchData() {
      try {
        const token = sessionStorage.getItem('septa-admin-token');
        const options = endpoint.includes('preview=true') && token ? {headers:{Authorization:`Bearer ${token}`}} : {};
        const res = await axios.get(`${API}${endpoint}`, options);
        const expectsArray = Array.isArray(fallbackValue);
        const expectsObject = fallbackValue === null || (typeof fallbackValue === 'object' && !expectsArray);
        const valid = expectsArray ? Array.isArray(res.data) : expectsObject ? Boolean(res.data && typeof res.data==='object' && !Array.isArray(res.data)) : true;
        if (!valid) throw new Error('The content service returned an invalid response.');
        if (!cancelled) setState({endpoint, data:res.data, loading:false, error:null});
      } catch (err) {
        if (!cancelled) setState(previous => ({endpoint, data:previous.endpoint===endpoint ? previous.data : fallbackValue, loading:false, error:err.message}));
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [endpoint, fallbackValue]);
  const setData = value => setState(previous => ({...previous, data:typeof value==='function'?value(previous.data):value}));
  return state.endpoint===endpoint ? {...state,setData} : {data:fallbackValue,loading:true,error:null,setData};
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
  const { data, loading, error } = useApiData(endpoint, null);
  return { project: data, loading, error };
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
  const { data, loading, error } = useApiData(endpoint, null);
  return { partner: data, loading, error };
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
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

  const login = async (email, password) => {
    const res = await axios.post(`${API}/admin/login`, { email, password });
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

  return { token, admin, loading, login, logout, isAuthenticated: !!admin };
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
export async function uploadFile(token, file) {
  if (!file || !file.size) throw new Error('Choose a non-empty file to upload.');
  if (file.size > 50 * 1024 * 1024) throw new Error('Use a file under 50 MB.');
  if (!/\.(jpe?g|png|webp|gif|pdf|mp4|webm|mov|glb|gltf)$/i.test(file.name))
    throw new Error('Use JPG, PNG, WebP or GIF for images. Export HEIC photos as JPG first. PDF, MP4, WebM, MOV, GLB and GLTF files are also supported.');
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await axios.post(`${API}/upload`, formData, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('septa-admin-token') || token}`
    }, timeout: 120000
  });
  
  if (!res.data?.url) throw new Error('Upload returned no image address. Check that the API server is running.');
  return res.data;
}

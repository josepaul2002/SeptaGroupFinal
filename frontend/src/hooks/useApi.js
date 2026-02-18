import { useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Helper to get text from bilingual object
export function getText(bilingual, lang = 'en') {
  if (!bilingual) return '';
  if (typeof bilingual === 'string') return bilingual;
  return bilingual[lang] || bilingual.en || '';
}

// Generic fetch hook
function useApiData(endpoint, defaultValue = [], deps = []) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetch() {
      setLoading(true);
      try {
        const res = await axios.get(`${API}${endpoint}`);
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          console.error(`API error (${endpoint}):`, err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetch();
    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error, setData };
}

// Projects hook
export function useProjects(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  
  const endpoint = `/projects${params.toString() ? '?' + params.toString() : ''}`;
  return useApiData(endpoint, []);
}

// Single project hook
export function useProject(slug) {
  const { data, loading, error } = useApiData(`/projects/${slug}`, null, [slug]);
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

// Single partner hook
export function usePartner(slug) {
  const { data, loading, error } = useApiData(`/partners/${slug}`, null, [slug]);
  return { partner: data, loading, error };
}

// Testimonials hook
export function useTestimonials() {
  return useApiData('/testimonials', []);
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
  const [token, setToken] = useState(() => localStorage.getItem('septa-admin-token'));
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
        localStorage.removeItem('septa-admin-token');
        setToken(null);
      }
      setLoading(false);
    }
    
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/admin/login`, { email, password });
    const newToken = res.data.access_token;
    localStorage.setItem('septa-admin-token', newToken);
    setToken(newToken);
    setAdmin({ id: res.data.admin_id, email: res.data.email });
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/admin/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    localStorage.removeItem('septa-admin-token');
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
        const res = await axios.get(`${API}/testimonials`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await axios.post(`${API}/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return res.data;
}

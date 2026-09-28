export const API = `${(process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '')}/api`;
export const auth = token => ({ headers: { Authorization: `Bearer ${token}` } });
export const bl = value => typeof value === 'string' ? { en: value, ml: '' } : { en: '', ml: '', ...value };
export const errorMessage = error => {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  if (detail?.issues) return detail.issues.join(' ');
  if (Array.isArray(detail)) return detail.map(d => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join(' ');
  if (typeof detail === 'string') return detail;
  if (status === 401) return 'Your admin session has expired. Copy any unsaved text before signing in again.';
  if (status === 403) return 'Your account does not have permission for this action.';
  if (status === 413) return 'This file is too large. Use a file under 50 MB.';
  if (status >= 500) return 'The server could not complete this action. Check the terminal running Septa for the error, then retry. Your edits are still here.';
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach Septa. Keep the server terminal running and check your connection. Your edits are still here.';
  if (error?.code === 'ECONNABORTED') return 'The upload timed out. Try a smaller file or check your connection.';
  return error?.message || 'This action could not be completed. Your edits are still here.';
};
export function media(value = {}) {
  const src = value || {};
  const item = v => typeof v === 'string' ? { url: v, alt: '', credit: '', caption: bl(''), kind: 'photograph', approved: false } : { ...v, caption: bl(v.caption) };
  return { ...src, hero_video: typeof src.hero_video === 'object' ? src.hero_video?.url || '' : src.hero_video || '',
    images: (src.images || src.gallery || []).map(item), plans: (src.plans || src.plan_drawings || []).map(item),
    model_3d: typeof (src.model_3d || src.model_3d_url) === 'object' ? (src.model_3d || src.model_3d_url)?.url || '' : src.model_3d || src.model_3d_url || '', plans_public: !!src.plans_public };
}
export function enquiryContext() {
  const params = new URLSearchParams(window.location.search);
  let initial = {};
  try {
    initial = JSON.parse(sessionStorage.getItem('septa-landing') || 'null');
    if (!initial) {
      initial = { landing_page: window.location.pathname, utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || '' };
      sessionStorage.setItem('septa-landing', JSON.stringify(initial));
    }
  } catch { initial = { landing_page: window.location.pathname }; }
  return { ...initial, submission_page: window.location.pathname };
}

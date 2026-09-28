// Never render arbitrary embed HTML or arbitrary websites in an iframe.
export function modelSource(value = '') {
  try {
    const url = new URL(value.trim(), window.location.origin);
    if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) return null;
    if (url.protocol !== 'https:' && url.origin !== window.location.origin) return null;
    if (['sketchfab.com', 'www.sketchfab.com'].includes(url.hostname)) {
      const match = url.pathname.match(/^\/(?:3d-models\/[^/]*?([a-f0-9]{32})|models\/([a-f0-9]{32})(?:\/embed)?)\/?$/i);
      const id = match?.[1] || match?.[2];
      return id ? {type:'sketchfab',src:`https://sketchfab.com/models/${id}/embed?autostart=1&dnt=1`,external:`https://sketchfab.com/models/${id}`} : null;
    }
    if (/\.(glb|gltf)$/i.test(url.pathname)) return {type:'file',src:url.href,external:url.href};
  } catch {}
  return null;
}

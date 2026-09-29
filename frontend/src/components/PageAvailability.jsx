import {useLocation,Link} from 'react-router-dom';
import {useApiData,useSiteSettings} from '../hooks/useApi';
import {contactLinks} from '../lib/contactLinks';

function PublicAvailability({children}) {
  const {pathname,search}=useLocation(), preview=new URLSearchParams(search).get('preview')==='true';
  const {data,loading,error}=useApiData(`/page-status?path=${encodeURIComponent(pathname)}${preview?'&preview=true':''}`,null);
  const {settings}=useSiteSettings(),links=contactLinks(settings?.contact);
  if(loading&&!data)return <div className="pt-32 pb-16 px-6" role="status">Loading page…</div>;
  if(error&&!data)return <div className="pt-32 pb-24 px-6"><h1 className="text-3xl">Unable to load this page</h1><p className="my-5">Please check your connection and try again.</p><button className="design-button" onClick={()=>window.location.reload()}>Retry</button></div>;
  if(data?.maintenance&&!data?.preview_allowed)return <section className="design-container pt-36 pb-28 min-h-[70vh]"><p className="design-eyebrow">Septa Group / Page update</p><h1 className="text-4xl font-sora max-w-3xl">{data.title}</h1><p className="my-7 max-w-2xl leading-relaxed">{data.message}</p><div className="flex gap-4 flex-wrap">{links.call&&<a className="design-button" href={links.call}>Call Septa</a>}{links.email&&<a className="design-text-link" href={links.email}>Email us</a>}{pathname!=='/'&&<Link className="design-text-link" to="/">Return home</Link>}</div></section>;
  return <>{data?.maintenance&&data?.preview_allowed&&<div className="maintenance-preview-banner" role="status">Admin preview · This page is temporarily unavailable to visitors.</div>}{children}</>;
}
export default function PageAvailability({children}) {
  const {pathname}=useLocation();
  return pathname.startsWith('/admin')||pathname.startsWith('/review/')||pathname==='/content-checklist'?children:<PublicAvailability>{children}</PublicAvailability>;
}

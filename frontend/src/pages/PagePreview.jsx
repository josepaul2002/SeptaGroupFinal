import { useAdminAuth } from '../hooks/useApi';
import { PageHero, PageSections } from '../components/PageSections';
export default function PagePreview(){
  const {isAuthenticated,loading}=useAdminAuth();
  if(loading)return <p className="p-8">Loading preview…</p>;
  if(!isAuthenticated)return <p className="p-8">Sign in to the admin portal to preview content.</p>;
  let stored;try{stored=JSON.parse(sessionStorage.getItem('septa-page-preview')||'null');}catch{}
  if(!stored?.page)return <p className="p-8">Open a page in Website Studio and select Preview.</p>;
  return <div data-testid={`${stored.pageId}-page`}><PageHero pageId={stored.pageId} hero={stored.page.hero} compact={!['home','about','services'].includes(stored.pageId)}/><PageSections sections={stored.page.sections}/>{!['home','about','services'].includes(stored.pageId)&&<p className="p-8 text-sm">The live page continues with its listing or enquiry form.</p>}</div>;
}

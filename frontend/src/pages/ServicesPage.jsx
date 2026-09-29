import { DesignedPage } from '../components/PageSections';
import { Link } from 'react-router-dom';
import { useApiData } from '../hooks/useApi';

export default function ServicesPage(){
  const {data: pages} = useApiData('/search-pages', []);
  const approved = pages.filter(page => !page.seo?.noindex);
  const directory=approved.length > 0 && <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10"><h2 className="font-sora text-3xl mb-8">Explore our work in detail</h2><div className="grid md:grid-cols-2 gap-5">{approved.map(page => <Link className="block border border-black/15 p-6 hover:border-black transition-colors" key={`${page.kind}-${page.slug}`} to={`/${page.kind === 'service' ? 'services' : 'locations'}/${page.slug}`}><span className="text-xs uppercase tracking-widest text-black/50">{page.kind}</span><h3 className="font-sora text-xl mt-3">{page.title}</h3><p className="text-sm text-black/65 mt-3 line-clamp-3">{page.introduction}</p></Link>)}</div></section>;
  return <DesignedPage pageId="services" beforeCTA={directory}/>;
}

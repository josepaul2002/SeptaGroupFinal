import {Link} from 'react-router-dom';
import {useApiData,getText} from '../hooks/useApi';
export default function ProjectCredits({slug,scope}){
 const {data}=useApiData(`/projects/${slug}/credits`,[]);
 if(!data.length&&!getText(scope))return null;
 return <section className="bg-white border-b px-6 py-8"><div className="max-w-6xl mx-auto"><h2 className="text-lg mb-3">Project responsibility & credits</h2>{getText(scope)&&<p className="mb-5"><strong>Septa’s scope:</strong> {getText(scope)}</p>}<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{data.map((c,i)=><div key={`${c.entity_slug}-${i}`}><p className="text-xs uppercase tracking-wider">{c.role}</p><Link className="text-lg underline underline-offset-4" to={c.url}>{getText(c.name)}</Link>{getText(c.contribution)&&<p className="text-sm mt-2">{getText(c.contribution)}</p>}{c.affiliation_at_time&&<p className="text-xs mt-1">At the time: {c.affiliation_at_time}</p>}</div>)}</div></div></section>;
}

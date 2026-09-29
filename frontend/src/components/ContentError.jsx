import {Link} from 'react-router-dom';

export default function ContentError({notFound=false,label='page',retry,back='/projects'}) {
 return <section className="design-container pt-36 pb-24 min-h-[60vh]" role="alert"><h1 className="font-sora text-3xl">{notFound?`${label} not found`:`Unable to load ${label.toLowerCase()}`}</h1><p className="my-6">{notFound?'This content may have moved or is not published.':'The content service is temporarily unavailable. Please try again; this does not mean the content has been deleted.'}</p><div className="flex flex-wrap gap-5">{!notFound&&retry&&<button className="design-button" onClick={retry}>Try again</button>}<Link className="design-text-link" to={back}>Browse other pages →</Link></div></section>;
}

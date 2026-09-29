import React from 'react';
import {Link} from 'react-router-dom';

export default class PartnerProfileBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error){console.error('Collaborator profile failed to render',error);}
  render(){
    if(!this.state.failed)return this.props.children;
    return <section className="design-container pt-36 pb-24 min-h-[60vh]" role="alert">
      <h1 className="font-sora text-3xl">This collaborator profile could not be displayed</h1>
      <p className="my-6">Its content may need a review in the admin page. You can still browse the other collaborators.</p>
      <Link className="design-text-link" to="/ecosystem">Back to collaborators →</Link>
    </section>;
  }
}

import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import PartnerProfilePage from './PartnerProfilePage';

jest.mock('react-router-dom',()=>({
  Link:({to,children,...props})=><a href={to} {...props}>{children}</a>,
  useParams:()=>({slug:'jacob-binoy'}),useSearchParams:()=>[new URLSearchParams()],useLocation:()=>({state:{from:'/ecosystem?category=Architects'}}),
}),{virtual:true});
jest.mock('../components/LanguageToggle',()=>({useLanguage:()=>({t:v=>typeof v==='string'?v:v?.en||''})}));
jest.mock('../hooks/useScrollReveal',()=>({useScrollReveal:()=>{}}));
jest.mock('../hooks/useApi',()=>({
  usePartner:()=>({partner:{slug:'jacob-binoy',name:{en:'Jacob Binoy'},profile_type:'person',relationship_type:'Core Partner',specialties:[],highlights:[],status:'published'},loading:false,error:null}),
  useApiData:()=>({data:[{slug:'st-thomas-school',title:{en:'St Thomas School'},image:'',location:'Kottayam',type:'Educational'}],error:null}),
  getText:v=>typeof v==='string'?v:v?.en||'',
}));

test('legacy person with linked projects and no media renders and links back',()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  window.scrollTo=jest.fn();
  const container=document.createElement('div');document.body.append(container);
  const root=createRoot(container);
  act(()=>root.render(<PartnerProfilePage/>));
  expect(container.querySelector('[data-testid="partner-name"]').textContent).toContain('Jacob Binoy');
  expect(container.querySelector('[data-testid="partner-project-st-thomas-school"]').textContent).toContain('St Thomas School');
  expect(container.querySelector('[data-testid="back-to-ecosystem-btn"]').getAttribute('href')).toBe('/ecosystem?category=Architects');
  act(()=>root.unmount());container.remove();
});

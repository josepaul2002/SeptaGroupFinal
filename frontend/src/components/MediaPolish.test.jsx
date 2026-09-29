import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {PageHero} from './PageSections';
import MobileContactBar from './MobileContactBar';
import MediaGuide from './admin/MediaGuide';
jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>,useLocation:()=>({search:''})}),{virtual:true});
jest.mock('./LanguageToggle',()=>({useLanguage:()=>({t:x=>typeof x==='string'?x:x?.en||''})}));
jest.mock('../hooks/useApi',()=>({
 useProjects:()=>({data:[{slug:'first',title:'First project',image:'/first.jpg',status:'published',publication_reviewed:true},{slug:'second',title:'Second project',image:'/second.jpg',status:'published',publication_reviewed:true}]}),
 useSiteSettings:()=>({settings:{appearance:{motion:'off'},contact:{phone_link:'+910000000000',whatsapp_number:'910000000000'}}}),
 useApiData:()=>({data:[]}),getText:x=>x
}));
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('home hero presents the featured project without playback controls',()=>{
 act(()=>root.render(<PageHero pageId="home" hero={{layout:'split',title:'Septa'}}/>));
 expect(container.querySelector('.hero-feature-caption').getAttribute('href')).toBe('/projects/first');
 expect(container.querySelector('.hero-feature-caption').textContent).toContain('Explore project');
 expect(container.querySelector('.hero-carousel-controls')).toBeNull();
});
test('mobile contact expands and Escape closes the links',()=>{
 act(()=>root.render(<MobileContactBar/>));
 expect(container.querySelector('a')).toBeNull();
 act(()=>container.querySelector('button').click());
 expect(container.querySelectorAll('a')).toHaveLength(2);
 act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})));
 expect(container.querySelector('a')).toBeNull();
});
test('copy prompt includes actual requirements and transparency, independent of brand memory',async()=>{
 const writeText=jest.fn().mockResolvedValue();Object.defineProperty(navigator,'clipboard',{value:{writeText},configurable:true});
 act(()=>root.render(<MediaGuide field="logo_image"/>));
 expect(container.textContent).toContain('Required: 1:1');
 await act(async()=>container.querySelector('button').click());
 expect(writeText.mock.calls[0][0]).toContain('real alpha channel');
 expect(writeText.mock.calls[0][0]).toContain('#F6F6F3');
 expect(writeText.mock.calls[0][0]).toContain('REQUIRED EXPORT: 1:1');
});

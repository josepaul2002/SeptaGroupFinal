import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {PageHero} from './PageSections';
import VideoPlayer from './VideoPlayer';
import MediaDialog from './MediaDialog';
import ProjectExtras from './ProjectExtras';
import {confirmLeave,useUnsavedChanges} from '../hooks/useUnsavedChanges';

jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>,useLocation:()=>({search:''})}),{virtual:true});
jest.mock('./LanguageToggle',()=>({useLanguage:()=>({t:x=>typeof x==='string'?x:x?.en||''})}));
jest.mock('../hooks/useApi',()=>({useProjects:()=>({data:[{slug:'film',title:'Film project',image:'/film.jpg',media:{hero_video:'https://youtu.be/abcdefghijk'},status:'published',publication_reviewed:true,homepage_feature:{enabled:true,use_video:true}},{slug:'photo',title:'Photo project',image:'/photo.jpg',status:'published',publication_reviewed:true,homepage_feature:{enabled:true,use_video:true}}]}),useSiteSettings:()=>({settings:{appearance:{motion:'subtle'}}}),useApiData:()=>({data:[]}),getText:x=>x}));
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});container=document.createElement('div');document.body.append(container);root=createRoot(container);window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;};});
afterEach(()=>{act(()=>root.unmount());container.remove();jest.useRealTimers();});
test('homepage advances from a video slide and pause holds the current slide',()=>{
 jest.useFakeTimers();act(()=>root.render(<PageHero pageId="home" hero={{layout:'split',title:'Septa'}}/>));
 expect(container.querySelector('.hero-feature-caption').href).toContain('/film');
 expect(container.querySelector('iframe')).toBeNull();
 act(()=>jest.advanceTimersByTime(6100));
 expect(container.querySelector('.hero-feature-caption').href).toContain('/photo');
 act(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Pause').click());
 act(()=>jest.advanceTimersByTime(12000));expect(container.querySelector('.hero-feature-caption').href).toContain('/photo');
});
test('external videos load on demand; local videos retain native playback controls',()=>{
 act(()=>root.render(<VideoPlayer src="https://youtu.be/abcdefghijk" title="Studio film"/>));
 expect(container.querySelector('iframe')).toBeNull();
 act(()=>container.querySelector('button').click());
 expect(container.querySelector('iframe').src).toContain('youtube-nocookie.com/embed/abcdefghijk');
 expect(container.querySelector('iframe').src).toContain('controls=1');
 act(()=>root.render(<VideoPlayer src="/uploads/film.mp4" title="Uploaded film"/>));
 expect(container.querySelector('video').controls).toBe(true);expect(container.querySelector('video').loop).toBe(false);
});
test('media dialog traps keyboard focus and returns focus to the trigger',()=>{
 const trigger=document.createElement('button');document.body.append(trigger);trigger.focus();const close=jest.fn();
 act(()=>root.render(<MediaDialog label="Media" onClose={close}><button>First</button><button>Last</button></MediaDialog>));
 const buttons=container.querySelectorAll('button');expect(document.activeElement).toBe(buttons[0]);
 act(()=>buttons[0].dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true})));expect(document.activeElement).toBe(buttons[1]);
 act(()=>buttons[1].dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));expect(close).toHaveBeenCalledTimes(1);
 act(()=>root.render(null));expect(document.activeElement).toBe(trigger);trigger.remove();
});
test('project media mounts one category at a time',()=>{
 act(()=>root.render(<ProjectExtras title="School" media={{hero_video:'/uploads/film.mp4',tour_public:true,virtual_tour_url:'https://example.com/tour'}}/>));
 expect(container.querySelector('video')).not.toBeNull();expect(container.querySelector('a[href="https://example.com/tour"]')).toBeNull();
 act(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Explore the space').click());
 expect(container.querySelector('video')).toBeNull();expect(container.querySelector('a[href="https://example.com/tour"]')).not.toBeNull();
});
test('dirty editors require confirmation before a tab or close action',()=>{
 function Editor(){useUnsavedChanges(true);return <div>Editor</div>;}
 window.confirm=jest.fn(()=>false);act(()=>root.render(<Editor/>));expect(confirmLeave()).toBe(false);expect(window.confirm).toHaveBeenCalledTimes(1);act(()=>root.render(null));expect(confirmLeave()).toBe(true);
});

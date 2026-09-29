import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import RouteScroll from './RouteScroll';

let mockLocation={pathname:'/first',hash:''};
jest.mock('react-router-dom',()=>({useLocation:()=>mockLocation}),{virtual:true});

test('new pages start at the top and hash links retain their target',()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const scroll=jest.spyOn(window,'scrollTo').mockImplementation(()=>{});
  const element=document.createElement('div');document.body.append(element);
  const root=createRoot(element);
  act(()=>root.render(<RouteScroll/>));
  scroll.mockClear();
  mockLocation={pathname:'/second',hash:''};
  act(()=>root.render(<RouteScroll/>));
  expect(scroll).toHaveBeenCalledWith({top:0,left:0,behavior:'instant'});
  scroll.mockClear();
  mockLocation={pathname:'/first',hash:'#details'};
  act(()=>root.render(<RouteScroll/>));
  expect(scroll).not.toHaveBeenCalled();
  act(()=>root.unmount());element.remove();scroll.mockRestore();
});

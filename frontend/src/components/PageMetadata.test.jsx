import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import axios from 'axios';
import PageMetadata from './PageMetadata';
jest.mock('axios',()=>({get:jest.fn()}));
jest.mock('react-router-dom',()=>({useLocation:()=>({pathname:'/projects/school',search:''})}),{virtual:true});
jest.mock('../lib/cms',()=>({API:'/api',enquiryContext:jest.fn()}));
test('a metadata API failure preserves the server indexing policy',async()=>{
 global.IS_REACT_ACT_ENVIRONMENT=true;
 document.head.innerHTML='<meta name="robots" content="index, follow">';
 const container=document.createElement('div');document.body.append(container);const root=createRoot(container);
 axios.get.mockRejectedValue(new Error('API unavailable'));
 await act(async()=>root.render(<PageMetadata/>));
 expect(document.querySelector('meta[name="robots"]').content).toBe('index, follow');
 act(()=>root.unmount());container.remove();
});

import defaults from '../content/pageDefaults.json';
import { useApiData } from '../hooks/useApi';
import { useLocation } from 'react-router-dom';

export { defaults };
export const PAGE_PATHS = {home:'/',about:'/about',services:'/services',projects:'/projects',ecosystem:'/ecosystem',contact:'/contact',leaders:'/project-leaders'};
export const PAGE_NAMES = {home:'Home',about:'About',services:'What we do',projects:'Projects',ecosystem:'Collaborators',contact:'Contact',leaders:'Project leaders'};
export const SECTION_TYPES = {text:'Text + image',cards:'Capability cards',projects:'Projects',locations:'Where we work',process:'Working process',people:'Project leaders',stats:'Verified figures',faq:'Questions & answers',cta:'Call to action',testimonials:'Testimonials'};
export const bilingual = (en='') => ({en,ml:''});
export const newId = () => window.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
export const safeHref = value => typeof value === 'string' && !/[\\\u0000-\u0020]/.test(value) && (/^\/(?!\/)/.test(value) || /^(https:\/\/|mailto:|tel:|#)/.test(value)) ? value : '';

export function newItem() {
  return {id:newId(),title:bilingual(),subtitle:bilingual(),body:bilingual(),image_url:'',image_alt:'',link_url:'',link_label:bilingual('Explore'),tag:''};
}
export function newSection(type) {
  return {id:newId(),type,enabled:true,eyebrow:bilingual(),title:bilingual(SECTION_TYPES[type]),body:bilingual(),theme:'light',items:[],source:'manual',limit:3,selected_slugs:[],project_type:'',image_url:'',image_alt:'',link_url:type==='cta'?'/contact':'',link_label:bilingual('Discuss your project'),graphic_label:bilingual('Kerala')};
}
export function useSitePage(pageId) {
  const {search}=useLocation();
  const preview=new URLSearchParams(search).get('preview')==='true';
  const token=sessionStorage.getItem('septa-admin-token');
  const endpoint=preview&&token?`/admin/pages/${pageId}?preview=true`:`/site-pages/${pageId}`;
  const result=useApiData(endpoint,defaults[pageId]);
  return {...result,page:result.data?.version===2?result.data:defaults[pageId],preview:preview&&!!token};
}
export const defaultNavigation = [
  {key:'projects',label:'Projects',url:'/projects',header:true,footer:true},
  {key:'services',label:'What we do',url:'/services',header:true,footer:true},
  {key:'about',label:'About',url:'/about',header:true,footer:true},
  {key:'ecosystem',label:'Collaborators',url:'/ecosystem',header:false,footer:true},
  {key:'leaders',label:'Project leaders',url:'/project-leaders',header:false,footer:true},
  {key:'contact',label:'Contact',url:'/contact',header:false,footer:true},
];
export function navigationFor(settings,placement) {
  const links=Array.isArray(settings?.navigation)?settings.navigation:defaultNavigation;
  return links.filter(item=>item[placement]&&(Array.isArray(settings?.navigation)||settings?.nav_visibility?.[item.key]!==false)&&safeHref(item.url));
}

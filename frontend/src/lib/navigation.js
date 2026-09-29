import {contactLinks,mapAddressHref} from './contactLinks';
const safe = value => typeof value==='string' && !/[\\\u0000-\u0020]/.test(value) && (/^\/(?!\/)/.test(value)||/^(https:\/\/|mailto:|tel:|#)/.test(value)) ? value : '';
export const defaultFooterGroups=[{id:'explore',label:'Explore Septa'},{id:'people',label:'People & partnerships'},{id:'contact',label:'Start a conversation'},{id:'follow',label:'Find & follow us',show_address:true}];
export const defaultNavigation=[
 {key:'home',label:'Home',url:'/',header:false,mobile:true,footer:false,footer_group:'explore'},
 {key:'projects',label:'Projects',url:'/projects',header:true,mobile:true,footer:true,footer_group:'explore'},
 {key:'services',label:'What we do',url:'/services',header:true,mobile:true,footer:true,footer_group:'explore'},
 {key:'ecosystem',label:'Architects & collaborators',url:'/ecosystem',header:true,mobile:true,footer:true,footer_group:'people'},
 {key:'about',label:'About Septa',url:'/about',header:true,mobile:true,footer:true,footer_group:'explore'},
 {key:'contact',label:'Contact',url:'/contact',header:false,mobile:true,footer:false,footer_group:'contact'},
 {key:'leaders',label:'The Septa team',url:'/project-leaders',header:false,mobile:true,mobile_group:'secondary',footer:true,footer_group:'people'},
 {key:'locations',label:'Where we work',url:'/about#coverage',header:false,mobile:true,mobile_group:'secondary',footer:true,footer_group:'explore'},
 {key:'collaborate',label:'Collaborate with Septa',url:'/contact?enquiry_type=collaboration',header:false,mobile:true,mobile_group:'secondary',footer:true,footer_group:'people'},
 {key:'discuss',label:'Discuss a project',url:'/contact',header:false,mobile:false,footer:true,footer_group:'contact'},
 {key:'introduction',label:'Request an introduction',url:'/contact?enquiry_type=introduction',header:false,mobile:false,footer:true,footer_group:'contact'},
 ...[['call','Call Septa','contact'],['whatsapp','WhatsApp','contact'],['email','Email','contact'],['map','Directions','follow'],['facebook','Facebook','follow'],['instagram','Instagram','follow']].map(([key,label,footer_group])=>({key,label,source:key,url:'',header:false,mobile:false,footer:true,footer_group}))
];
export function editableNavigation(settings){
 const old=Array.isArray(settings?.navigation)?settings.navigation:defaultNavigation;
 const links=old.map(item=>({...defaultNavigation.find(d=>d.key===item.key),...item,mobile:item.mobile??(item.header||['ecosystem','leaders','contact'].includes(item.key)),footer_group:item.footer_group||defaultNavigation.find(d=>d.key===item.key)?.footer_group||'explore'}));
 if(!Array.isArray(settings?.navigation))return defaultNavigation.map(item=>({...item,header:item.header&&settings?.nav_visibility?.[item.key]!==false,mobile:item.mobile&&settings?.nav_visibility?.[item.key]!==false,footer:item.footer&&settings?.nav_visibility?.[item.key]!==false}));
 if(settings.navigation_version!==2) for(const item of defaultNavigation)if(!links.some(l=>l.key===item.key))links.push({...item});
 return links;
}
export function navigationFor(settings,placement){
 const contact=settings?.contact||{},actions=contactLinks(contact,'Hello Septa, I would like to discuss a project.');
 const sources={...actions,map:mapAddressHref(contact.office_address,contact.map_link),facebook:contact.facebook_url,instagram:contact.instagram_url};
 return editableNavigation(settings).map(item=>({...item,url:safe(item.source?sources[item.source]:item.url)})).filter(item=>item[placement]&&item.url);
}
export const footerGroupsFor=settings=>Array.isArray(settings?.footer_groups)?settings.footer_groups:defaultFooterGroups;

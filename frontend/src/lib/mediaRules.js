// All newly selected image files and changed image URLs share these field rules.
export const mediaRules = {
 portrait_image:[4/5,'4:5',600,'1200 × 1500'],
 testimonial_portrait:[1,'1:1',600,'1200 × 1200'],
 logo_image:[1,'1:1',256,'1024 × 1024'],
 social_image:[1.91,'1.91:1',600,'1200 × 628'],
 virtual_tour_image:[2,'2:1',1200,'4096 × 2048'],
 ...Object.fromEntries(['card_image','hero_image','gallery_images','video_poster','project_cover','project_gallery','project_render','testimonial_cover','page_hero','page_image','public_plan','page_video','partner_video','project_video'].map(key=>[key,[16/9,'16:9',600,'1920 × 1080']]))
};
export const ratioName=field=>mediaRules[field]?.[1]||'16:9';
export function dimensionIssue(width,height,field){
 const [ratio,name,min]=mediaRules[field]||mediaRules.page_image;
 // Allow at most a single pixel of integer-export rounding.
 if(!width||!height||Math.abs(width-ratio*height)>Math.max(1,ratio))return `${name} required. This image is ${width} × ${height}. Crop or pad to ${name}, then try again.`;
 if(width<min)return `Use an image at least ${min}px wide. This image is ${width}px wide.`;
 return '';
}
function inspect(src,field,isVideo=false){
 return new Promise(resolve=>{
  const element=isVideo?document.createElement('video'):new Image();
  const finish=issue=>{clearTimeout(timer);element.onload=null;element.onloadedmetadata=null;element.onerror=null;resolve(issue);};
  const timer=setTimeout(()=>finish('Could not verify this media within 12 seconds. Upload the file directly or check the image link.'),12000);
  element[isVideo?'onloadedmetadata':'onload']=()=>finish(dimensionIssue(isVideo?element.videoWidth:element.naturalWidth,isVideo?element.videoHeight:element.naturalHeight,field));
  element.onerror=()=>finish('Could not read this media. Use a direct image URL or upload JPG, PNG or WebP.');
  if(isVideo)element.preload='metadata';element.src=src;
 });
}
const checkedFiles=new WeakMap();
export async function validateMediaRatio(file,field='page_image'){
 if(!file)return 'Choose a file.';
 if(!file.type.startsWith('image/')&&!file.type.startsWith('video/'))return null;
 if(checkedFiles.get(file)?.has(field))return null;
 const url=URL.createObjectURL(file);
 try{const issue=await inspect(url,field,file.type.startsWith('video/'));if(!issue){if(!checkedFiles.has(file))checkedFiles.set(file,new Set());checkedFiles.get(file).add(field);}return issue;}finally{URL.revokeObjectURL(url);}
}
const verified=new Set();
export function rememberImage(url,field){verified.add(`${field}:${url}`);}
export async function validateImageUrl(url,field){
 if(!url)return '';
 if(!(/^(https:\/\/|\/(?!\/))/.test(url))||/[\\\s]/.test(url))return 'Use a direct HTTPS image URL or an uploaded image path.';
 if(field==='public_plan'&&/\.pdf(?:[?#]|$)/i.test(url))return '';
 const key=`${field}:${url}`;
 if(verified.has(key))return '';
 const issue=await inspect(url,field);if(!issue)verified.add(key);return issue;
}
export function imageSlots(record={},kind){
 record=record||{};
 const slots=[];const add=(value,field,label)=>{if(value)slots.push({url:value,field,label});};
 add(record.seo?.image,'social_image','Search & social image');
 if(kind==='partner'){
  const m=record.media||{};
  for(const key of ['portrait_image','card_image','logo_image','hero_image'])add(m[key],key,key.replaceAll('_',' '));
  for(const [key,field] of [['card_images','card_image'],['gallery_images','gallery_images'],['video_posters','video_poster']]) (m[key]||[]).forEach((url,i)=>add(url,field,`${key.replaceAll('_',' ')} ${i+1}`));
 }else if(kind==='project'){
  add(record.image,'project_cover','Project cover');add(record.media?.hero_poster,'video_poster','Film cover');
  (record.gallery||[]).forEach(url=>add(url,'project_gallery','Gallery'));
  for(const [key,field] of [['images','project_gallery'],['plans','public_plan'],['renders_3d','project_render']])(record.media?.[key]||[]).forEach((item,i)=>{if(item.kind!=='video')add(typeof item==='string'?item:item.url,field,`${key} ${i+1}`);});
 }else if(kind==='testimonial'){add(record.profile_image,'testimonial_portrait','Client portrait');add(record.cover_image,'testimonial_cover','Testimonial cover');}
 else if(kind==='leader')add(record.photo,'portrait_image','Leader portrait');
 else if(kind==='settings')add(record.brand?.logo_url,'logo_image','Company logo');
 else if(kind==='page'){
  add(record.hero?.image_url,'page_hero','Opening image');
  (record.hero?.slides||[]).forEach((s,i)=>add(s.image_url,'page_hero',`Slide ${i+1}`));
  (record.sections||[]).forEach(s=>{add(s.image_url,'page_image','Section image');(s.items||[]).forEach(i=>add(i.image_url,'page_image','Card image'));});
 }
 return slots;
}
export async function validateRecordImages(record,original,kind){
 // Existing media remain editable; new or replaced assets must pass the new rules.
 const old=new Set(imageSlots(original,kind).map(x=>`${x.field}:${x.url}`));
 const changed=imageSlots(record,kind).filter(x=>!old.has(`${x.field}:${x.url}`));
 for(let start=0;start<changed.length;start+=4){
  const batch=changed.slice(start,start+4);
  const results=await Promise.all(batch.map(x=>validateImageUrl(x.url,x.field)));
  const i=results.findIndex(Boolean);if(i!==-1)throw new Error(`${batch[i].label}: ${results[i]}`);
 }
}

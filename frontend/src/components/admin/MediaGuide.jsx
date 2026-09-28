import {useState} from 'react';

const base = 'Edit my attached source image for a premium Septa Group construction and architecture website. Keep the actual person, building, design, materials and attribution truthful. Improve the composition, camera alignment, clarity, natural lighting and tonal balance. Match a minimal black, warm ivory and muted brass visual identity, with realistic walnut and restrained greens. Avoid CGI, invented architectural features, changed faces, added logos, text and watermarks. Do not erase existing photographer credits. Deliver a clean, high-resolution image with the requested composition and no text overlay.';
const directions = {
  portrait_image: 'Portrait, 4:5. Preserve facial identity exactly. Show the person from the chest up, comfortable headroom, natural confident expression and soft neutral background. Leave room around the face for cropping on mobile.',
  card_image: 'Landscape, 16:9. This is the wide collaborator card, distinct from the person portrait. Choose an authentic work or studio image representing the collaborator, place the subject in the safe central 70%, and keep all important features visible.',
  logo_image: 'Square, 1:1. Use the supplied original logo without altering its letters, symbol or colors. Center it with generous transparent padding. If no original logo exists, do not invent one.',
  hero_image: 'Wide landscape, 16:9. Compose a compelling full-width architectural hero with the important subject near the center and breathing room for an overlaid title. Keep structural lines level and preserve the real design.',
  gallery_images: 'Landscape, 16:9. Make a single coherent portfolio gallery photograph. Center the important architectural features and preserve the distinct identity of this project. Edit each of the up to ten originals individually with the same restrained grading; do not merge different projects or turn renders into built photographs.'
};
const ratios = {portrait_image:4/5,card_image:16/9,logo_image:1,hero_image:16/9,gallery_images:16/9};
const names = {portrait_image:'4:5',card_image:'16:9',logo_image:'1:1',hero_image:'16:9',gallery_images:'16:9'};
export function ratioName(field){return names[field];}
export async function validateMediaRatio(file,field){
  const required=ratios[field];
  if(!required || !file.type.startsWith('image/'))return null;
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
    const actual=image.naturalWidth/image.naturalHeight;
    if(Math.abs(actual/required-1)>.025)return `${names[field]} image required. This image is ${image.naturalWidth} × ${image.naturalHeight}. Crop or export it to ${names[field]}, then upload again.`;
    if(image.naturalWidth<600)return `Image is only ${image.naturalWidth}px wide. Please use at least 600px for a clear profile image.`;
    return null;
  } finally { URL.revokeObjectURL(url); }
}
export default function MediaGuide({field,index}){
 const [copied,setCopied]=useState(false);
 const copy=async()=>{try{await navigator.clipboard.writeText(`${base}\n\n${directions[field]}${index!=null?`\n\nThis is gallery image ${index+1} of up to ten; keep its original project identity and use the same grading as the other gallery images.`:''}`);setCopied(true);setTimeout(()=>setCopied(false),2500);}catch{setCopied(false);}};
 return <div className="mt-2 flex flex-wrap items-center gap-3 text-xs"><span className="text-[#606060]">Required image shape: <strong>{names[field]}</strong></span><button type="button" onClick={copy} className="underline underline-offset-4 font-medium text-[#050505]">{copied?'Prompt copied':'Copy AI editing prompt'}</button><span className="text-[#606060]">Attach the original photo with the prompt. Check the edited result before publishing.</span></div>;
}

const fs=require('node:fs'),assert=require('node:assert/strict');
global.window={location:{origin:'http://localhost:8000'}};
async function load(file){return import('data:text/javascript;base64,'+fs.readFileSync(file).toString('base64'));}
(async()=>{
 const {modelSource}=await load('frontend/src/lib/modelSource.js');
 const id='0123456789abcdef0123456789abcdef';
 for(const url of [`https://sketchfab.com/3d-models/house-${id}`,`https://sketchfab.com/models/${id}/embed?ui_infos=0`]){
   assert.equal(modelSource(url).type,'sketchfab');assert.ok(modelSource(url).src.startsWith(`https://sketchfab.com/models/${id}/embed`));
 }
 for(const url of ['javascript:alert(1)','data:text/html,hi','https://sketchfab.com.evil.example/models/'+id,'https://user:pass@sketchfab.com/models/'+id,'https://sketchfab.com/3d-models/no-id','https://example.com/house'])assert.equal(modelSource(url),null);
 assert.equal(modelSource('/uploads/house.glb').src,'http://localhost:8000/uploads/house.glb');
 assert.equal(modelSource('https://cdn.example/house.gltf?version=2').type,'file');
 const {contactLinks}=await load('frontend/src/lib/contactLinks.js');
 const links=contactLinks({phone_display:'+91 (90000) 00000',whatsapp_number:'+91 90000 00000',email:'team@example.com'},'Meet A & B');
 assert.equal(links.call,'tel:+919000000000');assert.equal(new URL(links.whatsapp).searchParams.get('text'),'Meet A & B');
 assert.ok(links.email.includes('Meet%20A%20%26%20B'));
 assert.deepEqual(contactLinks({whatsapp_link:'javascript:alert(1)',email:'bad',phone_display:'none'}),{call:'',whatsapp:'',email:''});
 console.log('PASS model provider parsing, unsafe URL rejection, local GLB support and contact link encoding');
})().catch(e=>{console.error(e);process.exitCode=1;});

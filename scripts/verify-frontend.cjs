/* Execute the production bundle against controlled API fixtures. No external services. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole,ResourceLoader}=require('../frontend/node_modules/jsdom');
const defaults=require('../frontend/src/content/pageDefaults.json');
const build=path.join(__dirname,'../frontend/build');
const pages=JSON.parse(JSON.stringify(defaults));
pages.about.hero.title={en:'Construction, with clarity.',ml:''};
const coverage=pages.about.sections.find(s=>s.type==='locations');
coverage.items=[{id:'test-north',title:{en:'Test North'},body:{en:'Northern test coverage'},tag:'Test North'},{id:'test-south',title:{en:'Test South'},body:{en:'Southern test coverage'},tag:'Test South'}];
const settings={contact:{operating_districts:[],phone_display:'+91 90000 00000',whatsapp_number:'+91 90000 00000',email:'contact@example.com',facebook_url:'https://www.facebook.com/example'},enquiry:{project_types:['Commercial'],budget_ranges:[],timeline_ranges:[]},content_language_mode:'english_only',navigation:[{key:'about',label:'Our company',url:'/about',header:true,footer:true}],brand:{name:'SEPTA GROUP',cta_label:'Discuss your project',cta_url:'/contact'}};
let projectError=false,malformed=false,requests=[],server,origin;
function respond(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));}
server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),p=url.pathname;
 if(p.startsWith('/api/')){
  if(malformed){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<html>SPA fallback</html>');}
  if(req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;
   if(p==='/api/upload'){requests.push({path:p,upload:true});return respond(res,{url:'/uploads/test-cover.jpg',key:'test-cover.jpg'});}
   requests.push({path:p,body:JSON.parse(body)});
   return respond(res,{message:'Request received'});
  }
  if(req.method==='PUT'&&p==='/api/projects/test-office'&&projectError)return respond(res,{detail:{issues:['Add the project location and Septa delivery scope.']}},422);
  if(req.method==='PUT'){let body='';for await(const chunk of req)body+=chunk;requests.push({path:p,body:JSON.parse(body)});return respond(res,{message:'Draft saved; the published version is unchanged',updated_at:'2026-09-28T02:00:00+00:00'});}
  if(p==='/api/settings')return respond(res,settings);
  if(p==='/api/admin/me')return respond(res,{email:'test@example.com',role:'owner',id:'test-owner'});
  if(p==='/api/seo')return respond(res,{title:'Septa Group',robots:'noindex, nofollow',description:'Test content'});
  if(p.startsWith('/api/site-pages/')||p.startsWith('/api/admin/pages/'))return respond(res,pages[p.split('/').pop()]||[]);
  if(p==='/api/partners')return respond(res,[{slug:'test-architect',name:{en:'Test Architect'},category:'Architecture & Design',status:'draft',media:{card_image:'/uploads/portrait.jpg'}}]);
  if(p==='/api/partners/test-architect')return respond(res,{slug:'test-architect',name:{en:'Test Architect'},category:'Architecture & Design',facebook_url:'https://www.facebook.com/testarchitect',media:{}});
  if(p==='/api/projects/test-office')return respond(res,{slug:'test-office',title:{en:'Test Office'},type:'Commercial',location:'Test North',media:{model_3d:'https://sketchfab.com/3d-models/house-0123456789abcdef0123456789abcdef'},credits:[]});
  if(p==='/api/leaders')return respond(res,[{slug:'test-leader',name:{en:'Test Leader'},title:{en:'Project lead'},bio:{en:'Test biography'}}]);
  if(p==='/api/leaders/test-leader')return respond(res,{slug:'test-leader',name:{en:'Test Leader'},title:{en:'Project lead'},bio:{en:'Test biography'}});
  if(p==='/api/projects')return respond(res,[{slug:'test-office',title:{en:'Test Office'},type:'Commercial',location:'Test North',credits:[]},{slug:'test-house',title:{en:'Test House'},type:'Residential',location:'Test South',credits:[]}]);
  return respond(res,[]);
 }
 const file=path.join(build,decodeURIComponent(p));
 if(file.startsWith(build+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile()){res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':p.endsWith('.png')?'image/png':'text/html');return fs.createReadStream(file).pipe(res);}
 res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(build,'index.html')));
});
class LocalResources extends ResourceLoader{fetch(url,options){return url.startsWith(origin)?super.fetch(url,options):null;}}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<100;i++){if(fn())return;await pause(30);}throw new Error('Timed out waiting for the rendered UI');}
async function page(url,admin=false){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|navigation|window.scrollTo/.test(e.message))errors.push(e.message);});const dom=await JSDOM.fromURL(origin+url,{resources:new LocalResources(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.TextEncoder=TextEncoder;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.IntersectionObserver=class{observe(el){el.classList.add('visible');}unobserve(){}disconnect(){}};w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};if(admin)w.sessionStorage.setItem('septa-admin-token','local-test-token');}});return {dom,doc:dom.window.document,errors};}
function byButton(doc,label){return [...doc.querySelectorAll('button')].find(b=>b.textContent.trim()===label);}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const route of ['/','/about','/services','/contact','/ecosystem','/projects?type=Commercial']){
   const {dom,doc,errors}=await page(route);try{await until(()=>doc.querySelector('h1'));await pause(150);assert.ok(doc.body.textContent.length>150);assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(errors.length,0,errors.join('\n'));assert.equal(doc.querySelector('header nav a').textContent,'Our company');
    if(route==='/about'){assert.equal(doc.querySelector('h1').textContent,'Construction, with clarity.');const south=byButton(doc,'Test South');assert.ok(south);south.click();await until(()=>doc.querySelector('.location-description').textContent.includes('Southern test coverage'));assert.equal(south.getAttribute('aria-pressed'),'true');}
    if(route.includes('?type=')){assert.ok(doc.querySelector('[data-testid="projects-grid"]').textContent.includes('Test Office'));assert.ok(!doc.querySelector('[data-testid="projects-grid"]').textContent.includes('Test House'));}
    console.log(`PASS ${route}: content, shared navigation, no runtime exception`);
   }finally{dom.window.close();}
  }
  {const {dom,doc,errors}=await page('/project-leaders');try{await until(()=>doc.querySelector('a[href="/project-leaders/test-leader"]'));doc.querySelector('a[href="/project-leaders/test-leader"]').click();await until(()=>doc.querySelector('h1')?.textContent==='Test Leader');doc.querySelector('a[href="/project-leaders"]').click();await until(()=>doc.querySelector('a[href="/project-leaders/test-leader"]'));assert.equal(errors.length,0,errors.join('\n'));console.log('PASS leader listing/profile round trip: response shapes stay valid');}finally{dom.window.close();}}
  const {dom,doc,errors}=await page('/admin',true);try{
   await until(()=>doc.querySelector('.page-editor textarea'));assert.equal(doc.querySelectorAll('.site-header,.site-footer').length,0);
   const label=[...doc.querySelectorAll('label')].find(l=>l.textContent==='Page heading · English');const input=doc.getElementById(label.htmlFor);
   Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(input,'Edited in admin');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
   byButton(doc,'Save draft').click();await until(()=>requests.length>0);assert.equal(requests.at(-1).body.hero.title.en,'Edited in admin');assert.equal(requests.at(-1).body.status,'draft');assert.equal(requests.at(-1).body.publication_reviewed,false);
   await until(()=>doc.querySelector('.editor-success'));byButton(doc,'Preview').click();await until(()=>doc.querySelector('iframe'));assert.equal(JSON.parse(dom.window.sessionStorage.getItem('septa-page-preview')).page.hero.title.en,'Edited in admin');
   assert.equal(errors.length,0,errors.join('\n'));console.log('PASS admin: editable heading, draft payload, unsaved preview, separate workspace');
  }finally{dom.window.close();}

  {const {dom,doc,errors}=await page('/contact?partner=test-architect');try{
    await until(()=>doc.querySelector('[data-testid="contact-whatsapp"]'));
    await until(()=>doc.querySelector('[data-testid="contact-whatsapp"]').href.includes('Test+Architect'));
    assert.equal(doc.querySelector('[data-testid="contact-call"]').getAttribute('href'),'tel:+919000000000');
    assert.match(decodeURIComponent(doc.querySelector('[data-testid="contact-email"]').href),/Test Architect/);
    assert.equal(doc.querySelectorAll('form input[required]').length,2);
    for(const [field,value] of [['name','Test Visitor'],['phone','9000000000']]){
      const input=doc.querySelector(`[data-testid="input-${field}"]`);Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
    }
    await pause(30);doc.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
    await until(()=>doc.querySelector('[data-testid="contact-success"]'));
    const sent=requests.findLast(r=>r.path==='/api/leads').body;assert.equal(sent.partner_ref,'test-architect');assert.equal(sent.enquiry_type,'introduction');assert.equal(sent.email,'');
    assert.equal(errors.length,0,errors.join('\n'));console.log('PASS direct call/WhatsApp/email + name/phone callback preserve architect context');
  }finally{dom.window.close();}}
  {const {dom,doc}=await page('/ecosystem/test-architect');try{await until(()=>doc.querySelector('a[href="https://www.facebook.com/testarchitect"]'));console.log('PASS architect Facebook link appears on public profile');}finally{dom.window.close();}}
  {const {dom,doc,errors}=await page('/admin',true);try{
    await until(()=>doc.querySelector('[data-testid="tab-projects"]'));doc.querySelector('[data-testid="tab-projects"]').click();
    await until(()=>doc.querySelector('[data-testid="edit-project-test-office"]'));doc.querySelector('[data-testid="edit-project-test-office"]').click();await until(()=>byButton(doc,'Media'));byButton(doc,'Media').click();await pause(30);
    const input=doc.querySelector('input[type="file"]');Object.defineProperty(input,'files',{value:[new dom.window.File(['test-image'],'cover.jpg',{type:'image/jpeg'})]});input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
    await until(()=>doc.querySelector('img[alt="Cover preview"]')?.getAttribute('src')==='/uploads/test-cover.jpg');
    projectError=true;byButton(doc,'Save project').click();await until(()=>doc.querySelector('[role="alert"]')?.textContent.includes('Septa delivery scope'));
    assert.ok(doc.querySelector('img[alt="Cover preview"]'));projectError=false;byButton(doc,'Save project').click();await until(()=>!doc.querySelector('[aria-label="Project editor"]'));
    assert.equal(requests.findLast(r=>r.path==='/api/projects/test-office').body.image,'/uploads/test-cover.jpg');
    doc.querySelector('[data-testid="tab-partners"]').click();await until(()=>doc.querySelector('[data-testid="partner-row-test-architect"] button[title="Edit"]'));doc.querySelector('[data-testid="partner-row-test-architect"] button[title="Edit"]').click();
    await until(()=>byButton(doc,'Media'));byButton(doc,'Media').click();await pause(30);
    const uploaded=doc.querySelector('input[value="/uploads/portrait.jpg"]');assert.ok(uploaded);assert.notEqual(uploaded.type,'url');assert.equal(uploaded.checkValidity(),true);
    assert.equal(errors.length,0,errors.join('\n'));console.log('PASS upload returns relative URL, failed project save retains edits, retry saves, partner image path validates');
  }finally{projectError=false;dom.window.close();}}
  {const {dom,doc,errors}=await page('/projects/test-office');try{await until(()=>byButton(doc,'Media'));byButton(doc,'Media').click();await until(()=>doc.querySelector('[data-testid="view-3d-btn"]'));doc.querySelector('[data-testid="view-3d-btn"]').click();await until(()=>doc.querySelector('iframe[title*="Sketchfab"]'));assert.match(doc.querySelector('iframe[title*="Sketchfab"]').src,/sketchfab.com\/models\/0123456789abcdef0123456789abcdef\/embed/);assert.equal(errors.length,0,errors.join('\n'));console.log('PASS ordinary Sketchfab model page becomes an embedded viewer, with external fallback');}finally{dom.window.close();}}
  {const {dom,doc,errors}=await page('/admin/recover#token='+ 't'.repeat(43));try{await until(()=>doc.querySelector('h1')?.textContent==='Set a new password');assert.equal(dom.window.location.hash,'');
    const inputs=doc.querySelectorAll('input[type="password"]');for(const input of inputs){Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'test-password-123');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));}await pause(30);
    doc.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await until(()=>doc.querySelector('[role="status"]'));
    assert.equal(requests.findLast(r=>r.path==='/api/admin/reset-password').body.token,'t'.repeat(43));assert.equal(errors.length,0,errors.join('\n'));console.log('PASS recovery token removed from address bar and submitted with confirmed password');
  }finally{dom.window.close();}}
  malformed=true;for(const route of ['/','/about','/contact']){const {dom,doc,errors}=await page(route);try{await until(()=>doc.querySelector('h1'));await pause(180);assert.ok(doc.querySelector('h1'));assert.equal(errors.length,0,errors.join('\n'));console.log(`PASS ${route}: HTML API fallback does not blank the page`);}finally{dom.window.close();}}
 }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

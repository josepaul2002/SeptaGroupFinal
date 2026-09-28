/* Dependency-free visual preview. Real editing and enquiries require start-local.sh. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'frontend/build');
const pages=require('./frontend/src/content/pageDefaults.json');
const pagePaths={'/':'home','/about':'about','/services':'services','/projects':'projects','/ecosystem':'ecosystem','/project-leaders':'leaders','/contact':'contact'};
const server=http.createServer((req,res)=>{
 let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);return res.end();}
 const p=url.pathname;
 if(p==='/solution-packs'){res.writeHead(301,{Location:'/services'});return res.end();}
 if(p.startsWith('/api/')){
  res.setHeader('Content-Type','application/json');
  let data=[];
  if(req.method!=='GET'||p.startsWith('/api/admin')){res.writeHead(503);return res.end(JSON.stringify({detail:'This is a design preview. Start the Python server to edit content or submit enquiries.'}));}
  if(p==='/api/settings')data={contact:{operating_districts:[]},enquiry:{project_types:[],budget_ranges:[],timeline_ranges:[]},content_language_mode:'english_only'};
  else if(p.startsWith('/api/site-pages/'))data=pages[p.split('/').pop()]||{};
  else if(p==='/api/seo'){const page=pages[pagePaths[url.searchParams.get('path')]];data={title:(page?.hero.title.en||'Septa Group').replace(/\n/g,' '),description:page?.hero.body.en||'',robots:'noindex, nofollow'};}
  res.end(JSON.stringify(data));return;
 }
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(p));}catch{res.writeHead(400);return res.end();}
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'index.html');
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
 res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port 4173 is already in use. Stop the previous preview and try again.':error.message);process.exitCode=1;});
server.listen(4173,'127.0.0.1',()=>console.log('Design preview: http://localhost:4173\nFull website + admin: stop this preview and run bash start-local.sh\nPress Control-C to stop.'));

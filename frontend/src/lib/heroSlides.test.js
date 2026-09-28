import {homepageSlides} from './heroSlides';
const project=(slug,extra={})=>({slug,status:'published',publication_reviewed:true,image:`/${slug}.jpg`,...extra});
test('project selections take precedence, preserve order, and exclude unreviewed drafts',()=>{
 const list=[project('b',{homepage_feature:{enabled:true,order:2}}),project('a',{homepage_feature:{enabled:true,order:1}}),project('draft',{status:'draft',homepage_feature:{enabled:true,order:0}}),project('hidden',{publication_reviewed:false,homepage_feature:{enabled:true,order:0}})];
 expect(homepageSlides({slides:[{image_url:'/custom.jpg'}]},list).map(x=>x.project_slug)).toEqual(['a','b']);
});
test('fallback slides keep their own project cover and film requires explicit selection',()=>{
 const slides=homepageSlides({image_url:'/intro.jpg',featured_project_slug:'a'},[project('a'),project('b',{media:{hero_video:'https://youtu.be/example',hero_poster:'/poster.jpg'}})]);
 expect(slides.map(x=>x.image_url)).toEqual(['/intro.jpg','/b.jpg']);expect(slides[1].video_url).toBe('');
});
test('manual project slides resolve their own cover and filter unavailable project links',()=>{
 const slides=homepageSlides({slides:[{project_slug:'a'},{project_slug:'missing',image_url:'/bad.jpg'}]},[project('a')]);
 expect(slides).toHaveLength(1);expect(slides[0].image_url).toBe('/a.jpg');
});
test('carousel has at most six visible projects',()=>expect(homepageSlides({},Array.from({length:9},(_,i)=>project(String(i))))).toHaveLength(6));

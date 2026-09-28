import {dimensionIssue,imageSlots,validateRecordImages} from './mediaRules';
test('strict ratios allow pixel rounding and reject unsuitable images',()=>{
 expect(dimensionIssue(1920,1080,'project_cover')).toBe('');
 expect(dimensionIssue(1200,628,'social_image')).toBe('');
 expect(dimensionIssue(1000,1000,'testimonial_cover')).toContain('16:9');
 expect(dimensionIssue(800,1000,'portrait_image')).toBe('');
 expect(dimensionIssue(320,180,'project_cover')).toContain('600px');
});
test('all editable media destinations are discoverable, including URL inputs',()=>{
 expect(imageSlots({profile_image:'/person.png',cover_image:'/work.png'},'testimonial').map(x=>x.field)).toEqual(['testimonial_portrait','testimonial_cover']);
 expect(imageSlots({seo:{image:'/social.png'},media:{hero_poster:'/film.png',images:[{url:'/gallery.png'}],plans:[{url:'/plan.pdf'}],renders_3d:[{url:'/render.png'}]}},'project')).toHaveLength(5);
 expect(imageSlots({hero:{image_url:'/hero.png',slides:[{image_url:'/slide.png'}]},sections:[{image_url:'/section.png',items:[{image_url:'/item.png'}]}]},'page')).toHaveLength(4);
});
test('unchanged legacy media do not block a text edit, while unsafe new URLs fail',async()=>{
 const legacy={profile_image:'http://old.example/person.jpg'};
 await expect(validateRecordImages({...legacy,client_name:'Changed'},legacy,'testimonial')).resolves.toBeUndefined();
 await expect(validateRecordImages({profile_image:'javascript:alert(1)'},null,'testimonial')).rejects.toThrow('HTTPS');
});

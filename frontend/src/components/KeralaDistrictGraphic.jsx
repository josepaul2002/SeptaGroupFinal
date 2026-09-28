const districts=['Kasaragod','Kannur','Wayanad','Kozhikode','Malappuram','Palakkad','Thrissur','Ernakulam','Idukki','Kottayam','Alappuzha','Pathanamthitta','Kollam','Thiruvananthapuram'];
const aliases={calicut:'Kozhikode',kochi:'Ernakulam',trivandrum:'Thiruvananthapuram'};
const name=item=>(item?.tag||item?.title?.en||'').trim();
export const isKeralaDistrict=item=>districts.some(d=>d.toLowerCase()===name(item).toLowerCase())||!!aliases[name(item).toLowerCase()];
export default function KeralaDistrictGraphic({items=[],active,setSelected,projects=[],t}){
 const available=items.filter(isKeralaDistrict);
 const normalise=s=>aliases[s.toLowerCase()]||districts.find(d=>d.toLowerCase()===s.toLowerCase())||s;
 const known=new Map(available.map(item=>[normalise(name(item)),item]));
 return <div className="district-graphic" aria-label="Kerala district directory"><div className="district-graphic-top"><span>KERALA / DISTRICTS</span><small>Illustrative north-to-south directory</small></div><div className="district-graphic-list">{districts.map((district,i)=>{const item=known.get(district);const count=projects.filter(project=>(project.location||'').toLowerCase().includes(district.toLowerCase())).length;return item?<button type="button" key={district} className={active?.id===item.id?'selected':''} aria-pressed={active?.id===item.id} onClick={()=>setSelected(item.id)}><span className="district-index">{String(i+1).padStart(2,'0')}</span><span className="district-name">{t(item.title)||district}</span><span className="district-count">{count?`${count} published project${count===1?'':'s'}`:'Location details'}</span></button>:null;})}</div><small className="district-graphic-foot">Only districts entered in Website Studio appear here. Project counts use published case studies.</small></div>;
}

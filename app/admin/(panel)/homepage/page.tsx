import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SECTIONS,mergeContent } from "@/lib/sections";
import { ActionForm } from "@/components/admin/forms";
import { PageHeader,Panel } from "@/components/admin/kit";
import { saveHomepage } from "@/lib/actions/admin/homepage";
export default async function HomepagePage(){
  await requireStaff("manage_appearance");
  const stored=await prisma.section.findMany({where:{page:"home"}});
  const defs=SECTIONS.filter(s=>s.page==="home").sort((a,b)=>(stored.find(s=>s.key===a.key)?.sortOrder??a.order)-(stored.find(s=>s.key===b.key)?.sortOrder??b.order));
  return <><PageHeader title="سازنده صفحه اصلی"/><div className="grid gap-4">{defs.map(def=>{const row=stored.find(s=>s.key===def.key);const c=mergeContent(def,row?.content);return <Panel key={def.key} title={def.label}><details><summary>{def.description}</summary><ActionForm action={saveHomepage.bind(null,def.key)}><label><input name="visible" type="checkbox" defaultChecked={row?.visible??true}/> نمایش بخش</label><label>ترتیب<input type="number" name="sortOrder" className="admin-field" defaultValue={row?.sortOrder??def.order}/></label>{def.fields.map(f=><label key={f.key}>{f.label}{f.type==="boolean"?<input type="checkbox" name={f.key} defaultChecked={Boolean(c[f.key])}/>:f.type==="select"?<select name={f.key} className="admin-field" defaultValue={String(c[f.key]??"")}>{f.options?.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>:f.type==="list"||f.type==="textarea"?<textarea className="admin-field" rows={4} name={f.key} defaultValue={f.type==="list"?JSON.stringify(c[f.key]??[],null,2):String(c[f.key]??"")}/>:<input className="admin-field" name={f.key} type={f.type==="number"?"number":"text"} defaultValue={String(c[f.key]??"")}/>}</label>)}<button className="bg-primary text-white rounded-lg p-2">ذخیره بخش</button></ActionForm></details></Panel>})}</div></>;
}

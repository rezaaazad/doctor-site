import { ActionForm } from "@/components/admin/forms";
import { BlockEditor } from "@/components/admin/block-editor";
import { saveEditorial,restoreEditorial } from "@/lib/actions/admin/content";
import { prisma } from "@/lib/db";
import { Panel } from "@/components/admin/kit";
const input="rounded-lg border border-line bg-surface px-3 py-2 text-fg w-full";
export async function EditorialForm({kind,id=""}:{kind:"post"|"page";id?:string}){
  const post=kind==="post"&&id?await prisma.blogPost.findUnique({where:{id},include:{terms:true}}):null;
  const page=kind==="page"&&id?await prisma.landingPage.findUnique({where:{id}}):null;
  const item=post??page;
  const terms=kind==="post"?await prisma.term.findMany({orderBy:{name:"asc"}}):[];
  const revisions=id?await prisma.revision.findMany({where:{entityType:kind,entityId:id},orderBy:{createdAt:"desc"},take:30}):[];
  const date=post?.publishedAt??page?.publishAt;
  const status=post?.published&&date&&date>new Date()?"scheduled":item?.status??"draft";
  return <div className="grid gap-4"><Panel><ActionForm action={saveEditorial.bind(null,kind,id)}>
    <label>عنوان<input className={input} name="title" defaultValue={item?.title} required/></label>
    <label>نامک<input className={input} name="slug" defaultValue={item?.slug} required/></label>
    {kind==="page"&&<label>عنوان صفحه<input className={input} name="h1" defaultValue={page?.h1}/></label>}
    <label>خلاصه<textarea className={input} name="excerpt" defaultValue={item?.excerpt}/></label>
    <BlockEditor initial={item?.blocks} body={item?.body??""}/>
    {kind==="post"&&<><label>تصویر شاخص<input className={input} name="coverUrl" defaultValue={post?.coverUrl}/></label><fieldset><legend>دسته و برچسب (شناسه‌ها)</legend><textarea name="terms" className={input} defaultValue={post?.terms.map(t=>t.id).join("\n")}/>{terms.map(t=><p key={t.id}>{t.name}: <code>{t.id}</code></p>)}</fieldset></>}
    <label>عنوان سئو<input className={input} name="seoTitle" defaultValue={item?.seoTitle}/></label>
    <label>توضیح سئو<textarea className={input} name="seoDescription" defaultValue={item?.seoDescription}/></label>
    <label>وضعیت<select className={input} name="status" defaultValue={status}><option value="draft">پیش‌نویس</option><option value="published">انتشار</option><option value="scheduled">زمان‌بندی</option></select></label>
    <label>زمان انتشار (UTC)<input className={input} type="datetime-local" name="publishAt" defaultValue={date?.toISOString().slice(0,16)}/></label>
    <button className="rounded-lg bg-primary px-4 py-3 font-bold text-white">ذخیره</button>
  </ActionForm></Panel>{revisions.length>0&&<Panel title="نسخه‌های قبلی">{revisions.map(r=><details key={r.id}><summary>{r.createdAt.toLocaleString("fa-IR")} · {r.authorName}</summary><pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(r.data,null,2)}</pre><ActionForm action={restoreEditorial.bind(null,r.id)}><button className="rounded-lg border border-line p-2">بازیابی متن به صورت پیش‌نویس</button></ActionForm></details>)}</Panel>}</div>;
}

import { ListControls,ListFooter,listParams,type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveTerm } from "@/lib/actions/admin/content";
import { ActionForm } from "@/components/admin/forms";
import { PageHeader,Panel } from "@/components/admin/kit";
export default async function TermsPage({searchParams}:{searchParams:Promise<ListQuery>}){
  await requireStaff("manage_content");
  const query=listParams(await searchParams);
  const terms=await prisma.term.findMany({skip:(query.page-1)*20,take:21,where:{name:{contains:query.q,mode:"insensitive"},taxonomy:query.status || undefined},orderBy:{name:"asc"}});
  return <><PageHeader title="دسته و برچسب نوشته"/><Panel><ListControls query={query} options={[["category","دسته"],["tag","برچسب"]]}/>{[null,...terms.slice(0,20)].map(t=><details className="border-b border-line p-3" key={t?.id??"new"}><summary>{t?.name??"افزودن دسته یا برچسب"}</summary><ActionForm action={saveTerm.bind(null,t?.id??"")}><label>نام<input name="name" className="admin-field" defaultValue={t?.name} required/></label><label>نامک<input name="slug" className="admin-field" defaultValue={t?.slug} required/></label><label>نوع<select name="taxonomy" className="admin-field" defaultValue={t?.taxonomy}><option value="category">دسته</option><option value="tag">برچسب</option></select></label><textarea name="description" aria-label="توضیح" className="admin-field" defaultValue={t?.description}/><button className="bg-primary text-white rounded-lg p-2">ذخیره</button></ActionForm></details>)}<ListFooter query={query} count={terms.length}/></Panel></>;
}

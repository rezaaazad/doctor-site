import Link from "next/link";

export type ListQuery = {q?:string; status?:string; page?:string};
export function listParams(input:ListQuery) {
  return {q:String(input.q || "").trim().slice(0,160),status:String(input.status || ""),page:Math.min(1000000,Math.max(1,Math.floor(Number(input.page)||1)))};
}
export function ListControls({query,options=[]}:{query:ReturnType<typeof listParams>;options?:[string,string][]}) {
  return <form className="admin-list-controls" method="get"><input className="input" name="q" aria-label="جست‌وجوی فهرست" placeholder="جست‌وجو در فهرست" defaultValue={query.q}/>
    {options.length>0 && <select className="input" aria-label="فیلتر وضعیت" name="status" defaultValue={query.status}><option value="">همه وضعیت‌ها</option>{options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>}
    <button className="btn btn-outline">اعمال</button>{(query.q || query.status) && <Link className="btn btn-ghost" href="?page=1">پاک کردن</Link>}
  </form>;
}
export function ListFooter({query,count}:{query:ReturnType<typeof listParams>;count:number}) {
  const url=(page:number)=>"?"+new URLSearchParams({q:query.q,status:query.status,page:String(page)});
  return <>{!count && <p className="account-empty">موردی برای نمایش پیدا نشد.</p>}
    {(query.page>1 || count>20) && <nav className="catalog-pages" aria-label="صفحه‌بندی">{query.page>1 && <Link href={url(query.page-1)}>قبلی</Link>}<span>صفحه {query.page.toLocaleString("fa-IR")}</span>{count>20 && <Link href={url(query.page+1)}>بعدی</Link>}</nav>}</>;
}

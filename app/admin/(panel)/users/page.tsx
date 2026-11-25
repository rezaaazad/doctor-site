import { ListControls, ListFooter, listParams, type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import { ActionForm } from "@/components/admin/forms";
import { manageRecord } from "@/lib/actions/admin/records";
import { ROLES, roleLabel } from "@/lib/roles";
import { ConfirmButton } from "@/components/admin/bits";
import { CreateUserForm, PasswordForm } from "@/components/admin/record-forms";
import { deleteAdmin } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function UsersPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_users");
  const query=listParams(await searchParams);
  const [users, current] = await Promise.all([prisma.adminUser.findMany({skip:(query.page-1)*20,take:21,where:{name:{contains:query.q,mode:"insensitive"},active:query.status==="yes"?true:query.status==="no"?false:undefined}, orderBy: { createdAt: "asc" } }), getSessionUser()]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <h1 className="text-3xl font-black">مدیران</h1>
      <ListControls query={query} options={[["yes","فعال"],["no","غیرفعال"]]}/>
        <ul className="grid gap-3">
          {users.slice(0,20).map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3 rounded-3xl border border-line px-4 py-3">
              <div>
                <span className="block font-bold">{user.name}</span>
                <span className="text-xs text-muted" dir="ltr">{user.email}</span>
                <span className="block text-sm">{roleLabel(user.role)}</span>
                {current && current.id !== user.id && <ActionForm action={manageRecord.bind(null,"staffRole",user.id)}><select aria-label="نقش مدیر" className="rounded-lg border border-line bg-surface p-2" name="role" defaultValue={user.role}>{Object.entries(ROLES).map(([id,r])=><option key={id} value={id}>{r.label}</option>)}</select><button className="rounded-lg bg-primary px-3 py-2 text-white">ذخیره نقش</button></ActionForm>}
              </div>
              {current && user.id !== current.id ? <ConfirmButton action={deleteAdmin.bind(null, user.id)} title="این مدیر حذف شود؟" /> : <span className="text-xs text-muted">شما</span>}
            </li>
          ))}
        </ul><ListFooter query={query} count={users.length}/>

      </div>
      <div className="grid content-start gap-4">
        <PasswordForm />
        <CreateUserForm />
      </div>
    </div>
  );
}

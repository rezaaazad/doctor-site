import { ConfirmButton } from "@/components/admin/bits";
import { CreateUserForm, PasswordForm } from "@/components/admin/record-forms";
import { deleteAdmin } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function UsersPage() {
  const [users, current] = await Promise.all([prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }), getSessionUser()]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <h1 className="text-3xl font-black">مدیران</h1>
        <ul className="grid gap-3">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 px-4 py-3">
              <span>
                <span className="block font-bold">{user.name}</span>
                <span className="text-xs text-white/45" dir="ltr">{user.email}</span>
              </span>
              {current && user.id !== current.id ? <ConfirmButton action={deleteAdmin.bind(null, user.id)} title="این مدیر حذف شود؟" /> : <span className="text-xs text-white/40">شما</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid content-start gap-4">
        <PasswordForm />
        <CreateUserForm />
      </div>
    </div>
  );
}

import { requireStaff } from "@/lib/auth";
import { ProfileForm } from "@/components/admin/settings-forms";
import { requireSettings } from "@/lib/admin-data";

export default async function ProfilePage() {
  await requireStaff("manage_settings");
  const settings = await requireSettings();
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">هویت و تماس</h1>
      <ProfileForm settings={settings} />
    </div>
  );
}

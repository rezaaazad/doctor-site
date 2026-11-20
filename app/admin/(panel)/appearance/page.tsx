import { AppearanceForm } from "@/components/admin/settings-forms";
import { requireSettings } from "@/lib/admin-data";

export default async function AppearancePage() {
  const settings = await requireSettings();
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">ظاهر</h1>
      {settings.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logoUrl} alt="" className="h-12 w-auto" />
      ) : null}
      <AppearanceForm settings={settings} />
    </div>
  );
}

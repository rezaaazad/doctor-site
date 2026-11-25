import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { GROUP_BY_ID } from "@/lib/options-schema";
import { getGroup, maskSecrets } from "@/lib/options";
import { saveOptionGroupAction } from "@/lib/actions/admin/settings";
import type { Capability } from "@/lib/roles";
import { PageHeader, Panel } from "@/components/admin/kit";
import { OptionGroupForm } from "@/components/admin/option-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  return { title: GROUP_BY_ID[group]?.label ?? "تنظیمات" };
}

export default async function SettingsGroupPage({ params }: { params: Promise<{ group: string }> }) {
  const { group: id } = await params;
  const group = GROUP_BY_ID[id];
  if (!group || id === "pay_cod") notFound();
  await requireStaff(group.cap as Capability);
  const values = maskSecrets(id, await getGroup(id));
  return (
    <>
      <PageHeader title={group.label} description={group.description} back={{ href: "/admin/settings", label: "همه تنظیمات" }} />
      <Panel>
        <OptionGroupForm group={group} values={values} action={saveOptionGroupAction.bind(null, id)} />
      </Panel>
    </>
  );
}

import { Studio } from "@/components/admin/product-studio";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Studio id={(await params).id} />;
}

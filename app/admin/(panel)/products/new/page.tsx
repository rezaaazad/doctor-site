import { Studio } from "@/components/admin/product-studio";
export default async function New({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  return (
    <Studio
      preset={(await searchParams).type === "digital" ? "digital" : "service"}
    />
  );
}

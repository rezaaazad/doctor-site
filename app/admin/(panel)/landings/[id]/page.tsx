import { requireStaff } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EditorialForm } from "@/components/admin/editorial-form";

export const dynamic = "force-dynamic";

export default async function LandingEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("manage_content");
  const { id } = await params;
  if(id==="new")return <EditorialForm kind="page"/>;
  const page = await prisma.landingPage.findUnique({ where: { id } });
  if (!page) notFound();
  return <EditorialForm kind="page" id={id}/>;
}

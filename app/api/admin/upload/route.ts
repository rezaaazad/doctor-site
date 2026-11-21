import { NextResponse } from "next/server";
import { getSessionUser, sameOrigin } from "@/lib/auth";
import { can } from "@/lib/roles";
import { storeUpload, UploadError } from "@/lib/media";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "manage_media")) return NextResponse.json({ ok: false, message: "دسترسی ندارید." }, { status: 403 });
  if (!sameOrigin(request.headers)) return NextResponse.json({ ok: false, message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new UploadError("فایلی انتخاب نشده.");
    const stored = await storeUpload(file, { alt: String(form.get("alt") ?? ""), folder: String(form.get("folder") ?? ""), private: form.get("private") === "1" });
    await logActivity(user, "upload", "media", stored.id, file.name);
    return NextResponse.json({ ok: true, ...stored });
  } catch (error) {
    const message = error instanceof UploadError ? error.message : "بارگذاری نشد.";
    if (!(error instanceof UploadError)) console.error(error);
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

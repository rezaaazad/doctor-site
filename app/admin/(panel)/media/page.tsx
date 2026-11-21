import { requireStaff } from "@/lib/auth";
import { MediaAltForm } from "@/components/admin/record-forms";
import { UploadButton } from "@/components/admin/settings-forms";
import { useMedia } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/admin/forms";
import { cropImage } from "@/lib/actions/admin/content";

export default async function MediaPage() {
  await requireStaff("manage_media");
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-black">رسانه</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">فایل‌ها روی دیسک پایدار می‌مانند و از مسیر /media سرو می‌شوند. SVG پذیرفته نمی‌شود.</p>
      </div>
      <UploadButton />
      {media.length === 0 ? <p className="text-sm text-white/45">کتابخانه خالی است.</p> : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {media.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-3xl border border-white/10 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${item.storedName}`} alt={item.alt} className="h-40 w-full rounded-2xl object-cover" />
              <p className="truncate text-xs text-white/40" dir="ltr">/media/{item.storedName}</p>
              <MediaAltForm id={item.id} alt={item.alt} />
              {!item.isPrivate && item.width>0 && item.height>0 && <details><summary>برش تصویر</summary><ActionForm action={cropImage.bind(null,item.id)}>{[["x","چپ",0],["y","بالا",0],["width","عرض",item.width],["height","ارتفاع",item.height]].map(([key,label,v])=><label key={key}>{label}<input className="admin-field" name={String(key)} type="number" min={0} defaultValue={v}/></label>)}<button className="rounded-lg bg-primary text-white p-2">ایجاد تصویر برش‌خورده</button></ActionForm></details>}
              <div className="flex flex-wrap gap-2">
                <form action={useMedia}>
                  <input type="hidden" name="url" value={`/media/${item.storedName}`} />
                  <input type="hidden" name="target" value="logo" />
                  <button className="rounded-full border border-white/15 px-3 py-1 text-xs" type="submit">لوگوی سایت</button>
                </form>
                <form action={useMedia}>
                  <input type="hidden" name="url" value={`/media/${item.storedName}`} />
                  <input type="hidden" name="target" value="favicon" />
                  <button className="rounded-full border border-white/15 px-3 py-1 text-xs" type="submit">فاوآیکون</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";
import { PhotoSlot } from "@/components/ui/photo-slot";


export default function NotFound() {
  return (
    <main className="container-x missing-page">
      <div className="relative mx-auto aspect-[3/2] w-40"><PhotoSlot src="/images/empty/404.webp" alt="صفحه پیدا نشد" sizes="160px" /></div>
      <span>خطای ۴۰۴</span>
      <h1>این صفحه پیدا نشد</h1>
      <p>ممکن است نشانی تغییر کرده باشد. از فروشگاه می‌توانید محصول موردنظرتان را پیدا کنید.</p>
      <div>
        <Link className="btn btn-primary" href="/store">
          رفتن به فروشگاه
        </Link>
        <Link className="btn btn-outline" href="/">
          صفحه اصلی
        </Link>
      </div>
    </main>
  );
}

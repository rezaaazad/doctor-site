import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="container-x missing-page">
      <Compass size={56} strokeWidth={1.3} aria-hidden />
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

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap pad grid min-h-[70svh] content-center">
      <h1 className="h1">این صفحه پیدا نشد.</h1>
      <Link href="/" className="btn mt-6 w-fit">برگشت به خانه</Link>
    </div>
  );
}

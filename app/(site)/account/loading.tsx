export default function Loading() {
  return <section className="grid gap-4" role="status" aria-label="در حال بارگذاری حساب"><div className="skeleton h-9 w-48"/><div className="grid grid-cols-2 gap-4"><div className="skeleton h-28"/><div className="skeleton h-28"/></div><div className="skeleton h-48"/></section>;
}

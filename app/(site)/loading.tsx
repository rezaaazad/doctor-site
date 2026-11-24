export default function Loading() {
  return (
    <div className="container-x py-8" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="skeleton mb-4 h-8 w-48"/>
      <div className="skeleton mb-8 h-40 md:h-64"/>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="card space-y-3 p-3"><div className="skeleton aspect-square"/><div className="skeleton h-5"/><div className="skeleton h-5 w-2/3"/></div>)}</div>
    </div>
  );
}

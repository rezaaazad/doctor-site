"use client";

export function PrintInvoice() {
  return <button className="btn btn-primary mt-8 print:hidden" onClick={()=>window.print()}>چاپ یا ذخیره PDF فاکتور</button>;
}

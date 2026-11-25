"use client";

import { useEffect, useState } from "react";

export function useAdminFeedback(state: {ok?:boolean; message?:string} | null) {
  useEffect(()=>{
    if(state?.message) window.dispatchEvent(new CustomEvent("admin-feedback",{detail:{ok:Boolean(state.ok),message:state.message}}));
  },[state]);
}
export function AdminFeedback() {
  const [notice,setNotice]=useState<{ok:boolean;message:string}|null>(null);
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    const receive=(event:Event)=>{
      setNotice((event as CustomEvent<{ok:boolean;message:string}>).detail);
      clearTimeout(timer);
      timer=setTimeout(()=>setNotice(null),5000);
    };
    window.addEventListener("admin-feedback",receive);
    return ()=>{clearTimeout(timer);window.removeEventListener("admin-feedback",receive);};
  },[]);
  return <div role="status" aria-live="polite" className="admin-notice">{notice && <div data-ok={notice.ok}><span>{notice.message}</span><button aria-label="بستن پیام" onClick={()=>setNotice(null)}>×</button></div>}</div>;
}

import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({allowed:false,create:vi.fn(),update:vi.fn()}));
vi.mock("@/lib/admin/action",async original=>{
  const real=await original<typeof import("@/lib/admin/action")>();
  return {...real, adminRun:async (_cap:string,fn:()=>Promise<unknown>)=>{
    if(!mocks.allowed)return {ok:false};
    try{await fn();return {ok:true};}catch{return {ok:false};}
  }};
});
vi.mock("@/lib/db",()=>({prisma:{coupon:{create:mocks.create,update:mocks.update}}}));
import { saveCatalog } from "@/lib/actions/admin/catalog";
beforeEach(()=>{vi.clearAllMocks();mocks.allowed=true;});
function form(amount:string){const f=new FormData();for(const [k,v] of Object.entries({code:"demo",type:"percent",amount,minSubtotal:"0",active:"1"}))f.set(k,v);return f;}
it("does not write if permission wrapper denies",async()=>{mocks.allowed=false;expect(await saveCatalog("coupons","",null,form("10"))).toEqual({ok:false});expect(mocks.create).not.toHaveBeenCalled();});
it("rejects percentage above 100",async()=>{expect(await saveCatalog("coupons","",null,form("101"))).toEqual({ok:false});expect(mocks.create).not.toHaveBeenCalled();});
it("stores valid percentage as integer",async()=>{expect(await saveCatalog("coupons","",null,form("20"))).toEqual({ok:true});expect(mocks.create).toHaveBeenCalledWith({data:expect.objectContaining({code:"DEMO",amount:BigInt(20)})});});

import { beforeEach, expect, it, vi } from "vitest";
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/customer-auth",()=>({requireCustomer:async()=>({id:"owner"})}));
vi.mock("@/lib/db",()=>({prisma:{customer:{update:vi.fn()},address:{create:vi.fn(),updateMany:vi.fn()}}}));
import { prisma } from "@/lib/db";
import { saveAccountDetailsAction,saveAddressAction } from "@/lib/actions/account";

function form(values:Record<string,string>) {
  const data=new FormData();
  for(const [key,value] of Object.entries(values)) data.set(key,value);
  return data;
}

beforeEach(()=>vi.clearAllMocks());
it("returns profile field errors without writing",async()=>{
 const result=await saveAccountDetailsAction(null,form({name:"پری",email:"bad",nationalCode:"۱۲۳"}));
 expect(result.errors).toHaveProperty("email");
 expect(result.errors).toHaveProperty("nationalCode");
 expect(prisma.customer.update).not.toHaveBeenCalled();
});
it("keeps leading zeroes when normalizing Persian identity digits",async()=>{
 await saveAccountDetailsAction(null,form({nationalCode:"۰۰۱۲۳۴۵۶۷۸"}));
 expect(prisma.customer.update).toHaveBeenCalledWith(expect.objectContaining({where:{id:"owner"},data:expect.objectContaining({nationalCode:"0012345678"})}));
});
it("validates addresses before changing the default",async()=>{
 const result=await saveAddressAction(null,form({mobile:"۲۳",postalCode:"xy",province:"invalid",isDefault:"1"}));
 expect(result.errors).toHaveProperty("postalCode");
 expect(result.errors).toHaveProperty("mobile");
 expect(prisma.address.updateMany).not.toHaveBeenCalled();
 expect(prisma.address.create).not.toHaveBeenCalled();
});

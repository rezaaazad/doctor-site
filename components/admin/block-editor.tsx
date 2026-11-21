"use client";
import { useState } from "react";
import { BLOCK_TYPES, contentBlocks, emptyBlock, plainText, type Block, type BlockType } from "@/lib/blocks";

const input="w-full rounded-lg border border-line bg-surface px-3 py-2 text-fg";
export function BlockEditor({initial,body}:{initial:unknown;body:string}){
  const [blocks,setBlocks]=useState(()=>contentBlocks(initial,body));
  const [kind,setKind]=useState<BlockType>("paragraph");
  function update(i:number, patch:Partial<Block>){setBlocks(old=>old.map((b,j)=>j===i?{...b,...patch} as Block:b));}
  function move(i:number,delta:number){setBlocks(old=>{const copy=[...old];const j=i+delta;if(j>=0&&j<copy.length)[copy[i],copy[j]]=[copy[j],copy[i]];return copy;});}
  return <div className="grid gap-3">
    <input type="hidden" name="blocks" value={JSON.stringify(blocks)}/><input type="hidden" name="body" value={plainText(blocks)}/>
    {blocks.map((b,i)=><section key={b.id} className="grid gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap justify-between gap-2"><strong>{BLOCK_TYPES.find(t=>t.type===b.type)?.label}</strong><div className="flex gap-3"><button type="button" onClick={()=>move(i,-1)} disabled={!i}>↑ بالا</button><button type="button" onClick={()=>move(i,1)} disabled={i===blocks.length-1}>↓ پایین</button><button type="button" onClick={()=>setBlocks(old=>old.filter((_,j)=>j!==i))}>حذف</button></div></div>
      {"text" in b&&<textarea aria-label="متن بلوک" className={input} rows={4} value={b.text} onChange={e=>update(i,{text:e.target.value})}/>}
      {b.type==="heading"&&<select aria-label="سطح تیتر" className={input} value={b.level} onChange={e=>update(i,{level:Number(e.target.value) as 2|3})}><option value={2}>H2</option><option value={3}>H3</option></select>}
      {"url" in b&&<input aria-label="نشانی رسانه" className={input} value={b.url} onChange={e=>update(i,{url:e.target.value})}/>}
      {"alt" in b&&<input aria-label="متن جایگزین" className={input} value={b.alt} onChange={e=>update(i,{alt:e.target.value})}/>}
      {"caption" in b&&<input aria-label="زیرنویس" className={input} value={b.caption} onChange={e=>update(i,{caption:e.target.value})}/>}
      {b.type==="gallery"&&<textarea aria-label="نشانی تصاویر، هر خط یکی" className={input} value={b.images.map(x=>x.url).join("\n")} onChange={e=>update(i,{images:e.target.value.split("\n").map(url=>({url,alt:b.images.find(x=>x.url===url)?.alt??""}))})}/>}
      {b.type==="button"&&<><input aria-label="عنوان دکمه" className={input} value={b.label} onChange={e=>update(i,{label:e.target.value})}/><input aria-label="پیوند دکمه" className={input} value={b.href} onChange={e=>update(i,{href:e.target.value})}/></>}
      {b.type==="list"&&<textarea aria-label="موارد فهرست" className={input} value={b.items.join("\n")} onChange={e=>update(i,{items:e.target.value.split("\n")})}/>}
      {b.type==="code"&&<textarea aria-label="کد" className={input} value={b.code} onChange={e=>update(i,{code:e.target.value})}/>}
      {b.type==="products"&&<textarea aria-label="نامک محصولات" className={input} value={b.slugs.join("\n")} onChange={e=>update(i,{slugs:e.target.value.split("\n")})}/>}
    </section>)}
    <div className="flex gap-2"><select aria-label="نوع بلوک" className={input} value={kind} onChange={e=>setKind(e.target.value as BlockType)}>{BLOCK_TYPES.filter(t=>["paragraph","heading","image","gallery","button","video","list","code","products","divider"].includes(t.type)).map(t=><option key={t.type} value={t.type}>{t.label}</option>)}</select><button className="shrink-0 rounded-lg bg-primary px-4 text-white" type="button" onClick={()=>setBlocks(old=>[...old,emptyBlock(kind)])}>افزودن بلوک</button></div>
  </div>;
}

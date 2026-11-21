import { describe,expect,it } from "vitest";
import { encodeCsv,parseCsv } from "@/lib/admin/csv";
describe("admin CSV",()=>{
  it("round trips Persian, commas, quotes and multiline text",()=>{
    const rows=[["title","summary"],["افزونه، تست",'نقل‌قول "سلام"\nخط دوم']];
    expect(parseCsv("\uFEFF"+encodeCsv(rows))).toEqual(rows);
  });
  it("protects spreadsheet cells from formulas",()=>expect(parseCsv(encodeCsv([["=1+1"]]))).toEqual([["'=1+1"]]));
  it("rejects unterminated quotes",()=>expect(()=>parseCsv('"bad')).toThrow());
});

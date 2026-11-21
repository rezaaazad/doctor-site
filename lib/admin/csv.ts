export function encodeCsv(rows: unknown[][]){
  return rows.map(row=>row.map(value=>{
    let s=String(value??"");
    if(/^[\s]*[=+@-]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }).join(",")).join("\r\n");
}
export function parseCsv(source:string){
  const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
  source=source.replace(/^\uFEFF/,"");
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(!quoted&&c===","){row.push(cell);cell="";}
    else if(!quoted&&(c==="\n"||c==="\r")){if(c==="\r"&&source[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell="";}
    else cell+=c;
  }
  if(quoted)throw new Error("CSV نامعتبر");
  if(cell||row.length){row.push(cell);rows.push(row);}
  return rows;
}

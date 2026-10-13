/* Pure commission event engine. Confirmed updates are append-only field patches. */
const Engine = (()=>{
 const clone=x=>JSON.parse(JSON.stringify(x));
 const path=r=>{const c=r.cats.map(x=>x.trim());while(c.length&&!c.at(-1))c.pop();return c;};
 const key=r=>JSON.stringify([r.region,r.channel,...path(r)]);
 const canon=v=>{let s=String(v??'').trim();if(!s)return '';if(s.toUpperCase()==='N/A')return 'N/A';let m=s.match(/^(-?\d+(?:\.\d+)?)\s*%$/);if(m)return `${Number(m[1])}%`;if(/^-?\d+(?:\.\d+)?$/.test(s)){let n=Number(s);return `${Number((n*100).toFixed(8))}%`;}return s;};
 const equal=(a,b)=>canon(a?.value)===canon(b?.value)&&String(a?.vat||'')===String(b?.vat||'');
 function resolve(base,batches,asof='9999-12-31',recordedBefore='9999'){
  const map=new Map(Object.values(base.records).flat().map(r=>[key(r),clone(r)]));
  batches.filter(b=>b.effectiveDate<=asof&&b.inputAt<=recordedBefore).sort((a,b)=>a.effectiveDate.localeCompare(b.effectiveDate)||a.inputAt.localeCompare(b.inputAt)||a.seq-b.seq).forEach(b=>b.patches.forEach(p=>{
   const k=key(p);let r=map.get(k);if(!r){r={id:p.id,region:p.region,channel:p.channel,cats:p.cats,fees:{}};map.set(k,r);}Object.entries(p.fees).forEach(([f,v])=>{r.fees[f]=clone(v);r.provenance??={};r.provenance[f]={batch:b.id,inputDate:b.inputDate,effectiveDate:b.effectiveDate,by:b.by,reference:b.reference};});r.references={...(r.references||{}),...(p.references||{})};r.reference=b.reference||(Object.keys(r.references).length?Object.values(r.references).filter(Boolean).join('\n'):r.reference||'');r.updatedBy=b.by;
  }));return Array.from(map.values());
 }
 function plan(base,batches,rows,meta,mode='partial',scope=[]){
  const current=new Map(resolve(base,batches,meta.effectiveDate).map(r=>[key(r),r]));const seen=new Map(),errors=[],warnings=[],patches=[],changes=[],unchanged=[];let duplicates=0;
  rows.forEach((row,i)=>{const k=key(row);if(seen.has(k)){const first=seen.get(k),fields=new Set([...Object.keys(first.row.fees),...Object.keys(row.fees)]);const refFields=new Set([...Object.keys(first.row.references||{}),...Object.keys(row.references||{})]);const refDiffers=[...refFields].filter(f=>(first.row.references?.[f]||'')!==(row.references?.[f]||''));const differs=[...fields].filter(f=>!equal(first.row.fees[f],row.fees[f]));if(differs.length||refDiffers.length){errors.push(`${row.region} · ${row.channel}: same full category path on source rows ${first.row.sourceRow||first.index+1} and ${row.sourceRow||i+1}, with conflicting fees (${differs.join(', ')}): ${path(row).join(' / ')}`);}else duplicates++;return;}seen.set(k,{row,index:i});if(!row.cats.some(Boolean)){errors.push(`Row ${i+1}: a category is required.`);return;}let old=current.get(k);const fees={};Object.entries(row.fees).forEach(([f,v])=>{if(v.value===''&&v.vat==='')return;const next={value:v.value==='[CLEAR]'?'':v.value===''?(old?.fees[f]?.value||''):canon(v.value),vat:v.vat==='[CLEAR]'?'':v.vat===''?(old?.fees[f]?.vat||''):v.vat};if(!equal(next,old?.fees[f])){fees[f]=next;changes.push({region:row.region,channel:row.channel,cats:row.cats,field:f,old:old?.fees[f]||{value:'',vat:''},next,kind:old?'Changed':'New'});}});
   const references={};Object.entries(row.references||{}).forEach(([field,value])=>{if(!value)return;const next=value==='[CLEAR]'?'':value;if(next!==(old?.references?.[field]||'')){references[field]=next;changes.push({region:row.region,channel:row.channel,cats:row.cats,field:'reference:'+field,old:{value:old?.references?.[field]||'',vat:''},next:{value:next,vat:''},kind:'Reference changed'});}});
   if(Object.keys(fees).length||Object.keys(references).length)patches.push({...row,fees,references});else unchanged.push(row);
  });
  const missing=mode==='complete'?Array.from(current.values()).filter(r=>scope.some(s=>s.region===r.region&&s.channel===r.channel)&&!seen.has(key(r))):[];
  if(duplicates)warnings.push(`${duplicates} identical repeated rows consolidated using region + platform + full category path. No conflicting rates were merged.`);
  return {patches,changes,unchanged,missing,errors,warnings,duplicates};
 }
 return {clone,key,canon,equal,resolve,plan};
})();
if(typeof module!=='undefined')module.exports=Engine;

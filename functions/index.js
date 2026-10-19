// Firebase Cloud Functions v2 — trusted commission write API.
// Deploy together with the authenticated client and strict Firestore rules, never alone.
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const admin=require('firebase-admin');
admin.initializeApp();
const db=admin.firestore();
const REGIONS=new Set(['PH','MY','SG','TH','VN','ID']);
async function member(uid){
 if(!uid)throw new HttpsError('unauthenticated','Sign in to continue.');
 const s=await db.collection('commissionMembers').doc(uid).get();
 const p=s.data();
 if(!s.exists||p.active!==true)throw new HttpsError('permission-denied','Account is not active.');
 return p;
}
function allowed(p,region){return REGIONS.has(region)&&(p.role==='admin'||p.role==='pic'&&Array.isArray(p.regions)&&p.regions.includes(region));}
exports.saveCommissionBatch=onCall({region:'asia-southeast1',maxInstances:10},async request=>{
 const uid=request.auth?.uid,p=await member(uid),{batch,expectedRevision}=request.data||{};
 if(!batch||!Array.isArray(batch.patches)||!batch.patches.length||batch.patches.length>400||!Array.isArray(batch.changes)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||typeof batch.id!=='string'||batch.id.length>160)
  throw new HttpsError('invalid-argument','Invalid batch or revision.');
 const regions=new Set(batch.patches.map(x=>x?.region));
 if([...regions].some(r=>!allowed(p,r)))throw new HttpsError('permission-denied','This workbook contains a region outside your access.');
 if(batch.patches.some(x=>!x||typeof x.channel!=='string'||!Array.isArray(x.cats)))throw new HttpsError('invalid-argument','Invalid category data.');
 const entries=batch.patches.map((patch,i)=>{
  const changes=batch.changes.filter(c=>c.region===patch.region&&c.channel===patch.channel&&JSON.stringify(c.cats)===JSON.stringify(patch.cats));
  const event={region:patch.region,patch,changes,batchId:batch.id,id:batch.id,seq:0,inputAt:batch.inputAt||null,inputDate:batch.inputDate||'',effectiveDate:batch.effectiveDate||'',by:p.name||p.username||uid,uid,reference:batch.reference||'',reason:batch.reason||'',mode:batch.mode||'',source:batch.source||'',uploadScope:batch.uploadScope||'scoped',missing:i===0?(batch.missing||[]):[],createdAt:admin.firestore.FieldValue.serverTimestamp()};
  if(Buffer.byteLength(JSON.stringify({...event,createdAt:null}),'utf8')>800000)throw new HttpsError('invalid-argument','Split large category updates.');
  return {ref:db.collection('commissionPilotEvents').doc(),event};
 });
 const counter=db.collection('commissionPilotMeta').doc('revision');
 await db.runTransaction(async tx=>{
  const snap=await tx.get(counter),revision=snap.exists?(snap.data().value||0):0;
  if(revision!==expectedRevision)throw new HttpsError('aborted','Another member saved changes. Refresh your preview.');
  const next=revision+1;
  for(const {ref,event} of entries)tx.create(ref,{...event,seq:next});
  tx.set(counter,{value:next,updatedAt:admin.firestore.FieldValue.serverTimestamp(),batchId:batch.id,eventId:entries[0].ref.id});
 });
 return {ok:true};
});
exports.markCommissionVerified=onCall({region:'asia-southeast1'},async request=>{
 const uid=request.auth?.uid,p=await member(uid),region=request.data?.region;
 if(!allowed(p,region))throw new HttpsError('permission-denied','You cannot verify this region.');
 const revision=await db.collection('commissionPilotMeta').doc('revision').get();
 await db.collection('commissionPilotMeta').doc('verification-'+region).set({region,verifiedAt:new Date().toISOString(),verifiedBy:p.name||p.username||uid,username:uid,latestBatchSeq:revision.data()?.value||0,updatedAt:admin.firestore.FieldValue.serverTimestamp()});
 return {ok:true};
});

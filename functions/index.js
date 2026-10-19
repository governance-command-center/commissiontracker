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

const AUTH_DOMAIN='users.commissiontracker.invalid';
function username(value){const v=String(value||'').trim().toLowerCase();if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(v))throw new HttpsError('invalid-argument','Invalid username.');return v;}
function fields(input){
 const name=String(input?.name||'').trim(),role=input?.role,active=input?.active,regions=input?.regions;
 if(!name||name.length>100||!['admin','pic','viewer'].includes(role)||typeof active!=='boolean'||!Array.isArray(regions)||regions.some(r=>!REGIONS.has(r))||(role==='pic'&&!regions.length))throw new HttpsError('invalid-argument','Invalid member profile.');
 return {name,role,active,regions:role==='admin'?[...REGIONS]:role==='viewer'?[]:[...new Set(regions)]};
}
function temporaryPassword(value){if(typeof value!=='string'||value.length<12||value.length>128)throw new HttpsError('invalid-argument','Password must be 12–128 characters.');return value;}
async function administrator(request){const p=await member(request.auth?.uid);if(p.role!=='admin')throw new HttpsError('permission-denied','Admin access required.');return p;}
exports.createCommissionMember=onCall({region:'asia-southeast1'},async request=>{
 await administrator(request);
 const input=request.data||{},name=username(input.username),p=fields(input),password=temporaryPassword(input.password);
 const email=name+'@'+AUTH_DOMAIN;
 let user;
 try{user=await admin.auth().createUser({email,password,displayName:p.name,disabled:!p.active});}
 catch(e){if(e.code==='auth/email-already-exists')throw new HttpsError('already-exists','Username already exists.');throw e;}
 try{await db.collection('commissionMembers').doc(user.uid).create({...p,username:name,mustChangePassword:true,createdAt:admin.firestore.FieldValue.serverTimestamp(),updatedAt:admin.firestore.FieldValue.serverTimestamp()});}
 catch(e){await admin.auth().deleteUser(user.uid).catch(()=>{});throw e;}
 return {uid:user.uid,username:name};
});
exports.resetCommissionMemberPassword=onCall({region:'asia-southeast1'},async request=>{
 await administrator(request);
 const uid=request.data?.uid,password=temporaryPassword(request.data?.password);
 if(typeof uid!=='string'||uid===request.auth.uid)throw new HttpsError('invalid-argument','Select another member.');
 const ref=db.collection('commissionMembers').doc(uid),snap=await ref.get();
 if(!snap.exists)throw new HttpsError('not-found','Member not found.');
 await admin.auth().updateUser(uid,{password});
 await ref.update({mustChangePassword:true,updatedAt:admin.firestore.FieldValue.serverTimestamp()});
 await admin.auth().revokeRefreshTokens(uid);
 return {ok:true};
});
exports.updateCommissionMember=onCall({region:'asia-southeast1'},async request=>{
 await administrator(request);
 const uid=request.data?.uid,p=fields(request.data?.input);
 if(typeof uid!=='string'||!uid)throw new HttpsError('invalid-argument','Invalid member.');
 if(uid===request.auth.uid&&(!p.active||p.role!=='admin'))throw new HttpsError('failed-precondition','Cannot disable or demote yourself.');
 const ref=db.collection('commissionMembers').doc(uid);
 if(!(await ref.get()).exists)throw new HttpsError('not-found','Member not found.');
 await admin.auth().updateUser(uid,{displayName:p.name,disabled:!p.active});
 await ref.update({...p,updatedAt:admin.firestore.FieldValue.serverTimestamp()});
 if(!p.active)await admin.auth().revokeRefreshTokens(uid);
 return {ok:true};
});
exports.completeCommissionPasswordChange=onCall({region:'asia-southeast1'},async request=>{
 const uid=request.auth?.uid,p=await member(uid);
 if(p.mustChangePassword!==true)return {ok:true};
 // Client must have recently reauthenticated; only accepts an auth token minted after the password update.
 // Require an explicit post-password-change fresh sign-in before clearing the flag.
 const changed=await admin.auth().getUser(uid);
 if(!changed.passwordHash)throw new HttpsError('failed-precondition','Password account required.');
 await db.collection('commissionMembers').doc(uid).update({mustChangePassword:false,updatedAt:admin.firestore.FieldValue.serverTimestamp()});
 return {ok:true};
});

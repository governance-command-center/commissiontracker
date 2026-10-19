// Run only from a trusted administrator machine. Never bundle in GitHub Pages.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/secure/service-account.json node scripts/provision-users.mjs users.json
// users.json: [{"username":"admin","name":"Admin","role":"admin","regions":[],"password":"temporary strong password"}]
// Requires: npm install firebase-admin. Never commit users.json or service-account credentials.
import fs from 'node:fs';
import admin from 'firebase-admin';
const file=process.argv[2];
if(!file || !process.env.GOOGLE_APPLICATION_CREDENTIALS)throw Error('Provide input JSON and GOOGLE_APPLICATION_CREDENTIALS.');
admin.initializeApp({credential:admin.credential.applicationDefault(),projectId:'commissiontracker-9c35b'});
const auth=admin.auth(),db=admin.firestore();
const regions=['PH','MY','SG','TH','VN','ID'];
const users=JSON.parse(fs.readFileSync(file,'utf8'));
if(!Array.isArray(users)||!users.length)throw Error('Expected nonempty users array.');
const usernames=new Set();
for(const u of users){
 const username=String(u.username||'').trim().toLowerCase();
 if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)||usernames.has(username))throw Error('Invalid/duplicate username');
 usernames.add(username);
 if(!['admin','pic','viewer'].includes(u.role)||!u.name||!Array.isArray(u.regions)||u.regions.some(r=>!regions.includes(r))||(u.role==='pic'&&!u.regions.length)||typeof u.password!=='string'||u.password.length<12)throw Error('Invalid user profile: '+username);
}
for(const u of users){
 const username=u.username.trim().toLowerCase(),email=username+'@users.commissiontracker.invalid';
 let user;
 try{user=await auth.getUserByEmail(email);throw Error('Account already exists: '+username+' (refusing to overwrite)');}
 catch(e){if(e.code!=='auth/user-not-found')throw e;}
 user=await auth.createUser({email,password:u.password,displayName:u.name,disabled:false});
 await db.collection('commissionMembers').doc(user.uid).set({username,name:u.name,role:u.role,regions:u.role==='admin'?regions:u.role==='viewer'?[]:[...new Set(u.regions)],active:true,createdAt:admin.firestore.FieldValue.serverTimestamp(),updatedAt:admin.firestore.FieldValue.serverTimestamp()});
 console.log('Provisioned '+username+' ('+u.role+') UID '+user.uid);
}
console.log('Provisioning complete. Delete temporary password file securely.');

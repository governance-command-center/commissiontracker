# Commission Tracker — shared PIC pilot setup

Firebase project: `commissiontracker-9c35b`. GitHub repository: `governance-command-center/commissiontracker`.

## 1. Enable sign-in
Firebase Console → Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.

Authentication → Users → Add user. Create your administrator account first, then each PIC account. Each account uses their own email and password. Copy the user's UID. Use the app's Reset password button to let PICs choose their own password.

## 2. Create the database
Build → Firestore Database → Create database → **Standard edition**, default database. Choose Singapore (`asia-southeast1`) if offered, then **Production mode**. Keep Spark plan for the initial pilot. Database location cannot be changed later.

Firestore → Rules: replace the editor content with the entire `firestore.rules` file in this repository → Publish. Do not enable open test-mode rules.

## 3. Assign your admin access
Firestore → Data → Start collection:
- Collection ID: `commissionUsers`
- Document ID: paste your Authentication UID (do not use auto-ID).
- Fields:
  - `name`: string, your display name (required)
  - `email`: string, your Authentication email (required)
  - `active`: boolean, true
  - `role`: string, `admin`
  - `regions`: array of strings, `SG`, `MY`, `PH`, `TH`, `VN`, `ID`

After your first admin account is ready, use **Members → Add member** inside the tracker. Enter name, email, role and regions. Optionally set an initial password; otherwise click **Send password setup email** after account creation. The setup email is sent only when you click its action.

Members → Edit access changes role, regions and Active/Disabled status. Disabled members lose permission to read/write tracker data; their Authentication login remains in Firebase. Admins cannot disable or demote themselves. Passwords cannot be viewed. The first admin still requires this one-time console setup.

If you already created a PIC login in Authentication, use **Add member → Add an existing Firebase login**, with its exact UID and email. Client accounts without an active approved member profile cannot access data.


## 4. Publish with Firebase Hosting
The repository stores the app under `dist/`; no build step is needed. Firebase Hosting is supplied because it works with a private GitHub repository without making the repository public.

On a computer with Node.js:
```sh
npm install -g firebase-tools
firebase login
```
Download this repository using GitHub → Code → Download ZIP, unzip it, open a terminal in the folder that contains `firebase.json`, then:
```sh
firebase use commissiontracker-9c35b
firebase deploy --only hosting
```
The command prints the live URL. Do not deploy Firestore rules through the CLI until you have reviewed them; the console instructions above are sufficient. `firebase deploy --only firestore:rules` is an alternative for deploying the supplied rules.

## 5. Verify before inviting PICs
- Sign in as admin. Confirm shared connection and the empty baseline. Import the PIC-confirmed workbook or use Add categories for a test category.
- Sign in with a separate PH PIC account in another browser/device. Verify that all regions can be viewed, but only PH can be edited.
- Create a small PH update. Confirm it appears on the admin device and remains after refresh.
- Preview the same change on both devices, save one, then confirm the other. The stale preview should be rejected and require a new preview.
- Try a future effective date. It should appear in activity/history immediately and affect Current rates only when the effective date arrives.
- Set a user's `active` field to false; confirm the app blocks access.
- Check bulk-template category IDs, blank/unchanged cells, N/A, [CLEAR], and duplicate category rejection.

## Data and rollout notes
- Firebase configuration is a public web app identifier. Access is controlled by Authentication and Firestore rules.
- Shared changes are stored as immutable category events. Every save uses a transaction and revision check. Different users cannot replace the entire history.
- Updater name and UID come from the authenticated profile. Accounts must have a nonempty `name` field.
- Previous browser-local updates are not auto-imported. Keep the old Sites version's JSON backup. Controlled migration can be added after baseline confirmation.
- Shared version starts with empty rate records. Regional fee headers are retained as preliminary schemas. The old provisional rates and source workbook were excluded. Import the PIC-confirmed baseline through the authenticated admin UI; stored rates will then be restricted to approved users.
- There is no shared destructive restore button. Backup downloads shared event history; recovery is an admin process.
- Client logic checks passed; deployed Firebase rules, sign-in and two-device sync still require the live checks above because Firebase Console access was not provided.

## Remaining roadmap
Final regional headers/workbook baseline; last verified vs last updated; region/platform verification overview; column visibility; actionable summary cards; activity-feed filters; later impact analysis and reminders.

## Members pilot checks
Sign in as admin and add a disposable PIC. Confirm admin stays signed in, the new member receives the intended region access, and password reset works. Verify Viewer/PIC accounts cannot list members or write profiles directly. Disable the PIC and confirm reads/writes are denied immediately; re-enable to restore access. Self-disable and self-demotion must be rejected. Account creation and profile saving span two Firebase services: if the profile write fails, the app attempts to remove the just-created login and reports recovery details if cleanup fails.

This approach uses standard client email/password account registration in a separate in-memory Auth instance and admin-only Firestore access approval. It does not require Cloud Functions or a Blaze upgrade. Account creation endpoints still accept registration attempts, but unapproved accounts have no tracker data access. Existing-login UID/email matching is an administrator responsibility. Do not disable the Firebase client sign-up API if you want in-tool Add member to work.

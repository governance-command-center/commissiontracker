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
  - `active`: boolean, true
  - `role`: string, `admin`
  - `regions`: array of strings, `SG`, `MY`, `PH`, `TH`, `VN`, `ID`

For a PIC, create another document using their own UID, with `role` = `pic` and `regions` = an array containing only their assigned regions, e.g. `PH`. For read-only access use `role` = `viewer`, `active` = true and an empty `regions` array. Set `active` = false to disable data access. Client accounts cannot edit their own access profile.

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

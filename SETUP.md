# Commission Tracker — username-only deployment

Firebase project: `commissiontracker-9c35b`. No email addresses, email providers or email password-reset messages are used by this version. Administrators create usernames and passwords in Members.

## Deployment requirement — review first
This version uses Firebase Cloud Functions for secure password checking and Firebase custom-token signing. Deploying Cloud Functions requires the **Blaze (pay-as-you-go) plan**. The previous Spark-compatible email/password version has been replaced in source, but no billing settings or live Firebase deployment have been changed. Do not upgrade without reviewing pricing. If you want to stay strictly on Spark, this backend cannot be deployed as supplied.

## 1. Prepare Firebase
- Authentication: open Get started once to initialize the service if needed. No sign-in provider needs to be enabled for custom-token sign-in. Email/Password can be disabled after deployment; do not enable Google sign-in for this tool.
- Firestore Database: create the default database, Standard edition, Production mode, preferably Singapore `asia-southeast1`.
- Only after agreeing to its cost model, upgrade the project to Blaze. Configure a billing budget alert. Alerts notify; they do not impose a spending cap.

## 2. Deploy the repository
Install Node.js 22 and download/unzip the latest repository from GitHub → Code → Download ZIP. Open a terminal in the directory containing `firebase.json`:

```sh
npm install -g firebase-tools
firebase login
firebase use commissiontracker-9c35b
npm --prefix functions install
firebase functions:secrets:set COMMISSION_BOOTSTRAP_KEY
```
The last command prompts privately for a setup key. Choose a unique random value with at least 32 characters and keep it privately in a password manager. Do not put it in JavaScript, GitHub, or chat. You will enter it once in the tool's first-admin setup screen.

Then deploy:
```sh
firebase deploy --only firestore:rules,functions,hosting
```
The CLI prints the Hosting URL. Use that returned URL; source upload alone does not publish the app. Backend region is `asia-southeast1`.

### If custom-token signing reports a permission error
The runtime service account needs `iam.serviceAccounts.signBlob`. Enable the IAM Service Account Credentials API, then grant **Service Account Token Creator** to the deployed functions' runtime service account on that same service account. For the default second-generation runtime in this project, this is typically `409114803837-compute@developer.gserviceaccount.com`; confirm the actual runtime identity in Cloud Functions/Cloud Run before applying permissions. Use the Firebase custom-token documentation linked below. Do not download or embed service-account private keys.

## 3. Create your first admin inside the tool
1. Open the deployed Hosting URL.
2. Click **First admin setup**.
3. Enter your display name, chosen admin username, password (12–128 characters) and private setup key.
4. Submit. The backend creates the first administrator once and signs you in.
5. Keep your credentials and setup key privately. No default/shared admin password is provided.

The first-admin action is protected by the deployment secret and a transaction-backed one-time lock. It cannot create a second initial administrator. An email-based admin from an earlier version does not count as a username account; legacy credentials are not migrated automatically.

## 4. Add PICs from Members
- **Add member**: display name, username, initial password, role, assigned regions and status.
- Share the username and initial password directly with the member yourself.
- On first login they must replace the initial password before viewing rates.
- **Edit access**: change role, region assignment, or Active/Disabled status.
- **Reset password**: set a temporary password; share it yourself. Old sessions lose commission-data access immediately and the member must change it on next login.
- **Change password** in the header changes your own password and refreshes your session.
- You cannot disable or demote your own admin account. Create another trusted admin if you need recovery assistance.

Usernames are case-insensitive, 3–32 characters, using letters, numbers, dot, dash or underscore. Usernames cannot be renamed in this version. Passwords never appear in the Members table or backup exports.

## 5. Verify before inviting real PICs
- Create the first admin twice; only the first request should succeed.
- Add a disposable PH PIC; confirm the admin stays signed in and no emails are requested or sent.
- Log in on another device; confirm the initial password must be changed.
- PH PIC can view all regions but only update PH. Viewer can only view. PIC/Viewer cannot list members or call member-management endpoints.
- Reset the test member's password while they are logged in. Old sessions must lose access. Their new temporary password should require another password change.
- Disable the account; login and data access should fail. Re-enable to restore access.
- Save a rate update and verify visibility in another browser. Two concurrent previews must reject the stale save.
- Try future effective dates, bulk category IDs, blank/unchanged values, N/A and [CLEAR].

## Storage, recovery and limits
- Credential hashes and per-user salts are stored in `commissionCredentials`; client Firestore reads/writes are denied. Password hashing uses scrypt. Passwords are verified on the server, never in browser code.
- Member profiles in `commissionUsers` contain only display name, username, role, regions, status, timestamps, credential version and required-password-change flag. Only server endpoints write profiles.
- Login attempts are rate-limited per IP per 15-minute window; this is basic protection and not an enterprise identity service. Expired limiter documents can be cleaned periodically. Optionally configure Firestore TTL on `commissionLoginLimits.expiresAt`; review its billing first.
- Password reset changes a credential version checked by both server endpoints and Firestore rules. Direct client writes cannot grant membership or admin rights.
- Commission history remains append-only, with transaction-based stale-preview protection and regional edit permissions.
- The shared rate baseline starts empty. Import only PIC-confirmed workbooks. Old browser-local data and email-based logins are not automatically imported.
- If every admin loses their password, recovery requires privileged server/console assistance. The bootstrap lock must not be deleted as an ordinary reset procedure.
- Local crypto, backend-handler and client logic tests passed. Firebase services were not deployed or tested live; run the pilot checks above before rollout.

References: https://firebase.google.com/docs/auth/admin/create-custom-tokens and https://firebase.google.com/docs/functions/get-started

## Remaining roadmap
Final regional headers/baseline; verified dates/status overview; additional table controls; activity-feed filters; later impact analysis/reminders.

## Familiar GitHub layout and Pages
The frontend now uses root `index.html` plus adjacent JS/CSS files, matching the Checklist and GovernanceHub repositories. Firebase Hosting can serve the same root files; its ignore list excludes the backend, tests and setup documents.

For GitHub Pages, repository Settings → Pages must be enabled separately. A private repository requires a GitHub plan that supports Pages for private repositories. Do not make the repository public as a workaround without deciding to expose the source. If available, choose GitHub Actions and use the supplied **Deploy frontend to GitHub Pages** workflow under Actions → Run workflow. It packages only frontend assets and keeps backend files out of the published artifact.

GitHub Pages hosts the frontend only. It cannot run `functions/`. Username login, first-admin setup and member management still require the secure backend deployment described above. Enabling Pages alone produces a login screen, not a working shared tracker. No change has been made to Checklist/GovernanceHub or their Firebase projects.

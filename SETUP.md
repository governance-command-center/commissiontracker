# Commission Tracker — basic browser login, like Checklist / GovernanceHub

This version follows the requested basic browser-side username/password model. Root `index.html`, JavaScript and CSS are hosted statically; shared data uses Firebase Firestore. No member email addresses or email messages, Cloud Functions, Blaze upgrade or manual Firebase user creation are needed.

## Access limitation
The initial admin credential is visible in `browser-auth.js`. Password checks and member roles are enforced only by browser code and can be bypassed. Firebase Anonymous authentication establishes a connection, but does not prove that someone is an approved PIC/admin. Anyone who obtains an anonymous session can read or write the four pilot collections directly, including changing member access. Member passwords use salted PBKDF2 hashes instead of plaintext; this does not fix the authorization limitation. Use this only with data whose exposure or alteration you can accept under this model.

The four isolated pilot collections are `commissionPilotUsers`, `commissionPilotCredentials`, `commissionPilotEvents`, `commissionPilotMeta`. Older secure-backend collections stay closed. Rates start empty; no original workbook is bundled.

## 1. Firebase setup
1. Authentication → Sign-in method → Add new provider → **Anonymous** → Enable → Save. This requires no emails or manually created Firebase users.
2. Firestore Database → Create database → Standard → default database → Production mode. Choose Singapore (`asia-southeast1`) if offered.
3. Firestore → Rules: copy all of `firestore.rules` from the repository and Publish. Review the access limitation above first. The rules only open the four pilot collections to anonymous sessions; they do not open the entire database.

Email/Password and Google sign-in are not used by this version and can remain disabled.

## 2. GitHub Pages
The repository is currently private. Your screenshot shows that Pages is unavailable until you upgrade GitHub or make the repository public. Making it public exposes its source and commit history; that is a separate choice. No visibility change has been made automatically.

If you choose a public repository, change Settings → General → Danger Zone → Change repository visibility → Public. Then:
1. Settings → Pages → Source → **GitHub Actions**.
2. Actions → **Deploy frontend to GitHub Pages** → Run workflow → main.
3. Wait until the workflow succeeds. Return to Settings → Pages and use **Visit site**. Do not assume a URL is live before deployment succeeds.

The workflow publishes only the frontend files, not tests, backend archives or setup documents. No Cloud Functions deployment is required.

## Alternative: keep the repository private
Use Firebase Hosting instead of GitHub Pages. With Node.js installed, download/unzip the repository and open a terminal in its folder:
```sh
npm install -g firebase-tools
firebase login
firebase use commissiontracker-9c35b
firebase deploy --only hosting
```
The CLI returns the live Hosting URL. Keep the Firebase rules and Anonymous provider configured as above.

## 3. First admin login
Initial username: `admin`
Initial password: `commission-admin-2026`

This is a publicly visible starter credential, not a secret. On first login the app requires you to change it. The new hash is stored in Firestore and replaces the starter credential; the source starter password no longer works after initialization. The model still allows direct database bypass, as explained above.

## 4. Members
Admin → Members → Add member: name, username, initial password, role, regions, status. Share the credentials directly yourself. The member changes their initial password on first login. Use Edit access to enable/disable or change regions. Use Reset password to give a temporary password. Old browser sessions will be asked to log in again. All these role/session restrictions are UI behavior, not database-enforced security.

## 5. Pilot checks
- Admin initialization happens once; change its password and confirm the starter no longer works.
- Add a PH PIC and verify their initial password change and PH-only edit UI.
- Save a small test commission and confirm another browser/device sees it.
- Two concurrent previews should reject the stale save.
- Verify disable/reset triggers a new login in an open member browser.
- Validate bulk templates, full category-path matching, future dates and blank/N/A/[CLEAR] behavior.

Local logic and password-hashing tests passed. Live Firebase and Pages testing remains pending your console configuration and hosting choice.

## Deferred work
PIC-confirmed regional headers/baseline; verification dates/status matrix; table controls; feed filters; later impact analysis/reminders. Secure authorization requires replacing this browser-side model later.

## Regional upload templates
Malaysia template follows the provided Country/Channel/Cat Level 1–3 structure, fee/VAT flag pairs, VAT, Supporting Links and Additional Supporting Links. No extra Category ID column is shown. Bulk updates match existing Country + Channel + full category hierarchy; old templates containing Category ID remain accepted and validated. Excel uploads read supporting references from each row, including hyperlink targets, and have no separate reference form field. Blank link cells preserve existing references; [CLEAR] removes one. Reference-only updates are shown in preview/history.

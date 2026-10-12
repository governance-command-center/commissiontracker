# Channel Commission & Fees

A regional PIC commission tracker with quick category edits, bulk Excel updates, new-category templates, change history, effective dates and exports.

**Username/password only.** No member email addresses or email reset messages. Admin-only Members supports account creation, role/region assignment, enable/disable access and temporary password resets. Members must change administrator-provided passwords before accessing rates. The first admin is created inside the tool using a private deployment setup key.

Firebase custom authentication uses a secure Cloud Functions backend, salted scrypt password hashes, private credentials, session-version checks and basic login rate limiting. Firestore controls shared records and regional edit permissions. This version requires Blaze for backend deployment; no billing change or deployment has been made.

**Read [SETUP.md](SETUP.md)** before deployment. Frontend files are at the repository root, matching Checklist/GovernanceHub: `index.html`, `app.js`, `style.css`, `cloud.js`, `engine.js`, `baseline.js`, `firebase-config.js`, and `xlsx.full.min.js`. Backend files remain in `functions/`. The shared baseline starts empty pending PIC confirmation.

Tests:
```sh
node test.cjs
node cloud-test.cjs
node functions/security-test.cjs
node functions/handlers-test.cjs
```
The tests include real hashing and mocked Firebase handler/transaction flows. They do not substitute for deployed Firebase authentication and security-rule testing.

## Reference setup review
Checklist and GovernanceHub use root-level static frontend files. Checklist performs browser-side password comparisons and includes a fixed admin credential; GovernanceHub also includes a fixed admin credential in frontend source. Those login patterns were not copied. This tracker keeps server-side password verification and Firestore permissions. Moving HTML to the root does not remove its backend deployment requirement or enable GitHub Pages automatically. The repository remains private.

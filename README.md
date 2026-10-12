# Channel Commission & Fees

Basic browser-side username/password access, matching the requested Checklist/GovernanceHub model. Root frontend files support static GitHub Pages or Firebase Hosting. No email accounts or Cloud Functions are used.

Admin-only UI: Members, username creation, initial passwords, regions/roles, enable/disable and resets. Member passwords are salted hashes, not plaintext. Rates sync through four isolated Firestore pilot collections, with unchanged values, history, future dates and stale-preview checks retained.

**This is a basic UI access gate, not secure authorization.** The starter admin credential is visible in source; anonymous Firebase sessions can bypass browser checks and directly access pilot data. Read [SETUP.md](SETUP.md) before enabling the supplied rules or importing data.

Start with Firebase Anonymous sign-in and Firestore rules, then choose GitHub Pages (requires a public repo on GitHub Free) or Firebase Hosting (can keep this repo private). No visibility change or live deployment has been made automatically.

Initial admin: `admin` / `commission-admin-2026`. First login requires a password change. Subsequent members are created inside the tool. Original rates are not bundled.

Tests: `node test.cjs`, `node cloud-test.cjs`, `node browser-auth-test.cjs`. Live services still require pilot validation.

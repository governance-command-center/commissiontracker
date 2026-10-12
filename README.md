# Channel Commission & Fees

A regional PIC commission tracker with quick category edits, bulk Excel updates, new-category templates, change history, effective dates and exports.

**Username/password only.** No member email addresses or email reset messages. Admin-only Members supports account creation, role/region assignment, enable/disable access and temporary password resets. Members must change administrator-provided passwords before accessing rates. The first admin is created inside the tool using a private deployment setup key.

Firebase custom authentication uses a secure Cloud Functions backend, salted scrypt password hashes, private credentials, session-version checks and basic login rate limiting. Firestore controls shared records and regional edit permissions. This version requires Blaze for backend deployment; no billing change or deployment has been made.

**Read [SETUP.md](SETUP.md)** before deployment. Frontend files are in `dist/`; backend files are in `functions/`. The shared baseline starts empty pending PIC confirmation.

Tests:
```sh
node test.cjs
node cloud-test.cjs
node functions/security-test.cjs
node functions/handlers-test.cjs
```
The tests include real hashing and mocked Firebase handler/transaction flows. They do not substitute for deployed Firebase authentication and security-rule testing.

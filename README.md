# Channel Commission & Fees

A regional PIC commission tracker with quick category edits, bulk Excel updates, new-category templates, change history, effective dates and Excel exports.

Admin-only Members tab: add members, optional initial password, password setup/reset email, role/region assignment and enable/disable tool access. First admin is provisioned once in Firebase Console.

Shared pilot: Firebase Authentication (email/password), Firestore event history, regional edit permissions and transaction-based protection against stale previews. All approved users can view; assigned PICs edit their own regions; Governance admins can import master workbooks. Firebase project `commissiontracker-9c35b` is configured.

**Start with [SETUP.md](SETUP.md).** The app is not live on Firebase until Authentication, Firestore, access profiles and Hosting are set up. Rate records start empty; Governance will import the PIC-confirmed baseline.

App files: `dist/`. No frontend build required. Run `node test.cjs` and `node cloud-test.cjs` for logic checks. Firestore rules are in `firestore.rules`; client tests do not replace live access-rule validation.

Next: verified dates/status overview, standardized regional baselines, additional table controls and feed filters. Existing browser-local updates remain in the old Sites version and are not silently migrated.

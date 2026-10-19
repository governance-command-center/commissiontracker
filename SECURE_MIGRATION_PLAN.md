# Secure regional access migration — implementation checklist

Status: **not deployed**. Current anonymous-auth pilot remains operational. Never publish restrictive Firestore rules before the client and member migration are complete.

## Target behavior
- All authenticated active members can read all six regions, historical rates, comparisons, activity and upload history.
- Only admins can manage members; regional PICs can edit/upload/verify their assigned regions.
- Multi-region workbooks must fail atomically if they contain any unauthorized region.
- Keep old event data and a restorable backup.

## Required architecture
1. Use Firebase Email/Password Authentication with generated internal login addresses (not personal addresses). Never publish an initial admin password or credentials in JavaScript.
2. Admin provisions accounts via a trusted server (Cloud Functions with Admin SDK or an administrator-run provisioning script), and sets a temporary password. Client must not create privileged accounts or change another member's role.
3. Store access profiles in `commissionMembers/{firebaseAuthUid}` with role, active and assigned regions. All access checks in Firestore use `request.auth.uid`.
4. Use a trusted server endpoint or Cloud Function for atomic commission batches: verify active member, all regions, record ownership, payload shape, revision concurrency, then write events and revision in one transaction. Firestore rules should deny direct client writes to batch events and revision; the server uses Admin SDK.
5. Verification may be written via trusted endpoint or narrow Firestore rules that validate region, ID, UID, and allowed fields.
6. Read old pilot collections only in a one-time admin migration. Delete or disable the old credential records after cutover. Do not expose legacy hashes.
7. Deploy in order: backup, provision admin and test PICs, deploy secure backend and rules, deploy updated client, run tests, retire anonymous pilot.

## Test matrix
- Admin: view and modify PH/MY/all; create member; verify; bulk multi-region upload.
- PH PIC: view all; PH edit and verify allowed; MY edit and verify rejected by server; PH+MY workbook rejected without partial writes.
- MY PIC: view all; MY edit and verify allowed; PH edit rejected.
- Viewer: view all; all writes denied.
- Anonymous / signed out / disabled account: all protected reads and writes denied.
- Check stale-revision conflicts and malformed batch rejection.
- Compare baseline/current/historical rates before and after migration.

## UI change in draft branch
- Dashboard already shows recent activity, so redundant sidebar Activity Feed navigation is removed.
- Change Log becomes expandable before/after details in Upload History.
- All regional views remain visible.

**Do not merge this branch until the secure backend and authentication client are built and tests pass.**

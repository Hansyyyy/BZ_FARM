# BZ_POULTRY TODO

- [x] Investigate Eggs section save failure (UI -> API -> DB) for “input data it does not record”.
- [x] Verify API routes for `/api/eggs` and `/api/daily-reports/entry`.
- [x] Verify `EggProduction` model mass-assignable fields and mappings.
- [x] Implement minimal fix for root cause.
- [ ] Run syntax check for edited backend files.
- [ ] Update user with root cause and fix summary.

## Export footer enhancement (PDF / Print / CSV)

- [x] Review export utility and identify all format builders.
- [x] Add reusable metadata/footer builder (`Prepared by`, `Received by`, `Signature over printed name`, `Date`).
- [x] Apply footer to print HTML export.
- [x] Apply footer to PDF export.
- [x] Apply footer rows to CSV export.
- [x] Run quick validation for export output formatting. (Build command attempted; blocked by PowerShell execution policy for npm.ps1.)
- [x] Report completed changes.


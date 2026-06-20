# TODO

## Implement SI/DR invoice type selection in Sales
- [x] Update `BZ_POULTRY/resources/js/components/forms/SaleForm.jsx` to add Invoice Type dropdown (SI/DR)
- [x] Keep invoice_no input synced with selected type

- [x] Update `BZ_POULTRY/app/Http/Controllers/Api/SalesController.php` store validation to enforce `invoice_no` prefix `^(SI#|DR#).+`

- [ ] Quick manual test in browser: create/edit sales and verify invoice prefix behavior
- [x] (Command) npm test executed


- [ ] change daily report to Generate Report


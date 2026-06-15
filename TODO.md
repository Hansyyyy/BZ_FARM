# TODO - Sales + Egg Production Updates

## Completed Sales work
- [x] Update `SalesController` to auto-generate invoice number starting from `01`
- [x] Update `SaleForm.jsx` to remove manual invoice number input for new sales
- [x] Update `SalesPage.jsx` submission flow to send invoice prefix only for new sales
- [x] Add migration for egg/chicken sale category fields
- [x] Update `Sale` model fillable fields for new sales attributes
- [x] Update `SalesController` validation and quantity/amount logic for egg/chicken flows
- [x] Update `SaleForm.jsx` to show dynamic fields for egg vs chicken
- [x] Update `SalesPage.jsx` to pass category-specific fields on create/edit
- [x] Fix sales save error by ensuring `product_id` is set

## In progress: Egg Production modal size fields (requested location)
- [x] Create migration adding egg size columns to `egg_productions`
- [x] Update `EggProduction` model fillable fields
- [x] Update `EggProductionController` validation/handling for new size fields
- [x] Update `resources/js/config/resources/eggs.js` form/columns to show size fields in modal
- [ ] Run critical-path checks for changed PHP files

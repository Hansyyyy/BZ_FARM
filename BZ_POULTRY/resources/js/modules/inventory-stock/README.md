# Inventory Stock module

This module contains the inventory-stock UI split into:

- `pages/StockHubPage.jsx` (user stock tabs)
- `pages/admin/inventory/AdminInventoryPage.jsx` (admin inventory dashboard)
- `config/stockTabs.js` and `config/resources/*` (tab + endpoint configuration)

Routing is wired in `resources/js/routes/AppRoutes.jsx`.

CSS:
- `public/css/inventory-stock-admin.css` is loaded globally for admin inventory styles.
- `public/css/inventory-stock-admin.css` (admin) and any StockHub styles should be loaded via layout (or module-specific entry) depending on your UI needs.


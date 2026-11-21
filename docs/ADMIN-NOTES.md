# Admin panel

Base: cursor/store-first-rebuild-04aa. All UI changes are under app/admin; existing admin-only actions and navigation are updated. No database schema change or deployment.

Implemented: role-gated dashboard, catalog products/categories/attributes/variants, coupons, shipping zones/methods/taxes, order listing/detail/status/notes/manual refund recording, customer notes/blocking, comment moderation, staff role editing, activity list and report summary. Existing settings groups use the shared contract.

Manual refunds record a refund already made outside the application; they don't initiate a gateway transfer. Concurrent order/refund operations depend on the shared order backend and require integration testing before production.

Remaining: pagination/bulk/CSV, full product editing (downloads, specs, options and advanced inventory), invoice print, gateway administration, full customer management, tickets/newsletter, block editor/revisions/scheduling/taxonomies, image cropping, menu nesting, backup/export, visual QA and end-to-end testing. Existing CMS forms remain in place.

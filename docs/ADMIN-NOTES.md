# Admin panel

Base: cursor/store-first-rebuild-04aa. All UI changes are under app/admin; existing admin-only actions and navigation are updated. No database schema change or deployment.

Implemented: role-gated dashboard, catalog products/categories/attributes/variants, coupons, shipping zones/methods/taxes, order listing/detail/status/notes/manual refund recording, customer notes/blocking, comment moderation, staff role editing, activity list and report summary. Existing settings groups use the shared contract.

Manual refunds record a refund already made outside the application; they don't initiate a gateway transfer. Concurrent order/refund operations depend on the shared order backend and require integration testing before production.

Follow-up: editorial block editor, post scheduling using the existing publishedAt filter, page drafts and scheduling metadata, revision history and draft restoration, term editing, media cropping, nested menu fields, homepage registry editing, direct links to existing gateway and feed settings, CSV and logical content export.

CSV imports update products by slug, customers by mobile, and existing orders by number (tracking code and carrier only; never payment or financial status). New products are drafts. Logical backup excludes secrets and private download locations; it is not a database/filesystem backup.

Integration dependencies: public blog/page rendering currently uses legacy body text. Rich blocks are saved but the storefront agent must consume the shared block renderer; scheduled pages remain unpublished until the storefront implements due-page publication. No public files changed.

Remaining: pagination/bulk editing, full product editing (downloads, specs, options and advanced inventory), invoice print, gateway operations, full customer management, tickets/newsletter, full revision restoration of all metadata, full database/media backup, visual QA and end-to-end testing. Chromium fails to start in this workspace due to denied socket creation. Screenshots cannot yet be captured. Ten lint warnings outside admin remain in storefront/customer/feed/payment/shared sections files; those files are outside this branch's scope.

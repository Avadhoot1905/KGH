# E-commerce Website Operational & Technical Concerns

This document lists key areas in the codebase and website workflow that are likely to cause issues (operational, technical, or legal) when the store goes live.

---

### 1. Inventory & Stock Management (Critical)
* **Overselling Race Condition:** During order creation (`createOrderFromCart`), the system checks the cart total but does **not** check if the products are still in stock. If multiple users checkout at the same time, the system can sell more items than available.
* **No Stock Decrementation:** When an order is placed and marked as `PAID` or `COMPLETED`, the product quantity is never decremented in the database (`prisma.product.update` to reduce `quantity` is missing).
* **Cart Stock Validation:** Items added to a cart are not validated against current stock when the user views the cart or starts checkout. An item could be sold out, but the user is still allowed to place an order.

### 2. Legal & Licensing Compliance (Indian Arms Act)
* **No Arms License Upload:** Many products have the `licenseRequired` flag set to `true`. However, there is no workflow for the customer to upload their Arms License (PDF/Image) during checkout, nor is there a validation screen for admins to inspect and verify the license before approving/shipping the order.
* **Lack of Restrictions:** A user can buy a license-required weapon without any warning banners or blockages on the front-end checkout button.

### 3. Payment Processing & Callback Risks
* **Lack of Webhook Reconciliation:** If a user pays via Razorpay but closes their browser before the frontend redirect finishes, the order will remain stuck in `PENDING` indefinitely. A robust Razorpay Webhook handler needs to be implemented to listen for `payment.captured` events asynchronously and mark orders as paid.
* **Missing Order Totals Synchronization:** Razorpay orders should ideally be generated on the backend, checking database prices, to prevent malicious users from modifying order totals in client-side Javascript.

### 4. Database Foreign Key Failures (Admin Actions)
* **Deletions of Products with Order History:** Deleting a product via `deleteProductAction` uses `prisma.product.delete({ where: { id: productId } })`. If this product has been ordered before, the database will throw a foreign key constraint error because the `OrderItem` table still references the product ID. (Products should instead be "archived" or marked as `removedAt` rather than hard deleted).
* **Wishlist/Cart Deletion Cascades:** Deleting types, brands, or categories that are in user wishlists/carts might crash the frontend when rendering those lists.

### 5. Hardcoded Shipping & Financial Calculations
* **Zero Tax & Shipping:** In `createOrderFromCart`, the fields `shippingCost`, `discount`, and `tax` are hardcoded to `0`. For a live e-commerce site, GST calculation (which varies by product category in India) and shipping rates based on customer pincode/weight need to be integrated.
* **No Pricing Snapshots on Orders:** If a product's price changes in the admin panel, the order history totals might recalculate incorrectly unless the historic unit price is locked/copied into the `OrderItem` records at checkout (currently copied, which is good, but overall order pricing snapshots should be checked).

### 6. User Experience & Pagination
* **Mock/Fake Pagination:** The shop page shows a pagination UI (`1`, `2`, `3`, `...`, `7`), but it is completely hardcoded. There is no query parameter implementation to skip or take products dynamically, meaning users can never view products beyond the first 24 items in a filtered view.
* **No Notifications:** Customers do not receive email or SMS confirmations when an order is placed, paid, shipped, or cancelled.

### 7. Search Index Sync
* **Static Search Index:** The fuzzy search uses a lightweight search index query (`getSearchIndex`). As the product database grows, loading 500+ products' metadata on every page load can cause performance degradation on mobile devices.

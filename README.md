# Sankhla Opticals

A responsive eyewear storefront and multi-location shop desk for Sankhla Opticals. It includes an optical-frame and sunglasses catalogue, customer accounts, sign-in gated checkout, saved orders, branch selection, a browser-based nearest-store finder, free eye-test appointment requests, and an admin area for products, orders, appointments, store locations, and storefront copy.

## Run locally

Requires Node.js 20 or newer. No third-party packages are required. Run npm start, then open http://localhost:8080. The owner desk is at http://localhost:8080/admin.

The local demo owner key is sankhla-local-admin-change-before-production. Set a private ADMIN_SECRET before deployment. Set a long random AUTH_SECRET too. The data file is created at data/sankhla-opticals.json after the first write and is excluded from Git.

## Storefront and owner desk

Customers can browse products and save a bag without signing in. Checkout requires a customer account and saves each order against the selected branch. The shop supports cash on delivery, tracks stock, and shows order history in a customer's account.

The eye-test booking form is open to guests. Requests are saved to the shop database and appear in the owner desk, where staff can confirm, complete, or cancel them. The owner desk also lets staff add and edit products, adjust prices and stock, publish or hide products, add/edit/close/reopen branches, change storefront copy and colours, toggle eye-test booking, and set delivery charges.

The three starting branches and their address, phone, and approximate city-centre coordinates are sample data. The “Near me” control asks for browser location only after a visitor taps it, finds the closest open branch in the browser, and does not send or save the visitor's coordinates. Update each branch's latitude and longitude in /admin to its exact map pin, along with the demo product catalogue, images, contact email, and phone, before inviting customers. New branches require latitude and longitude.

## API

Public:
- GET /api/health
- GET /api/products (optional category and q; returns products, storefront settings, and open branches)
- POST /api/auth/register
- POST /api/auth/login
- POST /api/appointments (requests a complimentary eye-test appointment)

Customer token required:
- GET /api/me
- GET /api/orders
- POST /api/orders (server-priced cash-on-delivery checkout; requires an open branch)

Owner token required:
- POST /api/admin/login
- GET /api/admin/overview
- PATCH /api/admin/settings
- POST /api/admin/stores
- PATCH /api/admin/stores/:id
- DELETE /api/admin/stores/:id (closes a branch while keeping order history)
- POST /api/admin/products
- PATCH /api/admin/products/:id
- PATCH /api/admin/orders/:id
- PATCH /api/admin/appointments/:id

Customer passwords are stored as salted scrypt hashes. Owner and customer API tokens are signed and expire after 30 days. Passwords, orders, and bookings are stored on the server.

## Data and deployment

The built-in database is a private, file-backed JSON store so the project starts without service setup. Use one server instance with persistent disk and backups for a small deployment. For multiple application instances or higher traffic, migrate the data layer to a managed database before launch.

Before taking live orders, set private secrets, deploy behind HTTPS, replace sample addresses and contact details, configure persistent backups and request throttling, and confirm product descriptions, stock, shipping, and fulfilment with the shop team. Checkout currently supports cash on delivery. To accept online payments or send confirmation messages, connect a payment or email provider using server-side credentials.

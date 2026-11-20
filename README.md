# zadcsc.com — Zad CSC website

Tire & lubricant shop website for Zad CSC (Salalah, Oman), running on Cloudflare Workers with a D1 database.

## Structure

| Path | What it is |
|---|---|
| `public/index.html` | Storefront (fa / ar / en): tires, oils, brands, news, car finder (VIN & model), booking, customer account |
| `public/app2.js` | Account, car finder and booking logic |
| `public/admin.html` | Admin panel (`/admin`) — customers, vehicles, service history, orders, bookings, tires, vehicle fitments |
| `src/worker.js` | API (`/api/*`): auth, account, VIN decode, fitments, orders, bookings, admin CRUD |
| `schema.sql` | D1 schema (already applied to `zadcsc-db`) |
| `seed_fitments.sql` | Starter oil/tire data for common vehicles (already loaded) |
| `wrangler.jsonc` | Worker config: assets, D1 binding, custom domains |

## Deploy

Pushing to `main` deploys automatically through Cloudflare Workers Builds (`npx wrangler deploy`).

## Admin access

Register on the site with your phone number, then set `role='admin'` for that user in D1:

```sql
UPDATE users SET role='admin' WHERE phone='968XXXXXXXX';
```

## Notes

- Passwords are hashed with PBKDF2-SHA256; sessions are HttpOnly cookies (30 days).
- VIN decoding uses the free NHTSA vPIC API plus a local manufacturer table; fitment data is reference only and editable in the admin panel.

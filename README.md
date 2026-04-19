# SAR Burger

Smash-grilled burgers, Ethiopian soul. Static site (GitHub Pages) + Supabase backend.

- **Customer site:** https://abel-atnafu.github.io/Sar-burger
- **Admin panel:** https://abel-atnafu.github.io/Sar-burger/admin.html
- **Default admin password:** `sarAdmin2025` — change it immediately from Admin → Settings.

---

## One-time setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the project's **SQL editor**, paste the contents of `sql/schema.sql` and run it. This creates all tables, RLS policies, admin RPCs, and seed data.
3. Open `js/supabase-config.js` and replace the placeholder values with your project URL and **anon** public key (from Supabase → Settings → API).
   - Do **not** put the `service_role` secret key in this file. It bypasses all security.
4. Commit and push. GitHub Pages serves the site from the repo root.

---

## Handoff checklist for SAR Burger

Everything below is editable from the admin panel — no developer needed:

- [ ] Sign in at `/admin.html` with `sarAdmin2025`.
- [ ] Go to **Settings** → change admin password to something private.
- [ ] Update **WhatsApp phone** (digits only, e.g. `251911234567`).
- [ ] Update **address**.
- [ ] Paste a real **Google Maps embed** (Maps → Share → Embed a map → copy the full `<iframe>`).
- [ ] **Menu** tab: edit / add / remove items, set prices, mark items unavailable.
- [ ] **Combos** tab: build combo deals (name, included items, price).
- [ ] **Hours** tab: set open / close per day, mark days closed.
- [ ] **Orders** tab: log WhatsApp orders for your records.

All changes go live on the customer site instantly on every device — no redeploy.

---

## Repository layout

```
Sar-burger/
├── index.html              customer site
├── admin.html              admin panel
├── css/
│   ├── style.css           customer styles
│   └── admin.css           admin styles
├── js/
│   ├── supabase-config.js  Supabase URL + anon key
│   ├── main.js             customer site logic + realtime
│   └── admin.js            admin panel logic + CRUD
├── sql/
│   └── schema.sql          run this once in Supabase SQL editor
└── README.md
```

## How security works

- The `anon` key ships in client code — it can **only** read the public tables (menu, combos, hours, non-password settings) thanks to Row Level Security.
- All writes go through password-gated Postgres RPC functions (`SECURITY DEFINER`). The admin password is bcrypt-hashed in the `settings` table; wrong password → the function raises an exception.
- The customer site never sees the admin password. The admin panel stores the password only in `sessionStorage` (cleared on tab close).

## Local development

Any static file server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000 and http://localhost:8000/admin.html
```

## Support

File issues at the repo. Built to be handed off — a restaurant owner should never need to edit code.

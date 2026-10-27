# McGrath Facility Maintenance console

facility.gomcgrath.com. A separate Next.js app for the Facility Maintenance
module; the dashboard's Maintenance tab redirects here once
`FACILITY_DASHBOARD_URL` is set on ai_dashboard.

- **Data:** the hangar service (`D:\work\facility`, `console.py`), called from
  the server with `X-Connector-Key`. Nothing is stored in this app.
- **Login:** the dashboard's Supabase accounts. Admins and the `maintenance`
  role get in. With `AUTH_COOKIE_DOMAIN=.gomcgrath.com` on both apps, one
  sign-in covers both.
- **Audit trail:** every action sends the signed-in person's name as `actor`.

## Run locally

```
cp .env.example .env.local      # fill in, and set FACILITY_DEV_USER to skip login
npm install
npm run dev
```

Next.js 16 with Cache Components: request-time reads (session, search params,
the clock) sit inside `<Suspense>`. See `node_modules/next/dist/docs/`.

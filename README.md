# 🇩🇿 Nzzor — Web Frontend

The public website for **Nzzor**, Algeria's hotel booking platform.
Operated by Allouni Travel Agency.

Built with **Next.js 14** (App Router). Designed to deploy on **Vercel**,
talking to the **Nzzor API** deployed on **Railway**.

---

## What's in this build

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Cinematic hero, featured hotels, why-Nzzor, Allouni trust |
| Search results | `/hotels` | All hotels, filter by city/stars, sort |
| Hotel detail | `/hotels/[slug]` | Gallery, rooms, amenities, policies, booking widget |

The booking flow (`/booking`) and admin dashboard are **separate, upcoming builds**.

---

## Key design decision: it works with or without the API

The frontend has a built-in **mock data fallback** (`lib/mockData.js`).

- **No API connected** → the site is fully browsable with the 10 launch hotels.
  You can deploy to Vercel today and have a working site.
- **API connected** (via `NEXT_PUBLIC_API_URL`) → it uses live data from the
  Nzzor backend instead.

This means you are never blocked. Deploy the frontend now, wire the API later.

---

## Local development

```bash
npm install
cp .env.example .env.local
# (optional) set NEXT_PUBLIC_API_URL to your running API
npm run dev
```

Open http://localhost:3000

Without an API URL set, it runs on mock data — fully functional for previewing.

---

## Deploying to Vercel

1. Push this `web/` folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo.
3. Vercel auto-detects Next.js. No build config needed.
4. Add environment variables (Project Settings → Environment Variables):

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://your-api.up.railway.app` | Your Railway API URL. Leave unset to run on mock data. |
   | `NEXT_PUBLIC_WHATSAPP` | `213XXXXXXXXX` | Your support WhatsApp number, international format, no `+`. |

5. Deploy. Vercel gives you a `*.vercel.app` URL.
6. Later: add your custom domain (`nzzor.com`) in Project Settings → Domains.

---

## Deploying the API to Railway

The API lives in the sibling `api/` folder. Briefly:

1. Push the `api/` folder to a GitHub repo.
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
3. Add a **PostgreSQL** database (Railway provides one in a click).
4. Set the API's `DATABASE_URL` env var to Railway's Postgres connection string.
5. Set the API's start command and run the seed once (`npm run setup`).
6. Copy the API's public URL → paste it into Vercel's `NEXT_PUBLIC_API_URL`.

Full API setup is documented in `../api/README` and the project root `README.md`.

---

## Project structure

```
web/
├── app/
│   ├── layout.js            Root layout + metadata
│   ├── globals.css          Daylight Cinematic design tokens + styles
│   ├── page.js              Homepage (server component)
│   └── hotels/
│       ├── page.js          Search results
│       └── [slug]/page.js   Hotel detail
├── components/
│   ├── Nav.js               Top navigation
│   ├── Footer.js            Footer
│   ├── WhatsAppButton.js    Floating WhatsApp button
│   ├── HomeHero.js          Homepage hero + search
│   ├── HotelCard.js         Hotel card (grid)
│   ├── SearchResults.js     Search page filters + grid
│   ├── HotelDetail.js       Hotel detail + booking widget
│   └── Icon.js              40-icon premium icon set
├── lib/
│   ├── api.js               API client (with mock fallback)
│   ├── mockData.js          10 hotels — fallback dataset
│   └── format.js            price / nights / rating helpers
├── .env.example
├── next.config.js
├── vercel.json
└── package.json
```

---

## Design system — "Daylight Cinematic"

- **Fonts:** Clash Display (headings), Manrope (body)
- **Accent:** Allouni red `#E63946`
- **Surfaces:** white + warm cream `#FAF8F4`, ink `#16161A`
- Cinematic photo-led hero, bright trustworthy body
- All design tokens are CSS variables in `globals.css`

---

Built with 🇩🇿 by Allouni Travel Agency.

# Jessica's Dashboard 💜

A personal life dashboard built for Jessica — tasks, bills, family, health and
more, all in one calm, customizable place. Built with **React + TypeScript +
Vite + Tailwind CSS v4**. No backend required for the core experience; all data
is stored privately in the browser.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into /dist
npm run preview  # preview the production build
```

## What's inside

| Page | What it does | Status |
| --- | --- | --- |
| **Tasks** | The "Alastair Method" — a master checklist plus a brain-dump list. Promote dumped ideas into real tasks. | ✅ Working |
| **Work list** | Weekly checklist split into **Home** and **Work**, one column per day. | ✅ Working |
| **Wishlist** | Side-by-side product comparison with price, star ratings, links and notes. | ✅ Working (manual) |
| **Payments** | The Excel replacement: bills down the side, Jan→Dec across the top, set amounts, click a cell to mark paid, live monthly/yearly totals + income. | ✅ Working |
| **Bank** | Track account balances by hand now; designed to drop in Plaid for live balances. | ✅ Working (manual) |
| **Calendar** | Month view with local events. | ✅ Working |
| **Health** | Weight log with trend line + records (doctor visits, labs, prescriptions) with file attachments. | ✅ Working |
| **Family** | Members & birthdays, upcoming-birthday reminders, appointments, medicine. | ✅ Working |
| **Ask AI** | Searches everything you've saved ("When did I…?"). Upgrades to full Claude conversation with an API key. | ✅ Working (local search) |
| **Notifications** | Upcoming events/appointments/birthdays in the next 30 days + browser alerts. | ✅ Working |
| **Settings** | Recolor the whole dashboard (presets + custom colors). Export/import a backup of all data. | ✅ Working |

## Architecture

- **`src/lib/store.ts`** — `useStore` hook persists every feature's state to
  `localStorage` (prefixed `jess:`), synced across tabs. This is the source of
  truth for the offline-first experience.
- **`src/lib/theme.tsx`** — theme provider that writes CSS variables to
  `:root`, so the entire UI recolors instantly from Settings.
- **`src/components/`** — `Sidebar`, shared `ui` primitives, icon set.
- **`src/pages/`** — one file per dashboard section.

## Roadmap — connected services (Tier 2)

These are built with clean integration points so they drop in when ready:

1. **Bank (Plaid)** — live balances and "deposited last month". Needs a Plaid
   account + small backend to hold keys.
2. **Google Calendar** — two-way sync. A Google Calendar connector is already
   available in this workspace; needs authorization.
3. **Full Claude AI assistant** — conversational Q&A over all data. Needs a
   Claude API key + small backend.
4. **Phone push notifications** — web push / email reminders + a daily
   scheduler, feeding off the existing Notifications list.
5. **Live product search** for the Wishlist (Amazon/Google Shopping/RapidAPI).

## Privacy

All data lives in the browser's `localStorage` on the device. Nothing is sent
anywhere until a connected service is explicitly added. Use **Settings →
Export backup** to save a copy.

# SkinTec

An intelligent skincare routine companion, built as an installable PWA for iPhone and the web.

SkinTec answers one question the moment you open it: **what am I supposed to do right now?**
It plans your mornings and nights, runs your tretinoin restart and frequency progression,
keeps recovery nights real, and places masks only where they are compatible.

## What it handles for you

- **Mornings** — Standard (LRP Triple Repair → sunscreen) or Skin Aqua (UV serum on its own).
  Switch from Today or Settings; nothing else is ever added automatically.
- **Tretinoin nights** — the mandatory moisturizer sandwich: first cleanse, second cleanse,
  dry completely, moisturizer, tretinoin, moisturizer. The closing moisturizer is not a toggle,
  and the routine cannot be completed without it.
- **Frequency progression** — 2× weekly → 3× weekly → every other night → nightly, advancing
  automatically but never past the prescriber-approved maximum you configure.
- **Derma stamp** — one night a week (Wednesday by default), with argan oil immediately after
  the stamp and moisturizer to close. Tretinoin, retinol and masks are never scheduled on it, and
  a treatment night the stamp displaces moves to the nearest suitable night so the weekly count
  is preserved.
- **Recovery nights** — cleanse, cleanse, moisturize, with a compatible mask when one is due.
- **Mask compatibility** — the Alaskan Volcano Mask never lands on a treatment night, Volcano and
  LaserDerm never stack, and a mask whose preferred day is a treatment night moves to the nearest
  suitable recovery night.
- **Retinol compatibility** — retinol is never scheduled alongside tretinoin.
- **Day and night** — Today shows only the routine that is current, with the other one tap away,
  and the whole app switches to a dark theme from 6pm (overridable in Settings → Appearance).
- **Skin check-ins** — comfortable / a little dry / irritated / very irritated, plus dryness,
  stinging, redness and peeling. Significant irritation pauses progression and favours recovery.

SkinTec is a routine organiser, not a medical service. It never diagnoses, never changes a
prescription, and never progresses beyond the frequency you record as prescriber-approved.
Your dermatologist or prescriber's instructions always take priority.

## Architecture

| Area | Location |
| --- | --- |
| Scheduling engine (single source of truth for every day's plan) | `src/engine/scheduler.ts` |
| Progression ladder, approved-maximum ceiling, irritation handling | `src/engine/progression.ts` |
| Timezone-safe date maths | `src/engine/dates.ts` |
| Types and stored data shapes | `src/types.ts` |
| Default products, masks, stages | `src/data/defaults.ts` |
| Local persistence with corrupt-data recovery | `src/store/store.tsx` |
| Custom SVG icon system (no emoji anywhere) | `src/icons/SkinTecIcon.tsx` |
| Design tokens and component styles | `src/styles/` |

The UI never decides what belongs on a day — it renders `getDailyRoutine(state, date)`.
Progression stages are configuration (`TretinoinProgressionStage[]`), not hard-coded UI.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # scheduling-engine checks (24)
npm run build      # typecheck + production build
npm run preview    # serve the production build
```

## Deploying to GitHub Pages

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`
(set Settings → Pages → Source to **GitHub Actions** once).

The Vite `base` is `/Skintec/`, matching the repository name. If you rename the
repository, update `base` in `vite.config.ts` and `id` in `public/manifest.webmanifest`.

## Installing on iPhone

Open the deployed URL in Safari → Share → **Add to Home Screen**. SkinTec runs standalone,
respects the safe areas, and works offline: the app shell is cached by the service worker and
all of your data lives on the device.

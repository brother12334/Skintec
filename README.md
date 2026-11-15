# SkinTec

A skincare routine companion, built as an installable PWA for iPhone and the web.

SkinTec answers one question the moment you open it: **what am I supposed to do right now?**
It walks you through the routine one step at a time, in big type you can read from the sink.

## The plan

- **Morning, every day** — rinse, pat dry, dapsone gel, La Roche-Posay moisturizer, sunscreen (SPF 30+).
- **Night, every night** — oil cleanser, Blanc cleanser, pat dry, tonight's step, moisturizer, Vaseline.
- **Weekly schedule** — Mon BHA · Tue recovery · Wed adapalene · Thu recovery + hydrating mask ·
  Fri BHA · Sat adapalene · Sun recovery + clay mask.
- **Vaseline rule** — whole face on recovery nights; only dry or healing spots (optional) on BHA and
  adapalene nights.
- **Start slowly** — weeks 1–2: BHA Mon and Fri, everything else recovery. Weeks 3–4: adapalene on
  Wednesdays only. Week 5 on: the full schedule.
- **Go back a step** — an irritated check-in, or the button in Settings, runs the plan one phase gentler
  for a week.
- **Adapalene** — needs buying and a yes from the dapsone prescriber. Until it's marked as ready in
  Settings, adapalene nights are recovery nights.
- **Missed nights** — nothing moves. Every night follows its weekday, so the next day is just the next day.
- **Notes** — every note from the plan lives on the Notes tab, and the relevant ones show on each step.

SkinTec is a routine organiser, not a medical service. Your dermatologist or prescriber's
instructions always take priority.

## Design: Duotone

The whole app is one pastel and one deep ink of the same hue, chosen by what you're doing:
butter for mornings, peach for BHA nights, periwinkle for adapalene nights, pink for recovery
nights, with mint for masks. Type is Big Shoulders Display (condensed, uppercase) over Atkinson
Hyperlegible, both bundled so the app works offline. Dark mode keeps each pair and flips it.

## Architecture

| Area | Location |
| --- | --- |
| Which night is it, and its steps (single source of truth) | `src/engine/scheduler.ts` |
| Plan weeks, phases and stepping back | `src/engine/progression.ts` |
| Timezone-safe date maths | `src/engine/dates.ts` |
| Products, weekly schedule, phases and plan notes | `src/data/defaults.ts` |
| Local persistence and migration from the old plan | `src/store/` |
| Design tokens (moods) and styles | `src/styles/` |

The UI never decides what belongs on a day — it renders `getDailyRoutine(state, date)`.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # scheduling-engine checks
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

# Voice Trainer

A personal, offline-first web app that walks through a morning vocal warmup one exercise at a time, with animated demonstrations of each technique.

Live: https://joeuk89.github.io/voice-coach/

## Run locally

```sh
npm install
npm run dev
```

Open the URL Vite prints. To test the installable PWA and offline mode, use a production build:

```sh
npm run build
npm run preview
```

## Deploy

Every push to `main` builds the app and publishes it to GitHub Pages via `.github/workflows/deploy.yml`.

## Add or edit an exercise

Everything about the routine lives in `src/exercises.ts`, one object per exercise, in the order they run.

- `duration` is seconds per routine (`short` and `full`). `0` leaves the exercise out of that routine.
- `cues` are the 3 to 5 lines shown on screen. `tips` and `links` sit behind "More detail".
- `animation` names an entry in `src/animations/index.ts`, or `null` for no animation.
- `kind: 'audio'` with an `audioSrc` plays a bundled track from `public/audio/` instead of a countdown.

Read-aloud passages live in `src/paragraphs.ts`; wrap a word in `*asterisks*` to show it bold.

Settings (routine, enabled exercises, duration overrides), the completion log and the sustain log are stored in `localStorage` under `vt.*` keys.

## Add an animation

Create `src/animations/<id>.ts` exporting an `AnimationDef` (loop length, inline SVG, and caption phases as fractions of the loop) with a matching `<id>.css` scoped under `.anim-<id>`, then register it in `src/animations/index.ts`. Shared pieces (pitch strip, air flow, sound rings) live in `parts.ts` and `shared.css`. Colour rules: amber is air, blue is voice and pitch, rose is lips.

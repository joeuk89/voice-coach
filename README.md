# Voice Trainer

A personal, offline-first web app that walks through a morning vocal warmup one exercise at a time, with animated demonstrations of each technique.

Live: https://joeuk89.github.io/voice-coach/

## Install on the phone

Open the live URL in Chrome on Android, then choose "Add to Home screen" (or "Install app") from the menu. It opens full screen and works offline after the first load. New versions download in the background, and the app checks for one each time you come back to it. A new version takes over on Home or Settings, never during a routine.

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

## Library

Home links to the Library (`#/library`): every exercise with its animation, steps, tips and sources, without starting a routine. Tap a numbered chip to loop that step.

## Animation gallery

`/gallery.html` (live: https://joeuk89.github.io/voice-coach/gallery.html) shows every animation on one page with a scrubber that pauses all loops at the same point. Double-tap the scrubber to resume.

## Deploy

Every push to `main` builds the app and publishes it to GitHub Pages via `.github/workflows/deploy.yml`.

## Add or edit an exercise

Everything about the routine lives in `src/exercises.ts`, one object per exercise, in the order they run.

- `duration` is seconds per routine (`short` and `full`). `0` leaves the exercise out of that routine.
- `subSteps` are the ordered instructions shown on screen, each with a `text`. `tips` and `links` sit behind "More detail".
  - `weight` sets the sub-step's share of the duration relative to the others. It defaults to `1`; `0` means no timer.
  - `reps` fixes a rep count, for protocols that set one. `repSec` is the length of one rep instead, and the count comes from the sub-step's time share. `reps` wins if both are set.
  - `window` is the `[from, to)` fraction of the animation loop to play during the sub-step. Leave it out to play the whole loop.
- `animation` names an entry in `src/animations/index.ts`, or `null` for no animation.
- `kind: 'audio'` with an `audioSrc` plays a bundled track from `public/audio/` instead of a countdown.

Read-aloud passages live in `src/paragraphs.ts`; wrap a word in `*asterisks*` to show it bold.

Settings (routine, enabled exercises, duration overrides), the completion log, the sustain log and whether the first-run note was seen are stored in `localStorage` under `vt.*` keys.

## Add an animation

Create `src/animations/<id>.ts` exporting an `AnimationDef` (loop length, inline SVG, and caption phases as fractions of the loop) with a matching `<id>.css` scoped under `.anim-<id>`, then register it in `src/animations/index.ts`. Shared pieces (pitch strip, air flow, sound rings) live in `parts.ts` and `shared.css`. Colour rules: amber is air, blue is voice and pitch, rose is lips.

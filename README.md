# Voice Trainer

A personal, offline-first web app that walks through a morning vocal warmup one exercise at a time, with animated demonstrations of each technique.

Live: https://joeuk89.github.io/voice-coach/

## Install on the phone

Open the live URL in Chrome on Android, then choose "Add to Home screen" (or "Install app") from the menu. It opens full screen and works offline after the first load. New versions download in the background, and the app checks for one each time you come back to it. A new version takes over on Home or Settings, never during a routine.

## How a routine works

Pick Short or Full on Home and press Start. Each exercise walks through its steps one at a time: read the step, press Start when you are ready, and press Next when you are done. Nothing moves on by itself. Timed steps count down and stop at zero; counted steps show "Rep 3 of 8" or, on the vocal function exercises, count your holds from the stopwatch. The step list and the "n of 8" picker let you jump anywhere. Finish opens the Done screen, which logs the day and asks how your voice felt.

## Run locally

```sh
npm install
npm run dev
npm test
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

- `control` says what Settings can change. Leave it out for a timed exercise.
  - Timed: `duration` is seconds per routine (`short` and `full`). `0` leaves the exercise out of that routine. Settings sets the time.
  - `'reps'`: `reps` is the rep count per routine, `repSec` the seconds one rep takes, and `repNoun` what one rep is called ("breath"). It has no `duration`; its time is `reps × repSec`. Settings sets the count. Counted sub-steps without a fixed `reps` use it.
  - `'untimed'`: `duration` is only the time it usually takes, shown as "about N min". Settings can only switch it off.
- `subSteps` are the ordered instructions shown on screen, each with a `text`. `tips` and `links` sit behind "Tips and sources".
  - `weight` sets the sub-step's share of the duration relative to the others. It defaults to `1`; `0` means no timer.
  - `reps` fixes a rep count, for protocols that set one. A sub-step with a fixed `reps` and no `weight` takes no time share, so the timed sub-steps split the whole duration. Set a `weight` too if it should take a share. `repSec` is the length of one rep instead, and the count comes from the sub-step's time share. `reps` wins if both are set.
  - `repsPerPitch` makes the hold counter name the current pitch (adduction: two holds per pitch).
  - `window` is the `[from, to)` fraction of the animation loop to play during the sub-step. Leave it out to play the whole loop.
  - `examples` lists words or sounds to try during the sub-step. They show as chips under its text on the guided screen and in the Library.
- `animation` names an entry in `src/animations/index.ts`, or `null` for no animation.
- `kind: 'audio'` with an `audioSrc` plays a bundled track from `public/audio/` instead of a countdown.

Read-aloud passages live in `src/paragraphs.ts`, each a `text` and a `demo` line. Wrap a word in `*asterisks*` to show it bold where the pitch should rise, about one per clause and 8 to 12 per passage. The `demo` is the passage's opening clause, 4 to 8 words with 2 or 3 of them bold and marked as in the passage; the read-aloud card draws it with a pitch peak over each bold word. A test checks these counts and that the demo line fits the card.

## Settings

Settings shows one row per exercise for the selected routine. The switch turns an exercise off in both routines. A timed row steps its time by 30 s, and 0:00 leaves it out of this routine only, with a lone "+" to add it back. A counted row steps its rep count by 1, never below 1, and shows about how long that takes. An untimed row shows only about how long it takes. A row the selected routine cannot run (the audio track and the read-aloud on Short) reads "Full only" with its switch disabled. Reset to defaults clears every time and count override and turns every exercise on.

Settings (routine, enabled exercises, time and rep count overrides), the completion log, the sustain log and whether the first-run note was seen are stored in `localStorage` under `vt.*` keys.

## Add an animation

Create `src/animations/<id>.ts` exporting an `AnimationDef` (loop length, inline SVG, and caption phases as fractions of the loop) with a matching `<id>.css` scoped under `.anim-<id>`, then register it in `src/animations/index.ts`. `svg` can also be a function that builds the SVG from an input string; `mountAnimation` passes it the `input` option, and the function picks a default when there is none. Read-aloud uses this: the guided screen passes the current passage's demo line and remounts the card on "New passage". Shared pieces (pitch strip, air flow, sound rings, lips) live in `parts.ts` and `shared.css`. Colour rules: amber is air, blue is voice and pitch, rose is lips. Phase switches are hard cuts on the window edges; the player slows windows shorter than 4 s and holds the last frame for half a second. An optional `compactViewBox` crops the card on the guided screen when a panel sits under it.

## Decisions

Judgment calls that the code cannot explain are recorded in `docs/decisions-log.md`.

# Voice Trainer

A personal, offline-first web app that walks through a morning vocal warmup one exercise at a time, with animated demonstrations of each technique.

Live: https://joeuk89.github.io/voice-coach/

## Install on the phone

Open the live URL in Chrome on Android, then choose "Add to Home screen" (or "Install app") from the menu. It opens full screen and works offline after the first load. New versions download in the background, and the app checks for one each time you come back to it. A new version takes over on Home or Settings, never during a routine.

## How a routine works

Pick Short or Full on Home and press Start. Each exercise walks through its steps one at a time: read the step, press Start when you are ready, and press Next when you are done. Nothing moves on by itself. Timed steps count down and stop at zero; counted steps show "Rep 3 of 8" or, on the vocal function exercises, count your holds from the stopwatch. Low breathing's second step is paced: Start runs a 3-second "Ready" count, then the picture and the row lead each breath, in for 4 and out for 8, with a short buzz at each switch, until the routine's breath count is done. Pause freezes the picture, and Resume replays the interrupted breath after a new lead-in. The step list and the "n of 8" picker let you jump anywhere. Finish opens the Done screen, which logs the day and asks how your voice felt. Every seventh saved routine, Done also shows a Weekly check: record today's read-aloud passage in your phone's voice memo app and play last week's next to it.

The routine runs low breathing, jaw and tongue articulation, straw phonation, lip trills, sirens, hum into words, volume and dynamics, the vocal function exercises, the pitch, pause and pace read-aloud, and a cool-down. Which of them run on a given day depends on the schedule in Settings.

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

Home links to the Library (`#/library`): every exercise with its animation, steps, tips and sources, without starting a routine. An exercise that does not run every day in a routine shows its days there. Tap a numbered chip to loop that step.

## Animation gallery

`/gallery.html` (live: https://joeuk89.github.io/voice-coach/gallery.html) shows every animation on one page with a scrubber that pauses all loops at the same point. Double-tap the scrubber to resume.

## Deploy

Every push to `main` builds the app and publishes it to GitHub Pages via `.github/workflows/deploy.yml`.

## Add or edit an exercise

Everything about the routine lives in `src/exercises.ts`, one object per exercise, in the order they run.

- `control` says what Settings can change. Leave it out for a timed exercise.
  - Timed: `duration` is seconds per routine (`short` and `full`), 30 or more. Settings sets the time.
  - `'reps'`: `reps` is the rep count per routine, `repSec` the seconds one rep takes, and `repNoun` what one rep is called ("breath"). It has no `duration`; its time is `reps × repSec`. Settings sets the count. Counted sub-steps without a fixed `reps` use it.
  - `'untimed'`: `duration` is only the time it usually takes, shown as "about N min". Settings can only switch it on or off.
- `days` sets the days of the week the exercise runs on in a routine, numbered as `Date.getDay()` does: 0 is Sunday, 6 is Saturday. `{ short: [1, 3, 5] }` runs it on Monday, Wednesday and Friday in Short. A routine left out runs it every day. Settings can change the days later.
- `subSteps` are the ordered instructions shown on screen, each with a `text`. `tips` and `links` sit behind "Tips and sources".
  - `weight` sets the sub-step's share of the duration relative to the others. It defaults to `1`; `0` means no timer.
  - `reps` fixes a rep count, for protocols that set one. A sub-step with a fixed `reps` and no `weight` takes no time share, so the timed sub-steps split the whole duration. Set a `weight` too if it should take a share. `repSec` is the length of one rep instead, and the count comes from the sub-step's time share. `reps` wins if both are set.
  - `pace` (`{ inSec, outSec }`) makes a paced sub-step: after a 3-second lead-in the app leads each breath, in for `inSec` and out for `outSec`, and counts the breaths. The count is the sub-step's `reps`, else the routine's rep count on a `'reps'` exercise. Like a fixed `reps`, it takes no time share unless it sets a `weight`. A paced sub-step always plays the whole loop, so its `window` is ignored. Keep the exercise's `repSec` equal to `inSec + outSec` so Settings shows the real time; a test checks low breathing.
  - `repsPerPitch` makes the hold counter name the current pitch (adduction: two holds per pitch). If the animation defines a `holdPicture`, the card follows the counter on that sub-step instead of looping its `window`.
  - `window` is the `[from, to)` fraction of the animation loop to play during the sub-step. Leave it out to play the whole loop.
  - `examples` lists words or sounds to try during the sub-step. They show as chips under its text on the guided screen and in the Library.
- `animation` names an entry in `src/animations/index.ts`, or `null` for no animation.

Read-aloud passages live in `src/paragraphs.ts`, each a `text` and a `demo` line. Wrap a word in `*asterisks*` to show it bold where the pitch should rise, about one per clause and 8 to 12 per passage. The `demo` is the passage's opening clause, 4 to 8 words with 2 or 3 of them bold and marked as in the passage; the read-aloud card draws it with a pitch peak over each bold word. A test checks these counts and that the demo line fits the card. The card loops four 4 s passes on that line: over the top, at 70 percent, a pause pass whose flat line breaks with a pause mark before each bold word while the dot waits half a second, and a pace pass that draws a small contour slowly up to a turn between two peaks and three times faster after it. The pause and pace keyframes depend on where the bold words fall, so the card builds them with its SVG.

## Settings

Settings shows one row per exercise for the routine picked at the top. Each row's switch turns the exercise on or off in that routine only, so an exercise can run in Short, Full, both or neither. No switch is ever disabled, and the switch is the only way to leave an exercise out. A timed row steps its time by 30 s, never below 0:30. A counted row steps its rep count by 1, never below 1, and shows about how long that takes. An untimed row shows only about how long it takes. Under the time or count, seven day toggles, Monday first, set the days the exercise runs on in that routine. The last day left on cannot be turned off: use the switch to leave the exercise out. A row that is off shows only its name and switch. Nothing starts switched off. By default Short runs the vocal function exercises and the cool-down on Monday, Wednesday and Friday, and the read-aloud on Tuesday, Thursday and Saturday; Full runs everything every day. Home plans today's routine from these days and names the exercises that are on but not scheduled today. Reset to defaults switches every exercise back on, restores the default days and clears every time and count override.

Settings (routine, the exercises switched off in each routine, time and rep count overrides, and the days of each exercise that does not run every day), the completion log, the sustain log and whether the first-run note was seen are stored in `localStorage` under `vt.*` keys.

## Add an animation

Create `src/animations/<id>.ts` exporting an `AnimationDef` (loop length, inline SVG, and caption phases as fractions of the loop) with a matching `<id>.css` scoped under `.anim-<id>`, then register it in `src/animations/index.ts`. `svg` can also be a function that builds the SVG from an input string; `mountAnimation` passes it the `input` option, and the function picks a default when there is none. Read-aloud uses this: the guided screen passes the current passage's demo line and remounts the card on "New passage". Shared pieces (pitch strip, air flow, sound rings, lips) live in `parts.ts` and `shared.css`. Colour rules: amber is air, blue is voice and pitch, rose is lips. Phase switches are hard cuts on the window edges; the player slows windows shorter than 4 s and holds the last frame for half a second. An optional `compactViewBox` crops the card on the guided screen when a panel sits under it. An optional `holdPicture` mounts a picture that follows the hold counter on a `repsPerPitch` sub-step: the player parks the loop at the start of the sub-step's window and the picture draws each recorded hold (vocal function exercises draw the adduction staircase one hold at a time, see `src/animations/vfe-holds.ts`). Before each paced breath the player holds the first frame and marks the card `.anim-resting`, so a card can hide parts that belong to the cycle already running (low breathing hides its inhale air).

## Decisions

Judgment calls that the code cannot explain are recorded in `docs/decisions-log.md`.

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

Coming with the first exercises in `src/exercises.ts`.

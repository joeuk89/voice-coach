/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/voice-coach/',
  build: {
    rollupOptions: { input: ['index.html', 'gallery.html'] },
  },
  test: {
    exclude: [...configDefaults.exclude, '**/.claude/**', '**/.worktrees/**'],
  },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeManifestIcons: false,
      manifest: {
        id: '/voice-coach/',
        name: 'Voice Trainer',
        short_name: 'Voice',
        description: 'Daily vocal warmup, one exercise at a time.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3}'],
        // The Roger Love track is ~10 MB; Workbox skips files over 2 MiB unless raised.
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
      },
    }),
  ],
});

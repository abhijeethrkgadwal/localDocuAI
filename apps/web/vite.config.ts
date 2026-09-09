import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { seoDiscoverabilityPlugin } from './vite.seo-plugin';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    seoDiscoverabilityPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192.svg', 'pwa-512.svg', 'apple-touch-icon.png', 'pwa-192.png'],
      manifest: {
        name: 'LocalDocu',
        short_name: 'LocalDocu',
        description: 'Tell it what to do. Your files stay on your device.',
        theme_color: '#0F766E',
        background_color: '#F7F6F2',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['productivity', 'utilities', 'business'],
        icons: [
          {
            src: 'pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache the app shell + workers (.mjs) so reload/ops work offline after first visit.
        // User DOC/DOCX/PDF bytes and outputs are never fetched as navigable URLs — they stay
        // in memory / File System Access / download flows, so they are not SW-cached.
        globPatterns: ['**/*.{js,mjs,css,html,ico,svg,woff2,png,webp,txt,xml,webmanifest}'],
        // pdf.js worker + engine chunks exceed the default 2 MiB precache cap.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/robots\.txt$/, /^\/sitemap\.xml$/, /^\/llms/, /^\/og-image/],
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Static hashed assets: cache-first.
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'font' ||
              request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'localdocu-static',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // HTML navigations (public routes + workspace): network-first with cache fallback.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'localdocu-navigations',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      // Keep SW off in `vite` dev (HMR); use `pnpm build && pnpm preview` to test offline.
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@localdoc/core': path.resolve(rootDir, '../../packages/core/src/index.ts'),
      '@localdoc/filesystem': path.resolve(rootDir, '../../packages/filesystem/src/index.ts'),
      '@localdoc/pdf/compress-presets': path.resolve(
        rootDir,
        '../../packages/pdf/src/compress-presets.ts',
      ),
      '@localdoc/pdf': path.resolve(rootDir, '../../packages/pdf/src/index.ts'),
      '@localdoc/docx': path.resolve(rootDir, '../../packages/docx/src/index.ts'),
      // Catalog-only path — avoids pulling the execution registry (pdf-lib / docx) into the shell.
      '@localdoc/orchestration/catalog': path.resolve(
        rootDir,
        '../../packages/orchestration/src/catalog.ts',
      ),
      '@localdoc/orchestration': path.resolve(rootDir, '../../packages/orchestration/src/index.ts'),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('pdfjs-dist')) return 'pdfjs';
          if (id.includes('pdf-lib')) return 'pdf-lib';
          if (id.includes('jszip')) return 'jszip';
          if (id.includes('react-dom') || id.includes(`${path.sep}react${path.sep}`)) {
            return 'react-vendor';
          }
          if (id.includes('zod')) return 'zod';
          if (id.includes('workbox-window')) return 'workbox';
          return undefined;
        },
      },
    },
    // Large workers (pdf.js) are expected; keep the warning signal for app JS.
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
  },
});

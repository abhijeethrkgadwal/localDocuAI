import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@localdoc/core': path.resolve(rootDir, '../../packages/core/src/index.ts'),
      '@localdoc/filesystem': path.resolve(rootDir, '../../packages/filesystem/src/index.ts'),
      '@localdoc/pdf': path.resolve(rootDir, '../../packages/pdf/src/index.ts'),
      '@localdoc/docx': path.resolve(rootDir, '../../packages/docx/src/index.ts'),
      '@localdoc/orchestration': path.resolve(rootDir, '../../packages/orchestration/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
  },
});

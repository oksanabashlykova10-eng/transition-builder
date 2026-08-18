import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative build paths keep the app portable on GitHub Pages, including
  // project sites hosted below /<repository-name>/.
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});

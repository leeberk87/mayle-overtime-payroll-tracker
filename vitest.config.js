// Standalone vitest config — deliberately does NOT reuse vite.config.js,
// because the base44 plugin there requires the base44 runtime environment.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});

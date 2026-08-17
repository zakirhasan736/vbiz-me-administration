import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))
const interfacesDir = fileURLToPath(new URL('./src/interfaces', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': srcDir,
      '@interfaces': interfacesDir,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})

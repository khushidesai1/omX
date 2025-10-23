import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 58530,
    strictPort: true, // Fails if port 58530 is already in use
  },
  preview: {
    port: 58530,
    strictPort: true,
  },
})

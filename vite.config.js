import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Allow environment variables with these prefixes to be exposed to the client
  envPrefix: ['VITE_', 'URL_', 'API_KEY_', 'GOOGLE_'],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
})

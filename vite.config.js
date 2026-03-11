import { defineConfig } from 'vite'

export default defineConfig({
  // Allow environment variables with these prefixes to be exposed to the client
  envPrefix: ['VITE_', 'URL_', 'API_KEY_', 'GOOGLE_'],
})

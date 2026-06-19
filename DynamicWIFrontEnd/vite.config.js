// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // use root-relative assets so deep-route reloads resolve correctly
  build: {
    outDir: '../DynamicWiApi/wwwroot',
    emptyOutDir: true, // clear old files in target dir before building
  }
})


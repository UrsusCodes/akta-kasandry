import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// GitHub Pages serves a project site under /<repo>/, so production assets need
// that base. Dev stays at root for a clean localhost. The router basename and
// image paths derive from import.meta.env.BASE_URL, which Vite sets from this.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/akta-kasandry/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))

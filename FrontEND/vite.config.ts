import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../BackEND/certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../BackEND/certs/cert.pem')),
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../BackEND/certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../BackEND/certs/cert.pem')),
    },
  },
  build: {
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: false,
      }
    }
  }
})

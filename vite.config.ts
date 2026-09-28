import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/green-api-chat/',
  plugins: [react()],
})

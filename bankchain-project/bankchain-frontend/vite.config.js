import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend runs on 5173 by default. Backend (Spring Boot) runs on 8081.
// See .env.example for how the frontend finds the backend URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})

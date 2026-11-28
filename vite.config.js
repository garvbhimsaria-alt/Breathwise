import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: true,
    proxy: {
      // Forward /api calls to the Express backend during development.
      // This keeps API keys server-side and avoids CORS issues.
      '/api': {
        // Use IPv4 explicitly to avoid Windows resolving localhost to ::1
        target: `http://127.0.0.1:${process.env.BW_SERVER_PORT || '5000'}`,
        changeOrigin: true,
        secure: false
      }
    }
  }
});

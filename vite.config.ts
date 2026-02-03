
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Cloud Run expects the container to listen on the port provided in the PORT env var
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8080'),
    strictPort: true,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8080'),
    strictPort: true
  }
});

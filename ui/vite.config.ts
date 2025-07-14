import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ui/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    assetsInlineLimit: 0, // Force all assets to be separate files
    chunkSizeWarningLimit: 600, // Increase limit slightly for unavoidable large chunks
    rollupOptions: {
      output: {
        // Removed manual chunking to eliminate cascading lexical declaration errors
        // Let Vite handle bundling naturally for proper dependency order management
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    }
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Handle SSE by disabling buffering
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.url === '/api/sse/events') {
              proxyReq.setHeader('Connection', 'keep-alive');
              proxyReq.setHeader('Cache-Control', 'no-cache');
            }
          });
        }
      },
      '/health': 'http://localhost:8000',
      '/mcp': 'http://localhost:8000'
    }
  }
})
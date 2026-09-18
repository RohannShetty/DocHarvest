import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../src/gitbook_downloader/gui/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const nid = id.replace(/\\/g, '/')
          if (nid.includes('/node_modules/')) {
            if (nid.includes('/node_modules/react/') || nid.includes('/node_modules/react-dom/') || nid.includes('/node_modules/scheduler/')) {
              return 'vendor-react'
            }
            if (nid.includes('/node_modules/@radix-ui/')) {
              return 'vendor-radix'
            }
            if (nid.includes('/node_modules/katex/')) {
              return 'vendor-katex'
            }
            if (nid.includes('/node_modules/cytoscape/') || nid.includes('/node_modules/cytoscape-cose-bilkent/')) {
              return 'vendor-cytoscape'
            }
            if (nid.includes('/node_modules/d3/') || nid.includes('/node_modules/d3-') || nid.includes('/node_modules/dagre-d3-es/')) {
              return 'vendor-d3'
            }
            if (nid.includes('/node_modules/mermaid/') && !nid.includes('Diagram') && !nid.includes('-definition')) {
              return 'vendor-mermaid'
            }
            if (nid.includes('/node_modules/lucide-react/')) {
              return 'vendor-icons'
            }
          }
        },
      },
    },
  },
  base: './',
})

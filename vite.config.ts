import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // Resolve figma:asset/ imports to src/assets/ for production builds
    // Prefers .webp over .png when a WebP version exists (smaller files)
    {
      name: 'figma-asset-resolver',
      resolveId(id) {
        if (id.startsWith('figma:asset/')) {
          const file = id.replace('figma:asset/', '');
          // Try WebP version first (smaller)
          if (file.endsWith('.png')) {
            const webpFile = file.replace(/\.png$/, '.webp');
            const webpPath = path.resolve(__dirname, 'src/assets', webpFile);
            if (fs.existsSync(webpPath)) return webpPath;
          }
          return path.resolve(__dirname, 'src/assets', file);
        }
      },
    },
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Polyfill buffer for Solana wallet-adapter (uses Node.js Buffer)
      'buffer': 'buffer/',
    },
  },

  // Polyfill Node.js globals for Solana wallet-adapter
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ["buffer"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/ai'],
          solana: ['@solana/web3.js', '@solana/wallet-adapter-base', '@solana/wallet-adapter-react'],
          vendor: ['react', 'react-dom', 'react-router', 'zustand'],
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})

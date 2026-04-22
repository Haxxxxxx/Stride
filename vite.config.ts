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
          // React core — changes rarely, excellent cache hit rate
          'react-vendor': ['react', 'react-dom'],
          // Router — changes less often than app code
          'router': ['react-router'],
          // Firebase core — needed on every page (auth gate + App Check init)
          'firebase-core': ['firebase/app', 'firebase/auth', 'firebase/app-check'],
          // Firestore — needed on most authenticated pages
          'firebase-firestore': ['firebase/firestore'],
          // AI — only used by AIAgent + program generation (deferred)
          'firebase-ai': ['firebase/ai'],
          // Storage — only used for avatar upload (Profile + CreateProfile)
          'firebase-storage': ['firebase/storage'],
          // Functions — only used at auth boundaries (sendSignInEmail, walletSignIn, validateBetaCode)
          'firebase-functions': ['firebase/functions'],
          // Solana — isolated to lazy-loaded WalletConnectButton
          'solana': ['@solana/web3.js', '@solana/wallet-adapter-base', '@solana/wallet-adapter-react'],
          // State + utilities
          'state': ['zustand'],
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})

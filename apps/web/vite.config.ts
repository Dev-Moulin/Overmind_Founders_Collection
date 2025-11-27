import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Base path for GitHub Pages deployment
  base: process.env.GITHUB_ACTIONS ? '/Overmind_Founders_Collection/' : '/',
  plugins: [
    react(),
    // CSP disabled - RainbowKit/WalletConnect require dynamic inline styles
    // Security is handled at the application level instead
  ],
});

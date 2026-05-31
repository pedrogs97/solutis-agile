import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import { imagetools } from 'vite-imagetools'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    imagetools(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    checker({
      typescript: {
        buildMode: true,
      },
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"', // Customize ESLint command if needed
        watchPath: './src',
      },
      overlay: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    transformer: 'postcss', // Use PostCSS instead of Lightning CSS
    lightningcss: {
      errorRecovery: true, // Enable error recovery as a fallback
    },
  },
})

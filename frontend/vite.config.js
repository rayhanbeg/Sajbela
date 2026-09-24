import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        /*
         * Split the vendor libraries out of the app chunk. Everything here is
         * long-lived and cacheable, so a shopper who returns after a deploy
         * re-downloads only the app code, not React and Swiper along with it.
         *
         * Swiper in particular is only needed by the home hero, so keeping it
         * separate stops it from blocking the shop and checkout routes.
         */
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-state": ["@reduxjs/toolkit", "react-redux", "axios"],
          "vendor-swiper": ["swiper", "swiper/react"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
})

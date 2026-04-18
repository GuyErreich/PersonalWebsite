import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const VENDOR_PATH = "/node_modules/";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes(VENDOR_PATH)) return undefined;

          if (
            id.includes("/three/") ||
            id.includes("/@react-three/fiber/") ||
            id.includes("/@react-three/drei/")
          ) {
            return "three-vendor";
          }

          if (id.includes("/framer-motion/") || id.includes("/gsap/")) {
            return "motion-vendor";
          }

          if (id.includes("/@supabase/")) {
            return "supabase-vendor";
          }

          return "vendor";
        },
      },
    },
  },
});

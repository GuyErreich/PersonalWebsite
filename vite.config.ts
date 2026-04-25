import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const VENDOR_PATH = "/node_modules/";
const EXPOSE_DEV_SERVER = process.env.VITE_DEV_SERVER_HOST === "true";

const normalizeModuleId = (id: string) => id.replace(/\\/g, "/");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: EXPOSE_DEV_SERVER ? true : "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = normalizeModuleId(id);

          if (!normalizedId.includes(VENDOR_PATH)) return undefined;

          if (normalizedId.includes("/framer-motion/") || normalizedId.includes("/gsap/")) {
            return "motion-vendor";
          }

          if (normalizedId.includes("/@supabase/")) {
            return "supabase-vendor";
          }

          return "vendor";
        },
      },
    },
  },
});

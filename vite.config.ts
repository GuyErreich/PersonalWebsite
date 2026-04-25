import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const VENDOR_PATH = "/node_modules/";

const normalizeModuleId = (id: string) => id.replace(/\\/g, "/");

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const exposeDevServer = env.VITE_DEV_SERVER_HOST === "true";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: exposeDevServer ? true : "127.0.0.1",
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
  };
});

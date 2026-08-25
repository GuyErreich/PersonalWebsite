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
      // Keep Three / particles off the critical preload path; they load with their lazy sections.
      modulePreload: {
        resolveDependencies(filename, deps) {
          if (!filename.includes("index")) {
            return deps;
          }

          return deps.filter(
            (dep) =>
              !dep.includes("three-vendor") &&
              !dep.includes("particles-vendor") &&
              !dep.includes("HeroWebGlBackground") &&
              !dep.includes("DevOpsBackground") &&
              !dep.includes("GamingIconsBackground"),
          );
        },
      },
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

            if (
              normalizedId.includes("/node_modules/three/") ||
              normalizedId.includes("/node_modules/three-stdlib/") ||
              normalizedId.includes("/node_modules/@react-three/")
            ) {
              return "three-vendor";
            }

            if (
              normalizedId.includes("/node_modules/@tsparticles/") ||
              normalizedId.includes("/node_modules/tsparticles")
            ) {
              return "particles-vendor";
            }

            return "vendor";
          },
        },
      },
    },
  };
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8080,
    host: true,
    strictPort: false, // Allow fallback to next available port
    hmr: {
      overlay: true,
      port: 24678, // Dedicated HMR port
    },
    watch: {
      usePolling: true, // Better Windows compatibility
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});

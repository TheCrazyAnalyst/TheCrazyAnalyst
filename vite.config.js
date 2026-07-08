import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standalone, framework-agnostic build: outputs static files in dist/
// that can be hosted anywhere (Vercel, Netlify, GitHub Pages, your own
// server) or wrapped into an installable PWA / APK. No dependency on
// Claude.ai or the Artifacts runtime.
export default defineConfig({
  plugins: [react()],
  base: "./", // relative asset paths so the build works from any subfolder or file://-style APK webview
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

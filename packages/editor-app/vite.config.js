import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {port: 5780},
  plugins: [react()],
  build: {outDir: "dist", minify: false, keepNames: true}
});


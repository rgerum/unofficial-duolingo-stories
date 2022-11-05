import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {port: 5779},
  plugins: [react()],
  build: {outDir: "dist"}
});


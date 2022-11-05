import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            name: "story-component",
            entry: 'src/index.js'
        },
        minify: 'eslint'
    }
});


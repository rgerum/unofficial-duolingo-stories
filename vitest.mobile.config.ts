import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["app-mobile/**/*.test.ts"],
    environment: "node",
  },
});

import { defineConfig } from "cypress";

export default defineConfig({
  projectId: 'cvszgh',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});

import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Browser tests run with Playwright (npm run test:e2e), not Vitest.
    exclude: ["**/node_modules/**", "tests/e2e/**"],
    globals: true,
  },
});

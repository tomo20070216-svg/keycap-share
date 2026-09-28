import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // Supabaseに実際にアクセスする結合テストは npm run test:integration で別に実行する
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
  },
});

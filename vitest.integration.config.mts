import { defineConfig } from "vitest/config";
import path from "node:path";

// Supabaseに実際にアクセスする結合テスト用の設定(npm run test:integration)
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    setupFiles: ["./vitest.integration.setup.ts"],
    testTimeout: 30_000,
    // 保存・取得の結果ログを証拠として残すため、成功時も console.log を表示する
    reporters: ["verbose"],
    silent: false,
  },
});

import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Run with `npm test` using the lockfile-managed test runner. */
export default {
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": path.join(root, "src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
};

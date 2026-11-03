import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** Run with `npm test` (npx vitest@2.1.9, not a lockfile dependency yet). */
export default {
  resolve: { alias: { '@': path.join(root, 'src') } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
};

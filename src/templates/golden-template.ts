export const GOLDEN_TEMPLATE_FILES: Record<string, string> = {
  'package.json': JSON.stringify(
    {
      name: 'hackstack-starter',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        test: 'vitest run',
        'db:push': 'prisma db push'
      },
      dependencies: {
        '@prisma/client': '^5.22.0',
        next: '^15.1.7',
        react: '^19.0.0',
        'react-dom': '^19.0.0'
      },
      devDependencies: {
        prisma: '^5.22.0',
        typescript: '^5',
        vitest: '^2.1.8',
        '@types/node': '^20',
        '@types/react': '^19'
      }
    },
    null,
    2
  ) + '\n',
  'tsconfig.json': JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        lib: ['dom', 'dom.iterable', 'esnext'],
        strict: true,
        noEmit: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        jsx: 'preserve',
        incremental: true,
        paths: { '@/*': ['./src/*'] }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules']
    },
    null,
    2
  ) + '\n',
  '.gitignore': 'node_modules\n.next\n.env\n.env.local\n',
  'src/app/layout.tsx': [
    "import type { ReactNode } from 'react';",
    '',
    'export default function RootLayout({ children }: { children: ReactNode }) {',
    '  return (',
    '    <html lang="en">',
    '      <body>{children}</body>',
    '    </html>',
    '  );',
    '}',
    ''
  ].join('\n'),
  'src/app/page.tsx': [
    'export default function Home() {',
    '  return (',
    '    <main style={{ padding: 32, fontFamily: "sans-serif" }}>',
    '      <h1>Starter ready</h1>',
    '      <p>Your generated API lives at /api/main.</p>',
    '    </main>',
    '  );',
    '}',
    ''
  ].join('\n')
};

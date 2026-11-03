import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { 0: token('surface-0'), 1: token('surface-1'), 2: token('surface-2') },
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        fg: { DEFAULT: token('fg'), 2: token('fg-2'), 3: token('fg-3') },
        accent: { DEFAULT: token('accent'), hover: token('accent-hover') },
        success: token('success'),
        info: token('info'),
        warning: token('warning'),
        danger: token('danger'),
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '4px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;

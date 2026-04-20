import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surfaceAlt: 'var(--surface-alt)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        text: 'var(--text)',
        muted: 'var(--muted)'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(232, 255, 71, 0.35), 0 20px 35px rgba(0, 0, 0, 0.45)'
      },
      backgroundImage: {
        noise:
          'radial-gradient(circle at 15% 20%, rgba(26,115,232,0.14), transparent 35%), radial-gradient(circle at 85% 15%, rgba(232,255,71,0.1), transparent 30%), radial-gradient(circle at 40% 80%, rgba(39,56,92,0.28), transparent 35%)'
      }
    }
  },
  plugins: []
};

export default config;

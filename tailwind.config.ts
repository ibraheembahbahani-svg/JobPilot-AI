import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { ink: '#172039', muted: '#8490a4', brand: '#5f64eb', surface: '#ffffff', canvas: '#f7f8fb' },
      fontFamily: { sans: ['DM Sans', 'Arial', 'sans-serif'], display: ['Manrope', 'Arial', 'sans-serif'] },
      boxShadow: { soft: '0 8px 26px rgba(28,39,74,.035)' }
    }
  },
  plugins: []
};
export default config;

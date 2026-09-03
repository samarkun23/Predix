import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        bg: '#07050E',
        bg2: '#0B0818',
        panel: 'rgba(255,255,255,0.025)',
        panelStrong: 'rgba(255,255,255,0.045)',
        border: 'rgba(139,92,246,0.18)',
        borderStrong: 'rgba(139,92,246,0.35)',
        text: '#E4E1F5',
        textDim: '#857FA8',
        textFaint: '#4E4870',
        pink: '#FF2E9A',
        cyan: '#2DF4E6',
        green: '#39FF9E',
        red: '#FF4D6D',
        purple: '#9B6BFF',
        amber: '#FFC24B',
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '5px',
        md: '6px',
      },
      boxShadow: {
        'glow-pink': '0 0 16px rgba(255,46,154,0.45)',
        'glow-cyan': '0 0 16px rgba(45,244,230,0.45)',
        'glow-green': '0 0 16px rgba(57,255,158,0.45)',
        'glow-purple': '0 0 16px rgba(155,107,255,0.45)',
      },
      dropShadow: {
        'glow-pink': '0 0 8px rgba(255,46,154,0.6)',
        'glow-cyan': '0 0 8px rgba(45,244,230,0.6)',
        'glow-green': '0 0 8px rgba(57,255,158,0.6)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.4)' },
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config

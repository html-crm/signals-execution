/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // RISKY-DEX Color Palette
        background: {
          primary: '#0a0e14',
          secondary: '#0f141a',
          tertiary: '#151c24',
          panel: '#111820',
          panelHover: '#161f2a',
        },
        accent: {
          primary: '#00e5ff', // electric cyan
          secondary: '#7c3aed', // violet
          tertiary: '#06b6d4', // cyan-600
        },
        status: {
          success: '#10b981', // green
          danger: '#ef4444', // red
          warning: '#f59e0b', // amber
          info: '#3b82f6', // blue
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
          inverse: '#0a0e14',
        },
        border: {
          primary: '#1e293b',
          secondary: '#334155',
          accent: '#00e5ff',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'live-indicator': 'liveIndicator 1.5s ease-in-out infinite',
        'number-change': 'numberChange 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 229, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.6)' },
        },
        liveIndicator: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        numberChange: {
          '0%': { transform: 'translateY(-2px)', opacity: '0.5' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'panel': '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
        'panel-hover': '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4)',
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-panel': 'linear-gradient(135deg, rgba(21, 28, 36, 0.8) 0%, rgba(15, 20, 26, 0.9) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00e5ff 0%, #7c3aed 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      },
    },
  },
  plugins: [],
}
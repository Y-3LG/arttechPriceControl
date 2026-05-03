export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0e0e0e',
        bg1:     '#161616',
        bg2:     '#1e1e1e',
        bg3:     '#272727',
        border:  '#2a2a2a',
        border2: '#3a3a3a',
        text1:   '#e8e8e8',
        text2:   '#888888',
        text3:   '#484848',
        accent:  '#c8ff00',
        danger:  '#ff4d4d',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
      },
    },
  },
  plugins: [],
};

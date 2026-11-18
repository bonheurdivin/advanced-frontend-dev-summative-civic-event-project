/* Tailwind CDN theme: one accessibility-focused typeface + two brand colours. */
tailwind.config = {
  theme: { extend: {
    fontFamily: { sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'] },
    colors: { ink: '#0F2A3D', civic: { DEFAULT: '#0E6F78', dark: '#0A5860' } }
  } }
};
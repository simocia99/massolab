/** @type {import('tailwindcss').Config} */
const OCRA = { 50: '#FBF5EE', 100: '#F6E9DB', 200: '#EDD3B6', 300: '#E2B98C', 400: '#D4A06B', 500: '#C98B4E', 600: '#9A5F2A', 700: '#7D4C22', 800: '#5F3A1A', 900: '#432913' };
const SLATE = { 50: '#F1F4F5', 100: '#E1E8EA', 200: '#C5D2D6', 300: '#A3B5BB', 400: '#7C949C', 500: '#5F7A83', 600: '#4A6470', 700: '#3C515B', 800: '#2E3F46', 900: '#212D32' };
const PLUM = { 50: '#F7F2F5', 100: '#EEE3EA', 200: '#DCC8D4', 300: '#C4A8B9', 400: '#A6879A', 500: '#8C6D80', 600: '#7A5C6E', 700: '#634A59', 800: '#4B3843', 900: '#35282F' };
const OLIVE = { 50: '#F2F5EE', 100: '#E3EADA', 200: '#C8D6B5', 300: '#A9BE8E', 400: '#8AA36B', 500: '#6E8A50', 600: '#4F6B3A', 700: '#415830', 800: '#334526', 900: '#26331C' };

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'sans-serif'] },
      // Estetica v2, pesi "un po' più bold" (scelta utente): Instrument Sans 400-700 è caricato,
      // ogni livello sale di un gradino (testo 500, titoli 600, grassetti 700).
      fontWeight: { normal: '500', medium: '600', semibold: '700', bold: '700', extrabold: '700', black: '600' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.28, 0.11, 0.32, 1)', apple: 'cubic-bezier(0.28, 0.11, 0.32, 1)' },
      transitionDuration: { DEFAULT: '400ms' },
      // shadcn/ui theme tokens used by the original Base44 build (see :root in index.css).
      colors: {
        // Palette v2: "red" is now the sage brand scale (keeps every existing
        // red-* class working), "gray" is warm stone. Real errors use "danger".
        red: { 50: '#F1F4F1', 100: '#E3E9E4', 200: '#C9D3CB', 300: '#A9B8B0', 400: '#7F9285', 500: '#66796B', 600: '#56695C', 700: '#46574B', 800: '#36433A', 900: '#27302A' },
        sage: { 50: '#F1F4F1', 100: '#E3E9E4', 200: '#C9D3CB', 300: '#A9B8B0', 400: '#7F9285', 500: '#66796B', 600: '#56695C', 700: '#46574B', 800: '#36433A', 900: '#27302A' },
        gray: { 50: '#FAF8F5', 100: '#F3F0EA', 200: '#E6E2DA', 300: '#D3CEC4', 400: '#A8A398', 500: '#6A685F', 600: '#55534C', 700: '#3E3D38', 800: '#2A2A26', 900: '#191A17', 950: '#11120F' },
        // Every other Tailwind hue is folded into four calm families so legacy
        // classes (dashboard badges, charts, icons) stay inside the palette.
        orange: OCRA, amber: OCRA, yellow: OCRA,
        blue: SLATE, sky: SLATE, cyan: SLATE, indigo: SLATE,
        purple: PLUM, violet: PLUM, fuchsia: PLUM, pink: PLUM,
        green: OLIVE, emerald: OLIVE, teal: OLIVE,
        ink: '#191A17',
        sand: '#F3F0EA',
        lime: { DEFAULT: '#CFE99A', 300: '#CFE99A', 400: '#BFDD7E' },
        ocra: { DEFAULT: '#C98B4E', text: '#9A5F2A', soft: '#F6E9DB' },
        danger: { DEFAULT: '#B3261E', soft: '#FBEAE8' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

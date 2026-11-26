/* global module, require */
const { colors } = require('./src/styles/tailwindTokens.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Tokens de src/styles/tokens.css (spec-rediseno-02-c1). La paleta por defecto
      // de Tailwind se mantiene hasta que todo esté migrado (Capa 6).
      colors,
      // Entrada de los bloques «héroe» y de las fichas (sube 6 px y aparece).
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'ring-draw': { from: { strokeDashoffset: '459px' } },
        'fill-x': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: {
        rise: 'rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'rise-slow': 'rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        // Salud: el anillo se dibuja y la barra de energía se llena desde la izquierda.
        'ring-draw': 'ring-draw 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both',
        'fill-x': 'fill-x 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both',
      },
      // Escala tipográfica de la piel v2 (spec-capa6-v2-premium, RF-B3): mínimo 11 px (`text-2xs`,
      // sin interlineado propio, como las clases arbitrarias a las que sustituye) y el extremo
      // grande 1–4 px más ancho que Tailwind. Interlineados, los de Tailwind.
      fontSize: {
        '2xs': '11px',
        xs: ['12px', { lineHeight: '1rem' }],
        sm: ['14px', { lineHeight: '1.25rem' }],
        base: ['16px', { lineHeight: '1.5rem' }],
        lg: ['19px', { lineHeight: '1.75rem' }],
        xl: ['22px', { lineHeight: '1.75rem' }],
        '2xl': ['26px', { lineHeight: '2rem' }],
        '3xl': ['34px', { lineHeight: '2.25rem' }],
      },
      // Inter para la interfaz y JetBrains Mono (400 y 500) para metadatos y cifras (D8).
      // Las alternativas son las de antes: sin la fuente web se ve igual que hasta ahora.
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      // Radios concéntricos de la piel (6/8/12/16/20).
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      // Sombras con valor en tokens.css (spec-rediseno-02-c2; niveles de la piel v2: reposo
      // `xs`/`sm`/`card`, flotante `lg`/`xl` y modal `2xl`).
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        card: 'var(--shadow-card)',
        lg: 'var(--elev-2)',
        xl: 'var(--elev-2)',
        '2xl': 'var(--elev-3)',
        // Carril hundido: anillo interior de 1 px del token de línea.
        'inset-line': 'inset 0 0 0 1px rgb(var(--line))',
      },
      // Movimiento (tokens `--dur-*` y `--ease-out`).
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
      },
      transitionTimingFunction: {
        forma: 'var(--ease-out)',
      },
      // Sin `transition: all` (MOV-1): solo pintura y transformación (más ancho/alto/trazo, que
      // usan barras y anillos), nunca márgenes, rellenos ni posicionamiento.
      transitionProperty: {
        paint: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, width, height, stroke-dashoffset, stroke-dasharray',
      },
      // Pulsación única (MOV-3, RF-D5): `active:scale-press` (0,98; 1 con movimiento reducido).
      scale: {
        press: 'var(--press-scale)',
      },
      // Comodidad (RF-D5): separación entre secciones 32/48 px, padding de tarjeta 16/24 px y
      // ancho máximo de contenido de 1200 px.
      spacing: {
        section: '2rem',
        'section-lg': '3rem',
        card: '1rem',
        'card-lg': '1.5rem',
      },
      maxWidth: {
        content: '1200px',
      },
      // Orden de capas de la shell (spec-rediseno-02-c3). Los valores viven en tokens.css.
      zIndex: {
        sticky: 'var(--z-sticky)',
        nav: 'var(--z-nav)',
        'nav-menu': 'var(--z-nav-menu)',
        sheet: 'var(--z-sheet)',
        tooltip: 'var(--z-tooltip)',
        modal: 'var(--z-modal)',
        floating: 'var(--z-floating)',
        map: 'var(--z-map)',
        toast: 'var(--z-toast)',
      },
    },
  },
  plugins: [],
}

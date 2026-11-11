import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Browsers without the new viewport units (Safari < 15.4, older Android) get a
// plain "vh" copy of every svh/dvh/lvh declaration first; modern ones override it.
const viewportFallback = () => ({
  postcssPlugin: 'viewport-units-fallback',
  Declaration(decl) {
    if (decl.raws.vhFallback || !/\d(svh|dvh|lvh)\b/.test(decl.value)) return;
    decl.raws.vhFallback = true;
    const copy = decl.cloneBefore({ value: decl.value.replace(/(\d)(svh|dvh|lvh)\b/g, '$1vh') });
    copy.raws.vhFallback = true;
  },
});
viewportFallback.postcss = true;

export default { plugins: [tailwindcss(), viewportFallback(), autoprefixer()] };

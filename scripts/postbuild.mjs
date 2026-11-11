// GitHub Pages serves 404.html for unknown paths: copying index.html lets
// deep links such as /BlogPost?slug=... and /ClientArea load the SPA.
import { copyFileSync, existsSync } from 'node:fs';
if (existsSync('dist/index.html')) copyFileSync('dist/index.html', 'dist/404.html');

// GitHub Pages serves 404.html for unknown paths: copying index.html lets
// deep links such as /BlogPost?slug=... and /ClientArea load the SPA.
// The pages of the installable app (MassoLab Studio) also get a real copy, so
// they answer with status 200: safer for the manifest start_url and for
// "Add to Home Screen" / "Add to Dock".
import { copyFileSync, existsSync } from 'node:fs';
if (existsSync('dist/index.html')) {
  copyFileSync('dist/index.html', 'dist/404.html');
  for (const page of ['TherapistDashboard', 'TherapistLogin']) copyFileSync('dist/index.html', `dist/${page}.html`);
}

# Progressive Web App

The root layout links public/manifest.json and includes PwaProvider. Icons use the existing college logo in Android, maskable and Apple sizes. Supported browsers can install the portal in standalone mode. A dismissible install suggestion appears only on landing and login pages when supported; iPhone/iPad users see Add to Home Screen guidance.

Service-worker registration runs only in production on a secure origin (HTTPS or localhost). Test using npm run build followed by npm start. In browser DevTools, check Application > Manifest and Service Workers. Install the app, reopen it from the home screen, then switch offline and perform a full-page navigation to test the offline page.

The worker precaches icons and offline.html only. APIs, authenticated HTML, RSC payloads and Next.js bundles are not stored in Cache Storage. Offline attendance submissions, leave edits and uploads are not supported. Existing pages show a connection notice while offline. The worker never forces a reload during data entry; a new worker activates naturally after old tabs close.

Run node --test lib/pwa.test.mjs to check manifest icons, public assets and worker request handling. Device installation and visual checks must still be done in a browser over HTTPS after deployment.

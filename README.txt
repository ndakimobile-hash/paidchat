PAIDCHAT.SITE — Static website / PWA preview

FILES
- index.html: website interface and client-side chat simulation
- logo.svg: site logo
- manifest.webmanifest: installable web app settings
- sw.js: service worker for app shell/offline loading
- icons/: Android/PWA icons

LOCAL PREVIEW
Open index.html in a browser to inspect the website. Install prompts and service worker installation require the site to be served over HTTPS (or localhost). When deployed to an HTTPS domain, Android Chrome can offer Install app; on iPhone Safari use Share > Add to Home Screen.

IMPORTANT LIMITATIONS
- This project has no backend, login database, live chat service, or payment provider.
- Chat replies are generated locally for preview.
- The wallet is saved with localStorage on this browser/device only. Clearing browser site data can erase it; it does not sync between devices.
- The online number is an animated visual counter, not a live verified user count.
- Finishing a chat adds a simulated amount to the local demo balance; it is not a real payment.
- Withdraw flow is a front-end verification message only and does not send money or validate an account on a server.
- Profile photos and transaction/review content are sample presentation content and should not be represented as verified real users or payments.

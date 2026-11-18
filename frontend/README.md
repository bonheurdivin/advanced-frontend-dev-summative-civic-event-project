# CivicEvents+ Frontend
HTML + Tailwind CSS (CDN) + jQuery. No build step.

## Run locally
1. Start the backend (see backend/README.md): `npm run dev` -> http://localhost:4000
2. Set `API_BASE_URL` in `js/config.js` to the backend URL/port.
3. Serve this folder (e.g. VS Code "Live Server", or `npx serve .`) and open `login.html`.

## Structure
`js/config.js` settings · `js/auth.js` token + user store · `js/api.js` API wrapper · `js/guards.js` role guards · `js/ui.js` toasts/helpers
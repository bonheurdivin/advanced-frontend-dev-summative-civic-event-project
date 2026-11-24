# CivicEvents+ Frontend

An accessible, responsive city events and services portal. This is the **frontend only**, built with **HTML, Tailwind CSS (CDN) and jQuery**. There is no build step. It consumes the provided CivicEvents+ REST API (Node.js, Express, PostgreSQL).

## Features

| Area | Normal user | Admin |
|---|---|---|
| Auth | Sign up (password strength meter and policy), log in, session or persistent sign-in | Same |
| Events | Browse published events, search and filter by date or location, paginate, view details, register or cancel, leave and edit one feedback per event | Create, edit and delete events (image upload with preview), see drafts, see registrants and all feedback with the average rating |
| Announcements | List and play audio | Upload audio, publish or unpublish, delete |
| Promos | List and watch video with captions and transcript | Upload video with caption text, edit, publish or unpublish, delete |
| Notifications | Bell with unread count and drawer, link to related event | Same, plus delete notifications |
| Dashboard | Personal statistics | Platform statistics |
| Users | Edit own name and email | View users, enable or disable accounts (roles can never be changed from the UI) |

## Requirements

- Node.js 18+ and PostgreSQL 15+ (for the backend)
- VS Code with the **Live Server** extension (or any static file server)
- A modern browser (Chrome, Edge, Firefox, Safari)

## 1. Set up and run the backend

The backend lives in `backend/`. Full details are in `backend/README.md`; the short version:

1. Create the database (the name has a hyphen, so quote it):
   ```sql
   CREATE DATABASE "civic-events-db";
   ```
2. Create the tables from `backend/`.

   PowerShell:
   ```powershell
   $env:PGPASSWORD="your-password"
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d civic-events-db -h localhost -p 5432 -f ./migrations/001_create_tables.sql
   ```
   Git Bash / macOS / Linux:
   ```bash
   PGPASSWORD=your-password psql -U postgres -d civic-events-db -h localhost -p 5432 -f ./migrations/001_create_tables.sql
   ```
3. Create your environment file: copy `backend/.env.example` to `backend/.env` and fill in your own values (database user, password, name, host, port, `JWT_SECRET`). **`.env` is git-ignored and never committed.**
4. Install and start:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   You should see `Successfully connected to PostgreSQL`. The API runs at **http://localhost:4000** (use the port printed in the console).

## 2. Create demo accounts and sample data

1. Run the frontend (step 3 below) and **sign up** two accounts, for example `admin@user.com` and `test@user.com`. The public form always creates normal users.
2. Promote one account to admin (this is intentional, so no one can make themselves admin from the UI):
   ```sql
   UPDATE users SET role='admin' WHERE email='admin@user.com';
   ```
3. Load the sample events, registrations and notifications (`backend/migrations/002_seed_data.sql`, added in this project because the provided `db:seed` script pointed to a missing file). Run it with the same `psql` command as step 2 above, replacing the file name. It is safe to run more than once.
4. Announcements and promos need real media files, so upload them from the admin screens.

## 3. Connect and run the frontend

1. Open `frontend/js/config.js` and set the backend address:
   ```js
   window.CONFIG = { API_BASE_URL: 'http://localhost:4000', ... };
   ```
   This is the only setting the frontend needs. There are no frontend environment variables.
2. In VS Code, right-click `frontend/login.html` and choose **Open with Live Server** (usually `http://127.0.0.1:5500/frontend/login.html`).
   Alternative: `npx serve frontend`.
3. Keep the backend running while you use the app.

## Upload limits (enforced by the backend, checked in the UI before uploading)

| File | Limit |
|---|---|
| Event image | 2 MB |
| Announcement audio | 5 MB |
| Promo video | 8 MB |

## Role-based access guards

The backend is the real security layer (it checks the JWT role on every protected route). The frontend guards are for user experience and are documented in the code:

- **`js/guards.js`** contains `requireAuth()`, `requireAdmin()`, `guestOnly()` and `applyRoleUI()`, with comments explaining each.
- **Page guards:** every signed-in page calls `Layout.init()` (which runs `requireAuth`). Admin-only pages (`users.html`, `event-form.html`) also call `Guards.requireAdmin()`. Normal users are redirected to the dashboard with a 403 message.
- **Element guards:** controls are marked `data-role="admin"` (create, edit, delete, publish, registrants, user management) or `data-role="user"` (register, feedback, My events). `Guards.applyRoleUI()` shows only the set that matches the signed-in role.
- **Token handling (`js/auth.js`, `js/api.js`):** "Keep me signed in" uses `localStorage`, otherwise `sessionStorage`. `localStorage` survives restarts but is readable by any script on the page, so all output is escaped. Every protected request sends `Authorization: Bearer <token>`. Tokens last 1 hour. An expired or invalid token (401) signs the user out and shows a message. A 403 shows a permission message.

## Project structure

```
frontend/
  login.html  signup.html  dashboard.html
  events.html  event-detail.html  event-form.html  my-registrations.html
  announcements.html  announcement-detail.html
  promos.html  promo-detail.html
  profile.html  users.html
  css/site.css                  shared look and feel
  js/config.js                  API base URL and storage keys
  js/auth.js                    token and user store
  js/api.js                     API wrapper (headers, errors, 401/403, upload progress)
  js/guards.js                  role guards
  js/ui.js                      toasts, field errors, loading buttons
  js/layout.js                  header, footer, notification bell and drawer
  js/media.js                   file checks, time formatting, caption (WebVTT) builder
  js/theme.js                   Tailwind theme
```

## API endpoints used

Auth: `POST /api/auth/signup`, `POST /api/auth/login`.
Users: `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id/enable|disable`, `GET|PATCH /api/users/profile/me`.
Events: `GET|POST /api/events`, `GET|PUT|DELETE /api/events/:id`.
Registrations: `POST /api/event-registrations/register`, `POST .../cancel`, `GET .../my-registrations`, `GET .../event/:id/attendees` (admin).
Feedback: `POST /api/event-feedback`, `PUT /api/event-feedback/:id`, `GET .../my-feedback`, `GET .../event/:id` (admin only).
Announcements: `GET|POST /api/announcements`, `GET|DELETE /api/announcements/:id`, `PATCH .../:id/publish|unpublish`.
Promos: `GET|POST /api/promos`, `GET|PUT|DELETE /api/promos/:id`, `PATCH .../:id/publish|unpublish`.
Notifications: `GET /api/notifications`, `GET|DELETE /api/notifications/:id`.
Dashboard: `GET /api/dashboard/admin`, `GET /api/dashboard/me`.

## Accessibility and UX

Semantic HTML landmarks, skip link, labelled form fields with inline error messages, `aria-live` regions, visible focus rings, keyboard-operable dialogs and menus, alt text on images, high-contrast colours, captions on promo videos (on by default with a transcript), and reduced-motion support. Mobile-friendly and responsive design. Lists display skeleton loaders, there are empty states and a retry button for errors, heavy media loads lazily, and small actions (cancelling registration, reading a notification) are instantly updated and rolled back in case of errors.

## Known limitations and design decisions

- Only admins can see all feedback for an event (a backend rule), so it only shows users their own feedback, and it shows everyone's feedback with the average rating for admins.
- The API only saves promo captions as plain text, therefore the UI breaks sentences into timed WebVTT cues, evenly distributed throughout the video. Not connected to speech. Real WebVTT text is used as-is.
- Each notification has a single "read" flag, and per browser, which notifications you have opened is also tracked.
- There is no mark-as-read endpoint in the backend, and events and users are not paginated by the API, so searching, filtering and paging happen in the browser.

## Backend changes made in this project

- Added `backend/migrations/002_seed_data.sql` (the seed file was missing).
- Added a check in `login` so disabled accounts (`is_active = false`) cannot sign in.
- Added `backend/.env.example` and stopped tracking `backend/.env`.

## Troubleshooting

- **Blank lists or network errors:** check the backend is running and `API_BASE_URL` matches its port.
- **CORS error in the console:** enable CORS in the backend for the Live Server origin.
- **401 right after login:** the token expired (1 hour). Sign in again.
- **Upload rejected:** check the size limits above.
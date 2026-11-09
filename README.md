# UC-RSO Website

Website of the University of the Cordilleras Research Services Office: projects, news, partners, gallery, video, contact form, and a staff page for posting updates.

**New to this project? Read [HANDOVER.md](HANDOVER.md) first.** It explains everything in plain language.

## Quick start
1. Install Node.js 18+ (LTS) from https://nodejs.org
2. Open this folder in VS Code.
3. Copy `.env.example` to a new file named `.env` and set `ADMIN_PASSWORD`.
4. In the VS Code terminal run `npm start` (or press F5).
5. Open http://localhost:3000. Staff page: http://localhost:3000/admin.html

## Folder map
| Path | What it is |
|---|---|
| `server.js` | The small program that runs the site and saves news, projects, and messages |
| `public/index.html` | The home page |
| `public/admin.html` | The staff page |
| `public/data/*.json` | Services, partners, gallery, and contact details (easy to edit) |
| `public/images/`, `public/video/` | Photos, logo, and video |
| `seed/` | The starting news and projects |
| `data/` | Live news, projects, and messages (created on first run, not stored in git) |

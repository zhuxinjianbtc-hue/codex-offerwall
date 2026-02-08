# Game Offer Wall

A pure frontend static demo (HTML5 + CSS3 + Vanilla JavaScript) that simulates a game offer wall. It uses hash routing, mobile‑first responsive layout, `localStorage` persistence, automatic task review/crediting, redemption flows, leaderboard, profile settings, and UI animations.

## Feature Highlights

- SPA with hash routes:
  - `#/login`
  - `#/tasks`
  - `#/task/:id`
  - `#/my-tasks`
  - `#/wallet`
  - `#/leaderboard`
  - `#/profile`
- Always guest mode: auto guest session on load (no login UI)
- New users get a 100‑coin bonus by default
- Offer wall search, filters, sorting, and featured tasks
- Task submission -> Pending -> auto Approved in ~5s (demo)
- Wallet timeline, redemption modal, redemption history
- Top 20 leaderboard with current user highlight
- Profile with invite code/link, notifications, FAQ accordion, logout (auto guest again)
- UI animations: page transitions, button feedback, counting numbers, CSS confetti, toast, pull-to-refresh

## Data

- 20 real popular mini games as simulated offers
- 20 mock leaderboard users
- All mock data lives in `js/data.js`
- User state stored in `localStorage`

## Local Usage

1. Open `index.html` directly in a browser (offline friendly)
2. Or serve the folder with any static server

## GitHub Pages Deployment

1. Create a GitHub repository (recommended name: `game-offer-wall`)
2. Upload everything inside the `game-offer-wall` folder to the repo root
3. Go to `Settings` -> `Pages`
4. Under `Build and deployment`, choose `Deploy from a branch`
5. Select `main` branch and `/ (root)` folder, then save
6. Visit: `https://yourusername.github.io/game-offer-wall/`

## One-Click Publish (optional)

If you have GitHub CLI installed and authenticated, run:

```bash
./publish.sh game-offer-wall
```

This script will initialize git (if needed), create the repo, push to GitHub, and enable Pages. It prints the public URL at the end.

## Project Structure

```text
game-offer-wall/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── data.js
│   ├── auth.js
│   ├── tasks.js
│   ├── wallet.js
│   └── ui.js
├── assets/
└── README.md
```

## Customization

- `js/data.js`: update offer data, leaderboard users, FAQ, redemption options
- `js/app.js`: routing and app‑level logic
- `js/tasks.js`: offer wall logic and task detail behavior
- `js/wallet.js`: redemption and timeline rendering
- `js/ui.js`: shared UI utilities and copy

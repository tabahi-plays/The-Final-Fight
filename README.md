# Bauna Kid vs Nimbu Chatora — Stage 2

This update adds a playable early combat prototype.

## Features
- Choose either fighter; the other becomes CPU.
- Procedural 3D fighter previews and a 3D arena.
- Keyboard controls: A/D or arrows to move, J punch, K kick, L special, Space block.
- Touch controls for mobile.
- Health bars, 60-second round timer, simple CPU behavior.
- Best-of-three scoring: first fighter to win two rounds wins.
- Rematch returns to character selection.
- Character data is separated in `src/characters.js` for future roster expansion.
- Phase 1 only: no online multiplayer or room codes.

## Important prototype notes
- The fighters are procedural placeholder models, not final photo-realistic likeness models.
- Attacks currently use simple range checks and basic pose changes; this is a gameplay prototype, not a finished commercial fighting engine.
- Special attacks currently deal 30 damage when the opponent is in range. Character-specific cinematic animation and spoken audio are planned for a later pass.
- The CPU uses a basic approach-and-attack behavior.

## Run locally
Serve the folder with a static server (ES modules do not work reliably from `file://`):
```bash
python -m http.server 8000
```
Open `http://localhost:8000`.

## Update GitHub
Extract the ZIP and upload/replace the project files in the repository. Keep the `src` folder and its contents. Commit the changes, then GitHub Pages will redeploy.

## GitHub Pages
Repository Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.

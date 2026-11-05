# Bauna Kid vs Nimbu Chatora — Stage 1 starter

A GitHub Pages-friendly Three.js character preview prototype.

## Included
- Two original procedural 3D placeholder fighters.
- Bauna Kid is visibly shorter than Nimbu Chatora.
- Bauna Kid has no earrings.
- Character definitions are isolated in `src/characters.js` so future fighters can be added.
- Responsive preview layout for mobile and desktop.

## Run locally
Because this project uses JavaScript modules, serve it with a local static server rather than opening `index.html` directly.

For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages
1. Create a GitHub repository.
2. Upload all files and folders in this project.
3. Open repository **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/ (root)`.
5. Save and wait for the Pages URL.

## Next modelling pass
Replace the procedural placeholder meshes in `src/main.js` with detailed `.glb` models. The supplied reference photos should only be used for the intended character likeness with the friends' permission. Keep public character names as **Bauna Kid** and **Nimbu Chatora**; do not show their real names in the game UI.

## Scope
Phase 1 only: single-player vs CPU. No online rooms, multiplayer backend, or room codes.

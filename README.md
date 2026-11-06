# The Final Fight of Rishra — finishing pass

Single-player browser fighting game prototype (Three.js via CDN).

## Updates in this build
- Removed the painted center-circle/line platform geometry; arenas now read as open ground over their background art.
- Larger fighter-selection portraits and deeper 3D-style silhouettes.
- Close-range punch/kick hit checks.
- Punches cause short recoil; two quick consecutive punches trigger a knockdown.
- Kicks cause a stronger knockback and knockdown with a recovery window.
- CPU advances into range, retreats when crowded, blocks and attacks.
- Existing arenas, special attacks, best-of-three, pause and menu flow retained.

## Controls
- Move: A/D or Left/Right
- Punch: J
- Kick: K
- Block: hold I or S
- Special: L
- Pause: Escape

Open `index.html` through GitHub Pages or a local static server. Internet access is needed for the Three.js CDN module.

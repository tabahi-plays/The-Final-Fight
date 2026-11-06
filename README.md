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

## Voice lines (add your own MP3 files)
Place these files in `assets/audio/`:
- `bauna-intro.mp3`
- `nimbu-intro.mp3`
- `bauna-win.mp3`
- `nimbu-win.mp3`

Match intro order: selected fighter voice -> CPU voice -> 3, 2, 1, FIGHT. The winner's individual voice plays after the final result. Missing MP3s are skipped with a short delay so the match still starts.


## Balance update
- Health is 200 per fighter.
- Punch damage: 6 HP. Kick damage: 10 HP.
- CPU attack cadence is slower with more blocking and retreat windows.
- Bauna Kid special: power-up, high kick, airborne knockdown, 60 HP damage.
- Nimbu Chatora special: slow rise, lemon splash, 4-second paneer transformation, 60 HP damage.
- Character selection portraits use a larger, uncropped contain frame.

Special audio files belong in `assets/audio/`:
`bauna-intro.mp3`, `nimbu-intro.mp3`, `bauna-win.mp3`, `nimbu-win.mp3`.

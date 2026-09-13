# ColorLab media release — 2026-09-13

## Compressed intro

Original Remotion exports are preserved outside this repository in `colorlab-intro-video/out/*-4k120-v4.mp4`. Website files are the separately encoded compressed copies, not the originals.

| Variant | Dimensions | FPS | Frames / duration | Original bytes | Published bytes | Full-frame SSIM |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop | 3840 × 2160 | 120 | 528 / 4.4 s | 4,436,949 | 2,976,723 | 0.997851 |
| Mobile | 2560 × 3840 | 120 | 528 / 4.4 s | 4,982,531 | 3,267,676 | 0.997925 |

H.264 MP4, yuv420p, CRF 18, veryslow, animation tuning, faststart; no resizing, frame removal, or audio. SSIM compares matching timestamps with normalized timebases. This is high-quality lossy compression, not bit-identical lossless output. Complete decoding passed. The source artwork limits fine detail; a 120 fps file does not guarantee 120 Hz playback on every phone.

Only the intro source, idle preload, service-worker optional asset list and release-verification asset list select the new files. Intro timing, skip/error fallback and reduced-motion behavior are unchanged.

## Other approved changes

- Waiting-page selected characters share a common height while preserving source aspect ratios.
- The draggable music handle stays anchored while its compact control opens toward the viewport interior.
- Hidden documents pause music; returning resumes only when music remains enabled. Manual mute is respected.
- Music uses the documented high-quality FLAC assets. Home derives from the author's WAV; About derives from the author's MP3 and does not recover lost detail. See `color-web/assets/music/NEW-MUSIC-LICENSE.md`.

## Verification and boundaries

- 132 automated tests pass, including position anchoring, visibility pause/resume, muted return, authentication and data-access checks.
- Static build passes; full video decode and frame-count validation pass.
- In-app browser video loading/playback checked. Physical-phone 4K120 smoothness and operating-system app switching still need user-device acceptance.
- Production verification: `node scripts/verify-media-release.cjs` compares deployed files and checks health/public/authenticated endpoints without sending messages or changing data.
- No Atlas roles, network rules, backups, paid plans or credentials are changed by this media release.

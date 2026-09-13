# Media continuity release

Scope: keep music alive across same-origin application/account navigation; draggable account-scoped control; equal-height mood-stage characters; pre-rendered About opening; existing CL PWA icons; handwriting readiness; first-display tour persistence.

## Design boundaries

- `app/site-shell.mjs` owns the persistent audio document and one same-origin content iframe. Existing application/account modules, native links, form/unload guards and data routes run inside it. External links leave normally. Reloading or leaving the website still replaces the audio document.
- The parent connection delegates to the content connection, preventing an invisible duplicate wake overlay when loading authenticated preferences.
- Music preferences use the existing verified member/admin guard, with owner identity derived on the server. Only normalized x/y coordinates are accepted. Local pending writes survive failure and upload in order; they do not alter record revision signals.
- The tour stores its existing version key as soon as displayed. Clearing site data or another browser can show it again; no account-wide historical visit inference is made.
- Handwriting uses the same full glyph set as a compressed WOFF2. Only affected headings wait, with a bounded fallback; forms/navigation remain available. Optional video/music warmup respects data saver.
- The approved 132-frame Remotion composition was re-rendered as muted H264, portrait and landscape. Original character aspect ratios and equal body height are retained. Source project remains at `../../colorlab-intro-video/src/Enhanced.tsx` relative to this repository.

## Verification

- Existing Node regression suite: 121 passed, zero failed. New client preference and lifecycle tests add three passing cases (ordered saves/offline retention, shared wake connection, first-display tour).
- Browser observations: homepage to installation guide to privacy, About route crossfade, and browser Back across full content documents preserve the live audio element and advancing playback time. Mute remains off after navigation.
- Actual browser viewport checks: 390px and 320px phone widths, 1024px tablet width. Four mood characters have identical computed heights; the stage no longer overflows and enters only once visible. Dragging moves the control without opening it; tap expands the compact toggle; position survives reload.
- Both new video outputs encode successfully; portrait still visually checked for equal character height. Native About video opens and finishes in browser. No physical iPhone frame-rate measurement or installed iOS icon-refresh confirmation is claimed.
- Automated preference API tests mock persistence, validate authentication and isolate user/admin ownership. No production member preference or email was written during testing.

Production verification must compare deployed assets to `static-dist` and check backend health plus unauthorized preference access before announcing deployment complete. Security review/dashboard and merging security checks into the existing weekly-digest automation are a subsequent user-requested task, not completed by this media release.

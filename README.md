# ⚡ Cuplet — Fast Browser Video Studio

A complete, practical video studio in a single package: **timeline editing + canvas preview + AI captions + one-click export**. No installs, no heavy dependencies — runs entirely in the browser.

© 2026 salim-slimani. Licensed under the MIT License (see `LICENSE`).

## Highlights

- 🚀 **Zero heavy deps** — single Vite + React package, instant dev startup
- 🎞 **Canvas2D compositor** with media caching and GPU-accelerated CSS-filter effects
- 🌍 **Universal export** via MediaRecorder (VP9 / VP8 / H264 auto-pick) — works in every modern browser, no multi-MB wasm download
- 🎬 **Timeline** — drag & drop across tracks, split ✂, extend, nudge, delete, 50-step undo/redo
- 💬 **Captions & AI** — auto-timing from plain text, SRT/VTT import/export, free live dictation (Web Speech), optional Whisper-compatible endpoint
- 🖥 Optional Node render server (`server/render-server.js`) with zero third-party dependencies

## Getting started

```bash
cd cuplet
npm install
npm run dev      # → http://localhost:5199
npm run build    # production build (dist/)
npm run server   # optional export server on :3099
```

## Features

- **Media panel** — upload video/image/audio, paste remote URLs, one-click samples, per-clip GPU effect picker
- **Live preview** — rAF playback loop with audio sync; double-click any text clip to edit it inline
- **Caption studio** — Classic / Karaoke / Minimal / Pop styles, auto-generate from narration, SRT round-trip
- **Export** — one click, progress readout, automatic `webm`/`mp4` extension; project save/open as JSON
- **Formats** — Vertical 9:16, Landscape 16:9, Square 1:1

## Use it as an SDK

```tsx
import { CupletStudio } from './src/components/Studio';

export default function App() {
  return <CupletStudio />;
}
```

See `examples/basic-usage.tsx` for a preloaded-project example.

## Project layout

```
src/core/      types, timeline ops (move/trim/split), store with undo/redo
src/captions/  caption engine (SRT/VTT, auto-timing, Whisper, live dictation)
src/render/    Canvas2D compositor + MediaRecorder exporter
src/effects/   GPU effect presets (CSS filter strings)
src/components/ Toolbar, Preview, Timeline, MediaPanel, CaptionPanel, Studio
server/        optional dependency-free Node render server
examples/      SDK usage examples
```

## Roadmap ideas

- Optional `mp4-muxer` dependency for offline MP4 muxing
- Public stock providers (Pexels / Unsplash) in the media panel
- Real ffmpeg wiring in `server/render-server.js` for server-side MP4

---
© 2026 salim-slimani — Cuplet. All rights reserved under the MIT License.

# Release Notes: Animafy v2.0.0

We are incredibly excited to release **Animafy v2.0.0**, a massive architectural overhaul that brings professional-grade graphics composition natively into your Discord bot workflows.

## The Visual Revolution
While v1 successfully solved the problem of scaling animated GIF exports without crashing Node.js event loops, v2 focuses entirely on **visual fidelity** and **composition speed**. 

### 1. Built-in Templates
You no longer have to manually calculate coordinate systems for standard Discord features.
Included right out of the box in `v2.0` are:
- `/rank` Cards
- `/welcome` Banners
- `/profile` Showcases
- `/leaderboard` Rankings
- `/levelup` Alerts

All templates are highly responsive, intelligently truncating oversized text, natively mapping Nitro animated avatars, and rendering in a striking neon UI aesthetic.

### 2. Timeline API
Ever wanted to build a GIF that changes scenes over time? The new `TimelineBuilder` allows you to snap multiple `CanvasBuilder` states together to form a seamless animation. Better yet, it includes built-in transition engines (like cross-`fade`), automatically computing frame interpolations between your static snapshots.

### 3. Visual Effects Sandbox
Under the hood, Animafy's `Operations` engine has been entirely rewritten to support native Canvas rendering effects. You can now declaratively build:
- **Drop Shadows**
- **Linear & Radial Gradients**
- **Blur Filters**
- **Rounded Rectangles & Progress Bars**
- **Alpha Opacity Blending**

All of this utilizes a smart `pushState()` / `popState()` tracking engine ensuring you never accidentally bleed a glow filter onto your primary text.

## Core Stability
- **Monorepo Migration**: Animafy is now distributed as a robust monorepo, cleanly isolating `animafy-core`, `animafy-assets`, `animafy-text`, `animafy-decoders`, and `animafy-templates`. This slims down compilation and bundles significantly.
- **Avatar Stability**: We've completely overhauled how developers should pass `displayAvatarURL`s. By avoiding manual forced extensions and relying on Discord's native `forceStatic: false`, bots are protected from HTTP 415 crashes.
- **Worker Optimizations**: The underlying `GifWorkerPool` has been tuned to handle the new Timeline payloads efficiently.

## Getting Started
Update your package versions today:
```bash
npm install animafy@latest
```
Check out the [Migration Guide](./MIGRATION.md) for a seamless upgrade.

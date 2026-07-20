# API Components

This document outlines the core public APIs of Animafy v2.0. Internal architecture (like the Worker Pool and Render Pipelines) is abstracted away for a clean developer experience.

## `createAnimafy(options?)`
The primary factory function to initialize the engine.

```typescript
import { createAnimafy } from 'animafy';

const client = createAnimafy({
    cache: { maxSize: 250, ttl: 300000 },
    workerPoolSize: 8 // Optional: Caps concurrent GIF encoders. Defaults to CPU cores.
});
```

## `AnimafyClient`
The manager instance returned by `createAnimafy()`. It safely holds your worker pool and asset cache.

### Core Methods
- **`client.canvas()`**: Returns a new `CanvasBuilder` instance bound to this client.
- **`client.timeline()`**: Returns a new `TimelineBuilder` instance for constructing complex multi-frame animated GIFs.
- **`client.cache`**: Access the internal `AssetManager`.

### Template Methods
These built-in template generators instantly create production-ready cards. They all accept an options object and return a `Promise<Buffer>` (PNG or GIF based on `animated` property).

- **`client.rankCard(options)`**: Renders a level/XP progression card.
- **`client.profileCard(options)`**: Renders a user profile showcase with badges and stats.
- **`client.welcomeCard(options)`**: Renders a server join banner with member counts.
- **`client.leaderboardCard(options)`**: Renders a multi-user leaderboard list.
- **`client.levelUpCard(options)`**: Renders a compact level advancement notification.

---

## `CanvasBuilder`
The core class used to declaratively build your image pipeline. All drawing methods return `this` for chaining.

### Setup Methods
- **`setSize(width: number, height: number)`**: Sets the pixel dimensions of the canvas.
- **`setBackground(color: string)`**: Fills the canvas with a solid hex/rgb color prior to any operations.

### Drawing Methods
- **`drawText(text, x, y, fontSize, fontFamily, color, maxWidth?)`**
  Renders text. Automatically segments Unicode emojis and fetches high-res Twemoji SVGs. Intelligently wraps text across multiple lines if `maxWidth` is provided.
- **`drawAvatar(url, x, y, size)`**
  Downloads the image from the URL, crops it into a circle, and draws it at `x, y` with a diameter of `size`. Supports both static images and animated GIFs.
- **`drawRect(x, y, w, h, color, radius?)`**: Draws a filled rectangle, optionally with rounded corners.
- **`drawCircle(x, y, radius, color)`**: Draws a filled circle.
- **`drawLine(x1, y1, x2, y2, color, thickness)`**: Draws a straight line.
- **`drawProgressBar(x, y, w, h, progress, options)`**: Draws a progress bar. `progress` is a float from `0.0` to `1.0`.
- **`drawGradient(type, x0, y0, x1, y1, colorStops, angle?)`**: Draws a linear or radial gradient fill based on the provided coordinates and color stops.

### Canvas State & Visual Effects
- **`pushState()`**: Saves the current canvas transformation and style state.
- **`popState()`**: Restores the previously saved canvas state.
- **`setFilter(filter: string)`**: Applies a CSS-style filter (e.g. `'blur(5px)'`).
- **`clearFilter()`**: Removes the active filter.
- **`setShadow(offsetX, offsetY, blur, color)`**: Applies a drop shadow to subsequent drawn shapes.
- **`clearShadow()`**: Removes the active shadow.
- **`setOpacity(opacity: number)`**: Sets the global alpha (opacity) for subsequent drawing (0.0 to 1.0).

### Export Methods
- **`exportPNG()`**: Generates a static PNG Buffer instantly.
- **`exportGIF(options?)`**: Evaluates all loaded assets, syncs their frame delays, renders the composition, and dispatches it to the `GifWorkerPool`. Options allow enabling `fastMode` or `onMetrics` callbacks.

---

## `TimelineBuilder`
Used to orchestrate frame-by-frame GIF compositions with transition effects.

### Methods
- **`setSize(width, height)`**: Sets the canvas output dimensions.
- **`setFPS(fps)`**: Sets the target framerate (e.g., `20`).
- **`addFrame(callback, durationMs)`**: Adds a specific frame to the timeline. The callback receives a `CanvasBuilder` to draw the state of that frame. `durationMs` dictates how long the frame holds.
- **`transition(type, durationMs)`**: Smoothly interpolates from the previous frame to the next frame. Supported type: `'fade'`.
- **`export()`**: Compiles the entire timeline sequence into a single animated GIF `Buffer`.

---

## Important Avatar Behavior
When passing an avatar URL to a template or `drawAvatar`, avoid forcing the `.gif` extension using conditional logic. Discord's CDN will reject `.gif` requests for static user avatars with a 415 Unsupported Media Type.

**Best Practice:**
```typescript
// ✅ CORRECT: Let Discord dynamically serve the correct format
const url = user.displayAvatarURL({ size: 256, forceStatic: false, extension: 'png' });

// ❌ INCORRECT: Forces GIF even if the user has a static avatar
const url = user.displayAvatarURL({ size: 256, extension: isAnimated ? 'gif' : 'png' });
```

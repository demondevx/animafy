# API Components

This document outlines the core public APIs of Animafy. Internal architecture (like the Worker Pool specifics) is abstracted away for a clean developer experience.

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

### Methods
- **`client.canvas()`**: Returns a new `CanvasBuilder` instance bound to this client.
- **`client.cache`**: Access the internal `AssetManager` to manually clear or inspect cached items.

---

## `CanvasBuilder`
The core class used to declaratively build your image pipeline. All drawing methods return `this` for chaining.

### Setup Methods
- **`setSize(width: number, height: number)`**: Sets the pixel dimensions of the canvas.
- **`setBackground(color: string)`**: Fills the canvas with a solid hex/rgb color.

### Drawing Methods
- **`drawText(text, x, y, fontSize, fontFamily, color, maxWidth?)`**
  Renders text. Automatically segments Unicode emojis and fetches high-res Twemoji SVGs. If `maxWidth` is provided, it intelligently wraps the text across multiple lines.
- **`drawAvatar(url, x, y, size)`**
  Downloads the image from the URL (utilizing the cache), crops it into a perfect circle, and draws it at `x, y` with a diameter of `size`. If the URL points to a GIF, it extracts all frames for animation.

### Export Methods

#### `.exportPNG()`
Generates a static PNG Buffer. It completely skips the worker pool and animation processing, making it practically instantaneous. Use this for static `/rank` cards.
```typescript
const buffer = await builder.exportPNG();
```

#### `.exportGIF(options?)`
Generates an animated GIF Buffer. This evaluates all loaded assets, syncs their frame delays, renders the composition, and dispatches it to the `GifWorkerPool` to prevent event-loop blocking.

**RenderOptions:**
- **`fastMode`** *(boolean)*: If true, drastically reduces encoding latency by dropping to 15 FPS and downscaling the final output by 50% *after* drawing it at native resolution. Highly recommended for busy bots.
- **`onMetrics`** *(callback)*: Receives detailed performance data `({ composeTime, encodeTime, totalFrames })` for debugging/telemetry.

```typescript
const buffer = await builder.exportGIF({
    fastMode: true,
    onMetrics: (m) => console.log(`Encoded in ${m.encodeTime}ms`)
});
```

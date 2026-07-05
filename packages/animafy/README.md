<div align="center">
  <h1>Animafy</h1>
  <p><strong>High-performance Canvas + GIF rendering engine for Discord bots.</strong></p>
  
  <p>
    <a href="https://www.npmjs.com/package/animafy"><img src="https://img.shields.io/npm/v/animafy?logo=npm" alt="npm" /></a>
    <a href="https://github.com/demondevx/animafy/actions"><img src="https://img.shields.io/github/actions/workflow/status/demondevx/animafy/build.yml?logo=github" alt="build" /></a>
  </p>
</div>

![demo](./assets/demo.gif)

Create fast, production-grade Discord canvas images & GIFs in seconds. Animafy offloads heavy GIF encoding to a multi-core Worker Pool and automatically caches resources, preventing your Node.js event loop from freezing during heavy server load.

```ts
import { createAnimafy } from 'animafy';

const animafy = createAnimafy();

const buffer = await animafy.canvas()
  .setSize(800, 300)
  .setBackground('#1E1F22')
  .drawAvatar(userAvatarUrl, 50, 75, 150)
  .drawText("Welcome to the server!", 230, 130, 42, 'sans-serif', '#FFFFFF')
  .exportGIF({ fastMode: true }); // Automatically scales processing!
```

## Features

- **Chainable Builder API**: Write declarative drawing pipelines that are easy to read and maintain.
- **GIF Encoding**: Native GIF encoding offloaded to a multi-core Worker Thread Pool.
- **Fast Mode**: Reduce encoding times by up to 90% via automated framerate halving and native downscaling.
- **Smart Caching**: Built-in `AssetManager` automatically deduplicates CDN fetches and buffers assets with LRU TTL limits.
- **Unicode Emoji Support**: Automatically resolves native OS emojis or Twemoji fallback.
- **Rich Text Engine**: Full multi-line text segmentation, font-families, and wrapping algorithms.
- **Shard-Safe Architecture**: Designed specifically for clustered Node.js environments and Discord.js sharding.

---

## Showcase

![rank-example](./assets/rank-example.png)
*Generate lightning-fast static `/rank` cards.*

![showcase](./assets/showcase.gif)
*Animate multiple avatars simultaneously.*

---

## Installation

```bash
npm install animafy
npm install @napi-rs/canvas # Peer dependency
```

See the [Installation Guide](./docs/installation.md) for detailed requirements.

## Documentation

- [**Installation**](./docs/installation.md) - Requirements and setup.
- [**Quickstart**](./docs/quickstart.md) - Your first 5 minutes with Animafy.
- [**Full Guide**](./docs/guide.md) - Comprehensive tutorial for beginners.
- [**Components API**](./docs/components.md) - Detailed reference of all core classes.
- [**Examples**](./docs/examples.md) - Real-world Discord.js commands (Rank cards, avatars, etc).
- [**Troubleshooting**](./docs/troubleshooting.md) - Solutions to common bottlenecks or errors.

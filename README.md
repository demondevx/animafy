<div align="center">
  <h1>Animafy v2.0</h1>
  <p><strong>High-performance Canvas + GIF rendering engine for Discord bots.</strong></p>
  
  <p>
    <a href="https://www.npmjs.com/package/animafy"><img src="https://img.shields.io/npm/v/animafy?logo=npm" alt="npm" /></a>
    <a href="https://github.com/demondevx/animafy/actions"><img src="https://img.shields.io/github/actions/workflow/status/demondevx/animafy/build.yml?logo=github" alt="build" /></a>
  </p>
</div>

Create fast, production-grade Discord canvas images & GIFs in seconds. Animafy v2.0 introduces the **Timeline API** for smooth frame transitions, built-in **Card Templates**, and native **Visual Effects** (shadows, gradients, and filters). All heavy GIF encoding is offloaded to a multi-core Worker Pool, preventing your Node.js event loop from freezing.

```ts
import { createAnimafy } from 'animafy';

const animafy = createAnimafy();

// 1. Easy Built-in Templates
const rankBuffer = await animafy.rankCard({
    username: user.username,
    avatarUrl: user.displayAvatarURL({ size: 256, forceStatic: false }), // Let Discord auto-choose GIF or PNG!
    level: 42,
    xp: 8750,
    maxXp: 10000,
    rank: 12,
    theme: 'neon',
    animated: true // Automatically encodes as GIF if the avatar is animated!
});

// 2. Custom Timeline GIFs
const gifBuffer = await animafy.timeline()
    .setSize(800, 400)
    .setFPS(20)
    .addFrame(canvas => canvas.setBackground('#0D0D12').drawText('Frame 1', 100, 200, 48, 'sans-serif', '#FF3366'), 1000)
    .transition('fade', 500)
    .addFrame(canvas => canvas.setBackground('#16161F').drawText('Frame 2', 500, 200, 48, 'sans-serif', '#7289DA'), 1000)
    .export();
```

## Features

- **Timeline API (NEW)**: Build multi-frame GIFs with built-in crossfade transitions.
- **Template Engine (NEW)**: Ship beautiful, production-ready rank cards, welcome banners, and leaderboards in 1 line of code.
- **Visual Effects (NEW)**: Native support for Drop Shadows, CSS-like Filters (Blur), Linear Gradients, Opacity, and Progress Bars.
- **Chainable Builder API**: Write declarative drawing pipelines that are easy to read and maintain.
- **GIF Encoding**: Native GIF encoding offloaded to a multi-core Worker Thread Pool.
- **Smart Caching**: Built-in `AssetManager` automatically deduplicates CDN fetches and buffers assets with LRU TTL limits.
- **Rich Text Engine**: Full multi-line text segmentation, Unicode emoji integration, and text-wrapping algorithms.

---

## Showcase

![profile-card](https://raw.githubusercontent.com/demondevx/animafy/main/assets/profile.gif)
*Animated profile cards with real-time Discord data.*

![rank-card](https://raw.githubusercontent.com/demondevx/animafy/main/assets/rank.gif)
*Generate stunning `/rank` cards with XP progress bars.*

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

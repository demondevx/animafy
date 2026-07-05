# Animafy

An advanced, extremely fast Canvas rendering engine built specifically for Discord bots. 
Powered by `@napi-rs/canvas` underneath, Animafy focuses entirely on solving the hardest parts of Discord image generation: **Animated GIFs, custom emojis, memory caching, and deep Unicode parsing.**

No more fighting with raw C++ bindings, broken text rendering, or frame synchronization. 

## Installation

```bash
npm install animafy
```

## Quick Start (The 10-line Example)

Animafy is built to be imported and used instantly.

```typescript
import { createAnimafy } from "animafy";
import fs from "node:fs/promises";

// 1. Initialize the client (auto-configures caching and AssetManager)
const animafy = createAnimafy();

// 2. Build your image
const buffer = await animafy.canvas()
  .setSize(800, 300)
  .setBackground('#2B2D31') // Discord dark theme
  .drawText("Hello 😂 <:blobdance:1045233630650953728>", 50, 150, 48, 'sans-serif', '#ffffff')
  .exportPNG();

await fs.writeFile('output.png', buffer);
```

## Discord.js Examples

The API is specifically modeled for Discord.js interaction flows.

### 1. Generating a Rank Card
```typescript
import { createAnimafy } from 'animafy';
import { AttachmentBuilder } from 'discord.js';

const animafy = createAnimafy();

export async function execute(interaction) {
    await interaction.deferReply();
    const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });

    const buffer = await animafy.canvas()
        .setSize(800, 250)
        .drawRect(0, 0, 800, 250, '#1E1F22', 20)
        .drawAvatar(avatarUrl, 125, 125, 65)
        .drawText(interaction.user.username, 250, 90, 42, 'sans-serif', '#ffffff')
        .drawText(`LEVEL 42`, 430, 90, 30, 'sans-serif', '#00A8FC')
        .exportPNG();

    const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
    await interaction.editReply({ files: [attachment] });
}
```

### 2. Animated GIF Synchronization
Animafy automatically synchronizes multiple GIFs on the same canvas, keeping their frame rates aligned.

```typescript
import { createAnimafy } from 'animafy';
import { AttachmentBuilder } from 'discord.js';

const animafy = createAnimafy();

export async function execute(interaction) {
    await interaction.deferReply();
    const bgGif = 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif'; 
    const spinnerGif = 'https://github.githubassets.com/images/spinners/octocat-spinner-128.gif';

    const buffer = await animafy.canvas()
        .setSize(800, 400)
        .drawImage(bgGif, 0, 0, 800, 400) // Animated background
        .drawAvatar(spinnerGif, 400, 200, 80) // Overlaid animated avatar
        .drawText('Perfect Frame Sync 🚀✨', 250, 350, 32, 'sans-serif', '#ffffff')
        .exportGIF();

    const attachment = new AttachmentBuilder(buffer, { name: 'animated.gif' });
    await interaction.editReply({ files: [attachment] });
}
```

## Advanced Usage

For heavily sharded bots or isolated testing, avoid the factory function and instantiate the client explicitly for full cache control:

```typescript
import { AnimafyClient } from "animafy";

const client = new AnimafyClient({
  cache: { 
    maxMemoryMB: 500,  // Hard cap memory usage
    ttlMs: 600000      // Evict unused assets after 10 minutes
  }
});

const buffer = await client.canvas()
    .setSize(500, 500)
    .exportPNG();
```

## Why Animafy?
- **Native Speed**: Core rendering powered by `skia` (via `@napi-rs/canvas`).
- **Zero-Config Caching**: Uses a hybrid LRU + TTL + Memory-Cap cache.
- **Emoji Chaos Handled**: Full ZWJ sequence support and native Discord custom emoji `<:name:id>` parsing.
- **Zero Global State**: Safe for massive multi-shard scaling.

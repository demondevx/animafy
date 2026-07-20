# Quickstart

Welcome to Animafy! This guide will take you from zero to a fully functioning Discord bot command that generates an animated Canvas image in less than 5 minutes.

## 1. Setup Your Project

First, ensure you have a standard `discord.js` bot project initialized. Then, install Animafy and its peer dependencies:

```bash
npm install animafy @napi-rs/canvas omggif
```

## 2. Initialize Animafy

In your main bot file (or a centralized service file), initialize the `AnimafyClient`. This client automatically sets up a worker pool for fast GIF encoding and an internal memory cache to prevent spamming network requests.

```javascript
// src/services/canvasService.js
import { createAnimafy } from 'animafy';

// Export this instance so all your commands can share the same worker pool & cache.
export const animafyClient = createAnimafy();
```

## 3. Create a Discord Command

Let's create a `/greeting` command that generates a beautiful personalized card with the user's avatar.

```javascript
// src/commands/greeting.js
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('greeting')
    .setDescription('Generate an animated greeting card!');

export async function execute(interaction) {
    // 1. Acknowledge the interaction immediately (rendering takes a few hundred ms!)
    await interaction.deferReply();

    const user = interaction.user;
    // Request a GIF avatar so we can render animations!
    const avatarUrl = user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 256 });

    // 2. Build the canvas
    const buffer = await animafyClient.canvas()
        .setSize(600, 250)
        .setBackground('#2B2D31')
        .drawAvatar(avatarUrl, 50, 50, 150) // X: 50, Y: 50, Size: 150
        .drawText(`Hello, ${user.username}! 👋`, 220, 100, 36, 'sans-serif', '#FFFFFF')
        .drawText('Welcome to our awesome Discord server.', 220, 160, 20, 'sans-serif', '#B5BAC1')
        // Automatically converts animations or static images efficiently
        .exportGIF({ fastMode: true }); 

    // 3. Send back to Discord
    const attachment = new AttachmentBuilder(buffer, { name: 'greeting.gif' });
    await interaction.editReply({ files: [attachment] });
}
```

## What Just Happened?

1. **`createAnimafy()`** set up everything under the hood (Worker Threads and Cache LRU).
2. **`animafyClient.canvas()`** initiated a fluent "Builder", allowing us to chain `.drawAvatar()` and `.drawText()`.
3. Animafy seamlessly recognized that the user might have an animated avatar, downloaded it, cached it, rendered it frame-by-frame, and exported it!
4. **`fastMode: true`** instructed the engine to drop the framerate to 15 FPS and scale down the resolution during encoding, allowing the GIF to export in milliseconds rather than seconds.

Next, read the [Full Guide](./guide.md) to understand how to fully leverage the rendering pipeline!

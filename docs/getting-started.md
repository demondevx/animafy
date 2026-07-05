# Getting Started with Animafy

Welcome to **Animafy**, a blazing fast canvas rendering engine built primarily for Discord bot development.

## Prerequisites
- Node.js 18.x or higher
- Discord.js v14 (if building a Discord bot)

## Installation
```bash
npm install animafy
```

## Basic Concepts

Animafy relies on a central `AssetManager` to safely cache and load image data across your application. To make this easy, we provide a dual-layer API:

### 1. Beginner API (Recommended)
This instantiates a safe, isolated client with built-in cache limits designed for Discord.

```typescript
import { createAnimafy } from 'animafy';
const animafy = createAnimafy();

const buffer = await animafy.canvas()
  .setSize(800, 300)
  .setBackground('#2B2D31')
  .drawText("Hello World", 50, 150)
  .exportPNG();
```

### 2. Advanced API (Full Control)
For heavily sharded or multi-bot environments where you need strict memory guarantees:

```typescript
import { AnimafyClient } from 'animafy';

const client = new AnimafyClient({
  cache: {
    maxMemoryMB: 500, // Maximum heap allocation for cache
    ttlMs: 10 * 60 * 1000 // 10 minutes
  }
});
```

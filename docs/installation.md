# Installation

Animafy is designed to be easily dropped into any modern Node.js project.

## Requirements

- **Node.js**: `v18.0.0` or higher (Requires Worker Threads and Fetch API).
- **TypeScript** (Optional): `v5.0.0` or higher recommended for full type safety.

## Installing Animafy

You can install Animafy and its core rendering peer dependency using npm, yarn, or pnpm.

```bash
npm install animafy
npm install @napi-rs/canvas
```

> **Why `@napi-rs/canvas`?**
> Animafy leverages `@napi-rs/canvas` as its low-level graphics engine. It is a Rust-based hardware-accelerated canvas implementation that drastically outperforms standard node-canvas implementations and comes pre-compiled for most operating systems.

## Optional Dependencies

### Omggif (For Animated Avatars)
If you intend to decode animated GIFs (such as Discord user avatars), you need a GIF decoder. Animafy ships with a built-in wrapper for `omggif`.

```bash
npm install omggif
```
*Note: Animafy will automatically use `omggif` if it is installed when using `createAnimafy()`.*

## Troubleshooting Installation Errors

If you encounter errors when installing `@napi-rs/canvas`:

1. **Pre-built Binary Missing:**
   Ensure you are on a supported operating system (Windows, macOS, Linux). If you are on an exotic architecture (e.g., Alpine Linux or specific ARM variants), you may need to install OS-level dependencies to compile the native bindings from source.
   
2. **"Worker Thread" Errors in PM2:**
   If using PM2 or other cluster managers, ensure you are running in `cluster` mode properly, and your Node version supports `worker_threads` natively.

3. **Memory Limits in Docker:**
   Canvas rendering is memory intensive. Ensure your Docker container is allocated at least `512MB` of RAM to prevent OOM (Out Of Memory) kills during high-traffic spikes.

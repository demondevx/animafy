# Performance & Metrics

Animafy was built from the ground up to prevent the common performance pitfalls found in canvas libraries.

## The Caching Engine
Animafy utilizes a **Hybrid LRU + TTL + Size Cap** cache.

- **LRU (Least Recently Used)**: Prevents cache thrashing.
- **TTL (Time to Live)**: Ensures updated user avatars aren't permanently stuck.
- **Size Cap**: Tracks the raw byte size of decoded `ImageData` frames to strictly prevent unbounded heap growth.

## Benchmarking & Telemetry
If you need to analyze your canvas generation times, Animafy provides a completely isolated telemetry callback that has **zero overhead** when omitted.

```typescript
let composeTime = 0;
let encodeTime = 0;

const buffer = await animafy.canvas()
  .setSize(800, 400)
  .drawAvatar(userAvatarUrl, 100, 100, 50)
  .exportGIF({
      onMetrics: (metrics) => {
          composeTime = metrics.composeTime;
          encodeTime = metrics.encodeTime;
      }
  });

console.log(`Composed in ${composeTime}ms, Encoded GIF in ${encodeTime}ms`);
```

## Production Tips
When profiling memory loops in Node.js, V8's Garbage Collector runs lazily. If you suspect memory leaks during development, run Node with `--expose-gc` and periodically call `global.gc()` to observe true baseline memory drift.

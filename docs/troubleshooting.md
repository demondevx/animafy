# Troubleshooting

While Animafy is built to handle edge cases gracefully, you may run into issues depending on your hardware, network, or Node.js environment. Here is how to fix common problems.

### My GIF exports are taking 2-3 seconds and feeling slow
GIF encoding is mathematically expensive. 
**Solution:** Pass `{ fastMode: true }` to `exportGIF()`. This will cut the frame rate in half and use native downsampling, usually dropping export times from ~2.5s to ~300ms.

### My bot gets "Interaction Failed" when generating GIFs
If you are generating complex GIFs without `fastMode` on slower hardware, it might take more than 3 seconds. Discord enforces a strict 3-second limit to respond to interactions.
**Solution:** Always call `await interaction.deferReply()` as the very first line in your execute function. This gives you 15 minutes to process and upload the final image.

### I'm getting `Error: Server busy`
Animafy protects your server from memory crashes by capping the internal Worker Queue to 100 concurrent jobs. If you exceed this, it rejects new requests to save the bot from crashing.
**Solution:** This usually means your bot is being spammed. Ensure you have Discord rate-limiting or cooldowns on your canvas commands. Alternatively, use `fastMode` to clear the queue faster.

### The text is rendering as blocks or random characters
This means `@napi-rs/canvas` cannot find the font family you specified on the host OS.
**Solution:** Ensure you pass a generic fallback like `'sans-serif'` in your `drawText` calls, or explicitly load and register a `.ttf` font file using `@napi-rs/canvas` GlobalFonts API during your bot's startup phase.

### Emojis aren't rendering / showing up as squares
Animafy automatically detects Unicode emojis and fetches SVG representations, but if you are attempting to use Discord Custom Emojis (e.g. `<:pepe:12345678>`), those are not raw unicode!
**Solution:** Animafy's `drawText` currently only parses raw unicode (like 🔥 or 🌍). Custom Discord emojis are actually images and must be parsed and downloaded separately, then drawn via a future image overlay API.

### Process is hanging / won't gracefully exit
Animafy Worker Threads are detached properly (`unref`), but if you are running tests or scripts that exit immediately after generating a canvas, ensure the promises have fully resolved.
**Solution:** Always `await` your `exportGIF()` calls before calling `process.exit()`. 

### RAM usage feels high
Rendering graphic sequences requires holding pixel buffers in memory.
**Solution:** Animafy actively purges memory, but V8 Garbage Collection happens on its own schedule. If you are doing manual load testing in a tight loop, you will see memory rise before it plummets. This is normal. If you need stricter limits, reduce the cache size: `createAnimafy({ cache: { maxSize: 50 } })`.

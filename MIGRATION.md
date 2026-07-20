# Migration Guide (v1 to v2)

Animafy v2.0 introduces powerful new composition capabilities and built-in templates while maintaining core backwards compatibility. However, there are a few structural changes you should be aware of when migrating.

## 1. Avatar URL Fetching (Important)

In v1, you might have written logic to manually force `extension: 'gif'` when fetching user avatars from Discord:

```javascript
// ❌ V1 Code (Deprecated & Causes 415 HTTP Errors)
const url = interaction.user.displayAvatarURL({ 
    extension: isAnimated ? 'gif' : 'png', 
    size: 256 
});
```

In v2, Animafy is highly strict about media types. If a user does not have an animated Nitro avatar, forcing `.gif` causes Discord to return a static image disguised as a GIF, breaking the native engine decoding process.

**The Fix:**
Always use `forceStatic: false` and request `extension: 'png'`. Discord will correctly intercept the request and return `.gif` if the user is animated, and `.png` if they are static.

```javascript
// ✅ V2 Code (Safe)
const url = interaction.user.displayAvatarURL({ 
    extension: 'png', 
    forceStatic: false, 
    size: 256 
});
```

## 2. Using Built-in Templates

If you previously built manual `/rank` or `/welcome` cards by manually aligning `drawText()` and `drawAvatar()` on `CanvasBuilder`, you can now delete all that boilerplate!

```javascript
// V2 Built-in Template Example
const buffer = await animafyClient.rankCard({
    username: 'DiscordUser',
    avatarUrl: url,
    level: 10,
    xp: 500,
    maxXp: 1000,
    rank: 1
});
```
This single call replaces 15+ lines of layout math.

## 3. Background Color Execution

In v1, `setBackground()` was just an operation placed in the operations array. 
In v2, `setBackground()` modifies internal rendering state *prior* to processing standard operations to ensure transparencies and timeline transitions don't bleed into previous frames.
It is highly recommended to call `.setBackground()` immediately after `.setSize()` on your `CanvasBuilder`.

## 4. Visual Effects State

If you use `setShadow()` or `setFilter()`, these apply to the global canvas context. You MUST encapsulate them using `pushState()` and `popState()` to prevent shadows from bleeding onto unintended text.

```javascript
builder
    .pushState() // Save context
    .setShadow(5, 5, 10, 'rgba(0,0,0,0.5)')
    .drawText('Glowing Title', 100, 100, 40, 'Arial', '#fff')
    .popState() // Restore context, shadow removed!
    .drawText('Normal Subtitle', 100, 150, 20, 'Arial', '#fff');
```

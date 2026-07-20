# The Full Beginner's Guide to Animafy

If you've never used an HTML5 Canvas or manipulated graphics in Node.js before, you are in the right place! Animafy was built to hide the complex math, buffering, and event-loop blocking logic required to draw graphics, letting you focus entirely on your bot's design.

## Core Concepts

There are two main pieces of Animafy you need to understand:

1. **`AnimafyClient`**: The "Manager". It holds the network cache (so you don't download the same image twice) and the Worker Pool (a team of invisible CPU threads that do the heavy lifting of encoding GIFs so your bot doesn't freeze). You only ever need **one** of these per application.
2. **`CanvasBuilder`**: The "Painter". Every time a user runs a command, you ask the Manager for a new Painter (`animafyClient.canvas()`). You tell the painter what to draw, step by step, and finally ask it for the finished `Buffer` (the raw image data Discord expects).

---

## The Rendering Pipeline

Animafy uses a **declarative, chainable pipeline**. When you call `.drawText()` or `.drawAvatar()`, Animafy doesn't draw it instantly. It builds a "To-Do List".

When you finally call `.exportGIF()` or `.exportPNG()`, Animafy:
1. Downloads all the images/avatars you requested in parallel.
2. Evaluates the longest animation (if any).
3. Paints every frame of the animation onto the canvas.
4. Ships those frames to a Worker Thread to compress into a GIF.

---

## 1. Drawing Basic Shapes and Backgrounds

Start your canvas by defining a size and a background color.

```javascript
const buffer = await animafyClient.canvas()
    .setSize(800, 400) // Width 800px, Height 400px
    .setBackground('#1E1F22') // Standard Discord Dark Theme
    .exportPNG();
```

## 2. Drawing Text (with Emojis!)

One of the hardest parts of native Canvas is dealing with text wrapping and emojis. Animafy handles both automatically.

```javascript
const buffer = await animafyClient.canvas()
    .setSize(800, 400)
    .setBackground('#1E1F22')
    // Text, X, Y, FontSize, FontFamily, Color, MaxWidth (optional for wrapping)
    .drawText('Hello World! 🌍🔥', 50, 100, 48, 'sans-serif', '#ffffff', 700)
    .exportPNG();
```
*Note: Animafy will automatically parse the `🌍` and `🔥` emojis, fetch their high-resolution SVGs from Twemoji, and render them inline with your text!*

## 3. Drawing Avatars

Drawing a user's avatar as a perfect circle usually requires complex clipping paths. `drawAvatar` does it for you.

```javascript
const buffer = await animafyClient.canvas()
    .setSize(800, 400)
    .setBackground('#1E1F22')
    // AvatarURL, X, Y, Size (Diameter)
    .drawAvatar('https://cdn.discordapp.com/avatars/...', 100, 100, 150)
    .exportGIF(); // Use exportGIF if the avatar might be animated!
```

## 4. Advanced: Fast Mode (GIF Optimization)

GIFs are notoriously slow to compress. If your bot is popular, generating full-quality 30 FPS GIFs can overwhelm the CPU.

Animafy introduced **Fast Mode** to solve this.

```javascript
.exportGIF({ fastMode: true })
```

**What it does:**
- Drops the framerate from 30 FPS to 15 FPS.
- Renders your layout perfectly at 100% scale (keeping fonts crisp), but downsamples the final image to 50% resolution right before converting it to a GIF.
- **Result**: Exports are up to 90% faster with minimal visual loss on a mobile or desktop Discord client.

## 5. How Caching Works (The Simple Analogy)

Imagine going to the store to buy milk for a recipe. If you need milk again 5 minutes later, you wouldn't drive back to the store; you'd just open the fridge.

The `AnimafyClient` contains a "fridge" (`AssetManager`). When you call `drawAvatar(URL)`, it checks the fridge. 
- If it's not there, it downloads it and puts it in the fridge. 
- If 10 users run the `/rank` command in the next 5 minutes for the same user, it grabs it from the fridge instantly. 
- If the fridge gets too full (over 250 items), it throws away the oldest items.

This makes Animafy blisteringly fast under heavy server load!

---

## 6. Using Built-in Templates (The Magic Cards)

If you are just starting out with programming, drawing text and shapes manually might feel like too much math. That's why we added **Templates**!

Templates are like pre-made coloring books. The lines are already drawn; you just hand Animafy the crayons (your data), and it paints a beautiful card for you.

```javascript
// This is all you need to make an awesome Rank Card!
const buffer = await animafyClient.rankCard({
    username: 'DiscordFan99',
    avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false }),
    level: 10,
    xp: 500,
    maxXp: 1000,
    rank: 1
});
```

*Note on Avatars: Always use `extension: 'png', forceStatic: false` when getting avatars from Discord! Discord will smartly decide whether to give you a static picture or an animated GIF.*

## 7. Adding Visual Effects (Shadows and Filters)

Want to make your canvas look like it was designed in Photoshop? You can add effects like Shadows (to make things pop out) or Blurs.

Think of effects like a magic spotlight. When you turn the spotlight on, everything you draw next gets the effect. But you don't want the spotlight to ruin the rest of your painting! 

To fix this, we use `pushState()` (save my canvas) and `popState()` (go back to how it was).

```javascript
builder
    .pushState() // 📸 Save the canvas normally
    
    .setShadow(5, 5, 10, 'black') // 💡 Turn on the Shadow Spotlight!
    .drawText('This text has a shadow!', 50, 50, 30, 'Arial', 'white')
    
    .popState() // ⏪ Turn off the spotlight (go back to the saved state)
    
    .drawText('This text is normal again.', 50, 100, 30, 'Arial', 'white');
```

## 8. Making Your Own Animations (Timeline)

The Timeline is like a movie director. Instead of a single picture, you are directing a movie frame by frame.

```javascript
const gifBuffer = await animafyClient.timeline()
    .setSize(800, 400)
    .setFPS(20) // The movie runs at 20 frames per second
    
    // Scene 1: The title shows up for 1 second (1000 milliseconds)
    .addFrame((canvas) => {
        canvas.setBackground('black').drawText('Scene 1', 100, 100, 50, 'Arial', 'red');
    }, 1000)
    
    // The director yells "FADE!" - It smoothly transitions the scenes over half a second
    .transition('fade', 500)
    
    // Scene 2: The next text shows up for 1 second
    .addFrame((canvas) => {
        canvas.setBackground('white').drawText('Scene 2', 100, 100, 50, 'Arial', 'blue');
    }, 1000)
    
    .export(); // Print the movie!
```

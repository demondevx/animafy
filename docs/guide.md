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

## 6. Built-in Templates (New in v2.0)

If you don't want to spend hours doing the math to position text, avatars, and progress bars yourself, Animafy v2.0 gives you **Built-in Templates**. Think of these like pre-made Lego sets. You just hand the Manager your user's data, and it builds the entire image for you instantly!

Available Templates:
- `rankCard`
- `welcomeCard`
- `profileCard`
- `leaderboardCard`
- `levelUpCard`

### How to use a Template
Instead of creating a `canvas()` and drawing manually, you just call the template directly on the `animafyClient`:

```javascript
// Step 1: Safely get the user's avatar from Discord.
// (forceStatic: false tells Discord to send a GIF if they have Nitro, or a PNG if they don't. It never crashes!)
const avatarUrl = interaction.user.displayAvatarURL({ size: 256, forceStatic: false, extension: 'png' });

// Step 2: Fill out the pre-made form (the options object)
const buffer = await animafyClient.rankCard({
    username: interaction.user.username,
    avatarUrl: avatarUrl,
    level: 5,
    xp: 250,
    maxXp: 1000,
    rank: 3,
    theme: 'neon', // A beautiful built-in dark mode style
    animated: true // Set to true to automatically process GIF avatars
});

// Step 3: Send it to Discord!
```
It really is that simple. You get a professionally designed graphic with zero layout math required.

---

## 7. Visual Effects: Shadows, Filters, and Gradients (New in v2.0)

If you *do* want to build your own custom layouts, Animafy v2.0 gives you powerful new tools that work just like Photoshop effects.

### Gradients (Color Fades)
Instead of a solid color background, you can draw a gradient that smoothly transitions from one color to another.

```javascript
.drawGradient('linear', 0, 0, 800, 400, [
    { offset: 0, color: '#FF0000' }, // Start with Red
    { offset: 1, color: '#0000FF' }  // End with Blue
])
.drawRect(0, 0, 800, 400, 'transparent') // Fill the whole canvas with the gradient!
```

### Drop Shadows
Want your text or shapes to pop off the screen with a glowing shadow?

```javascript
.setShadow(5, 5, 15, 'rgba(0, 0, 0, 0.8)') // offsetX, offsetY, blur, color
.drawText('Glowing Text!', 100, 100, 40, 'sans-serif', '#ffffff')
```

### ⚠️ The Golden Rule of Effects: "Push and Pop"
When you turn on a shadow or a filter, it applies to **everything** you draw after it. If you add a shadow to your text, your progress bar and avatar will also get that shadow! 

To prevent this, use `pushState()` and `popState()`. 
- `pushState()` means "Save my current clean paintbrush."
- `popState()` means "Throw away the messy paintbrush I was just using and give me back my clean one."

```javascript
.pushState() // SAVE the clean state
.setShadow(0, 0, 20, '#FF3366') // Turn on a pink glow
.drawText('Level 99', 50, 50, 30, 'sans-serif', '#ffffff') // This text glows!
.popState() // RESTORE the clean state (turns the glow OFF)

.drawText('No glow here.', 50, 100, 20, 'sans-serif', '#ffffff') // This text is normal!
```

---

## 8. The Timeline Builder (New in v2.0)

Sometimes you want an animation that isn't just a spinning avatar. You might want to show one screen, fade to black, and show a second screen. Animafy v2.0 introduces the **TimelineBuilder** for exactly this!

A Timeline works like a movie editor. You add "frames" (snapshots of your canvas) and tell Animafy how to connect them.

```javascript
const gifBuffer = await animafyClient.timeline()
    .setSize(800, 400)
    .setFPS(20) // We want the movie to run at 20 Frames Per Second
    
    // SCENE 1: The First Frame (Show for 1000 milliseconds)
    .addFrame(canvas => {
        canvas.setBackground('#000000').drawText('Hello...', 100, 200, 50, 'sans-serif', '#ffffff');
    }, 1000)
    
    // SCENE 2: The Transition (Fade between the scenes for 500 milliseconds)
    .transition('fade', 500)
    
    // SCENE 3: The Second Frame (Show for 1000 milliseconds)
    .addFrame(canvas => {
        canvas.setBackground('#FFFFFF').drawText('...World!', 100, 200, 50, 'sans-serif', '#000000');
    }, 1000)
    
    // Render the final movie!
    .export();
```
The Timeline engine automatically does all the math to generate the smooth fading animation between the two completely different canvases. You just give it the key scenes, and it does the rest!

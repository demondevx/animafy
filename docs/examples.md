# Examples

Here are some real-world Discord.js Slash Commands you can copy and adapt for your own bot. Animafy v2.0 makes building complex graphics easier than ever.

## 1. The Built-in Neon Rank Card

When generating rank cards, you can rely on Animafy's highly optimized built-in templates. This requires just 1 line of code!

```javascript
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your current rank');

export async function execute(interaction) {
    await interaction.deferReply();

    // Use forceStatic: false to dynamically get a GIF or PNG from Discord!
    const avatarUrl = interaction.user.displayAvatarURL({ size: 256, forceStatic: false, extension: 'png' });

    const buffer = await animafyClient.rankCard({
        username: interaction.user.username,
        avatarUrl: avatarUrl,
        level: 42,
        xp: 8750,
        maxXp: 10000,
        rank: 12,
        theme: 'neon',
        animated: true // Automatically evaluates to GIF if the user has a Nitro avatar!
    });

    const isGif = avatarUrl.includes('.gif');
    const attachment = new AttachmentBuilder(buffer, { name: `rank.${isGif ? 'gif' : 'png'}` });
    await interaction.editReply({ files: [attachment] });
}
```

## 2. Animated Welcome Card (Template)

```javascript
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Preview the welcome card for a user');

export async function execute(interaction) {
    await interaction.deferReply();

    const avatarUrl = interaction.user.displayAvatarURL({ size: 256, forceStatic: false, extension: 'png' });

    const buffer = await animafyClient.welcomeCard({
        username: interaction.user.username,
        avatarUrl: avatarUrl,
        serverName: interaction.guild?.name ?? 'My Server',
        memberCount: interaction.guild?.memberCount ?? 1337,
        theme: 'neon',
        animated: true
    }); 

    const isGif = avatarUrl.includes('.gif');
    const attachment = new AttachmentBuilder(buffer, { name: `welcome.${isGif ? 'gif' : 'png'}` });
    await interaction.editReply({ files: [attachment] });
}
```

## 3. Timeline Fade Transition GIF

Animafy v2.0 introduces the `TimelineBuilder` for orchestrating complex frame-by-frame animations with transitions.

```javascript
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('transition')
    .setDescription('Generate a multi-frame timeline GIF!');

export async function execute(interaction) {
    await interaction.deferReply();

    const gifBuffer = await animafyClient.timeline()
        .setSize(800, 400)
        .setFPS(20)
        // Add the first frame (held for 1000ms)
        .addFrame(canvas => {
            canvas.setBackground('#0D0D12')
                  .drawText('Phase 1', 100, 200, 48, 'sans-serif', '#FF3366');
        }, 1000)
        // Automatically crossfade between the frames over 500ms
        .transition('fade', 500)
        // Add the second frame (held for 1000ms)
        .addFrame(canvas => {
            canvas.setBackground('#16161F')
                  .drawText('Phase 2', 500, 200, 48, 'sans-serif', '#7289DA');
        }, 1000)
        .export();

    const attachment = new AttachmentBuilder(gifBuffer, { name: 'timeline.gif' });
    await interaction.editReply({ files: [attachment] });
}
```

## 4. Custom Visual Effects (Filters & Shadows)

Want to build your own graphics using the raw `CanvasBuilder`? You can use the new Visual Effects API!

```javascript
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('effects')
    .setDescription('Generate a graphic with gradients and shadows');

export async function execute(interaction) {
    await interaction.deferReply();

    const buffer = await animafyClient.canvas()
        .setSize(800, 400)
        .setBackground('#1a1a2e')
        
        // Linear Gradient Background Shape
        .drawGradient('linear', 100, 100, 700, 300, [
            { offset: 0, color: '#FF3366' },
            { offset: 1, color: '#7289DA' }
        ])
        .drawRect(0, 0, 800, 400, 'transparent') // Fill canvas with gradient
        
        // Text with a Drop Shadow
        .pushState()
        .setShadow(5, 5, 15, 'rgba(0, 0, 0, 0.8)')
        .drawText('Stunning Visuals!', 200, 200, 48, 'sans-serif', '#FFFFFF')
        .popState() // Remove shadow so it doesn't bleed to the progress bar!
        
        // Progress Bar
        .drawProgressBar(100, 300, 600, 40, 0.85, {
            barColor: '#FFFFFF',
            bgColor: 'rgba(0, 0, 0, 0.5)',
            radius: 20
        })
        .exportPNG(); 

    const attachment = new AttachmentBuilder(buffer, { name: 'effects.png' });
    await interaction.editReply({ files: [attachment] });
}
```

# Examples

Here are some real-world Discord.js Slash Commands you can copy and adapt for your own bot.

## 1. The Animated `/welcome` Card

This example generates a beautiful dark-mode welcome card, complete with the user's animated avatar.

```javascript
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Preview the welcome card for a user');

export async function execute(interaction) {
    await interaction.deferReply();

    const avatarUrl = interaction.user.displayAvatarURL({ extension: 'gif', size: 256 });
    const username = interaction.user.displayName;

    const buffer = await animafyClient.canvas()
        .setSize(800, 300)
        .setBackground('#1E1F22') // Discord dark background
        .drawAvatar(avatarUrl, 50, 75, 150)
        .drawText('WELCOME TO THE SERVER!', 230, 130, 42, 'sans-serif', '#FFFFFF')
        .drawText(`We're glad you're here, ${username} 🎉`, 230, 180, 24, 'sans-serif', '#B5BAC1')
        .exportGIF({ fastMode: true }); 

    const attachment = new AttachmentBuilder(buffer, { name: 'welcome.gif' });
    await interaction.editReply({ files: [attachment] });
}
```

## 2. The Static `/rank` Card

When generating hundreds of rank cards, you usually want to keep them static to save CPU overhead. Using `.exportPNG()` makes this lightning fast.

```javascript
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your current rank');

export async function execute(interaction) {
    await interaction.deferReply();

    // Force 'png' so we don't accidentally load 80 frames of a GIF avatar
    const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });

    const buffer = await animafyClient.canvas()
        .setSize(900, 250)
        .setBackground('#2B2D31')
        .drawAvatar(avatarUrl, 40, 50, 150)
        .drawText(interaction.user.username, 220, 100, 48, 'sans-serif', '#FFFFFF')
        .drawText('Rank: #12', 220, 150, 32, 'sans-serif', '#F1C40F')
        .drawText('Level: 42', 220, 200, 32, 'sans-serif', '#3498DB')
        .exportPNG(); // Extremely fast static export!

    const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
    await interaction.editReply({ files: [attachment] });
}
```

## 3. The Multi-Avatar `/showcase`

Animafy intelligently caches and syncs animations. If you draw two different animated avatars, Animafy ensures they play alongside each other correctly!

```javascript
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('Showcase your avatar next to the bot!');

export async function execute(interaction) {
    await interaction.deferReply();

    const userUrl = interaction.user.displayAvatarURL({ extension: 'gif', size: 256 });
    const botUrl = interaction.client.user.displayAvatarURL({ extension: 'gif', size: 256 });

    const buffer = await animafyClient.canvas()
        .setSize(600, 400)
        .setBackground('#111111')
        .drawText('Epic Team-Up! ⚔️', 150, 80, 40, 'sans-serif', '#FFFFFF')
        .drawAvatar(userUrl, 100, 150, 180)
        .drawAvatar(botUrl, 320, 150, 180)
        .exportGIF({ fastMode: true }); 

    const attachment = new AttachmentBuilder(buffer, { name: 'showcase.gif' });
    await interaction.editReply({ files: [attachment] });
}
```

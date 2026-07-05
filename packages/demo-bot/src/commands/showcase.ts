import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('Full feature showcase of Animafy.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    // Features to showcase:
    // 1. Background Image
    // 2. Rounded rectangles (containers)
    // 3. Circular avatars (GIFs)
    // 4. Text fonts & colors
    // 5. Discord Emoji & Twemoji integration

    const builder = canvasService.createBuilder()
        .setSize(1000, 500)
        // Background image
        .drawImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', 0, 0, 1000, 500)
        // Overlay rect to darken background
        .drawRect(0, 0, 1000, 500, 'rgba(0,0,0,0.6)')
        // Content container
        .drawRect(50, 50, 900, 400, 'rgba(30, 31, 34, 0.8)', 20)
        
        // Header Text
        .drawText('Animafy Engine Showcase ✨', 80, 120, 56, 'sans-serif', '#ffffff')
        
        // Avatar tests (1 GIF, 1 PNG)
        .drawAvatar('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', 100, 200, 100)
        .drawAvatar('https://raw.githubusercontent.com/twbs/icons/main/icons/person-circle.svg', 250, 200, 100) // SVG rendering test
        
        // Emoji mixing
        .drawText('Unicode Emojis: 🔥🚀😂👨‍👩‍👧‍👦', 400, 230, 32, 'sans-serif', '#DBDEE1')
        // Custom Font Test
        .drawText('Dynamic layouts built for Discord Bots.', 80, 360, 36, 'serif', '#F2F3F5')
        .drawText('Powered by @napi-rs/canvas 🦀', 80, 420, 24, 'sans-serif', '#B5BAC1');

    const buffer = await builder.exportGIF();
    const attachment = new AttachmentBuilder(buffer, { name: 'showcase.gif' });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered in ${duration}ms`, files: [attachment] });
}

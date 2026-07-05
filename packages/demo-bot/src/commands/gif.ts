import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('gif')
    .setDescription('Full animation pipeline test with multiple simultaneous GIFs.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    // Valid external GIFs
    const bgGif = 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif'; // Stars/space background
    const spinnerGif = 'https://github.githubassets.com/images/spinners/octocat-spinner-128.gif';

    const builder = canvasService.createBuilder()
        .setSize(800, 400)
        .drawImage(bgGif, 0, 0, 800, 400) // Animated background
        .drawRect(0, 0, 800, 400, 'rgba(0,0,0,0.5)') // Overlay
        .drawText('Animation Pipeline Sync Test', 100, 80, 40, 'sans-serif', '#ffffff')
        
        // Multiple animated avatars to test sync
        .drawAvatar(spinnerGif, 200, 200, 80)
        .drawAvatar(spinnerGif, 400, 200, 80)
        .drawAvatar(spinnerGif, 600, 200, 80)
        
        // Standard text
        .drawText('Sync emojis: 🚀✨🚀✨', 250, 350, 32, 'sans-serif', '#ffffff');

    const buffer = await builder.exportGIF();
    const attachment = new AttachmentBuilder(buffer, { name: 'pipeline-test.gif' });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered multiple GIFs simultaneously in ${duration}ms`, files: [attachment] });
}

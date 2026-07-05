import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a list of available Animafy demo commands.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const builder = canvasService.createBuilder()
        .setSize(800, 500)
        .setBackground('#1E1F22') // Discord dark theme background
        .drawText('📚 Animafy Demo Bot', 50, 80, 48, 'sans-serif', '#ffffff')
        .drawText('An advanced canvas rendering engine for Discord.', 50, 130, 24, 'sans-serif', '#B5BAC1')
        .drawText('Available Commands:', 50, 200, 32, 'sans-serif', '#ffffff')
        .drawText('✨ /showcase  - Full feature demo', 70, 250, 24, 'sans-serif', '#DBDEE1')
        .drawText('🖼️ /avatar    - GIF vs PNG comparison', 70, 290, 24, 'sans-serif', '#DBDEE1')
        .drawText('😂 /emoji     - Unicode & custom emoji stress test', 70, 330, 24, 'sans-serif', '#DBDEE1')
        .drawText('⚡ /benchmark - Performance & cache metrics', 70, 370, 24, 'sans-serif', '#DBDEE1')
        .drawText('🔥 /stress-test - System stability under load', 70, 410, 24, 'sans-serif', '#DBDEE1');

    const buffer = await builder.exportPNG();
    const attachment = new AttachmentBuilder(buffer, { name: 'help.png' });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered in ${duration}ms`, files: [attachment] });
}

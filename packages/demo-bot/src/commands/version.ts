import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('version')
    .setDescription('Showcases the Animafy version capabilities.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const builder = canvasService.createBuilder()
        .setSize(800, 400)
        .setBackground('#2B2D31')
        .drawText('Animafy version', 400, 50, 48, 'sans-serif', '#ffffff');

    const isAnimated = ['gif'].includes('version');
    const buffer = await (isAnimated ? builder.exportGIF() : builder.exportPNG());
    const ext = isAnimated ? 'gif' : 'png';
    
    const attachment = new AttachmentBuilder(buffer, { name: `animafy-version.${ext}` });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered in ${duration}ms`, files: [attachment] });
}

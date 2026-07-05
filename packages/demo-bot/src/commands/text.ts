import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('text')
    .setDescription('Showcases the Animafy text capabilities.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const builder = canvasService.createBuilder()
        .setSize(800, 400)
        .setBackground('#2B2D31')
        .drawText('Animafy text engine', 400, 50, 48, 'sans-serif', '#ffffff')
        .drawText('This is a multiline text rendering test.\nIt correctly supports the \\n character\nand continues drawing without overflowing horizontally.', 50, 150, 24, 'sans-serif', '#DBDEE1')
        .drawText('Emojis work seamlessly with text: 🚀🔥💯', 50, 280, 24, 'sans-serif', '#B5BAC1')
        .drawText('You can even use custom discord emojis: <:broken_emoji:>', 50, 330, 24, 'sans-serif', '#B5BAC1');

    const isAnimated = ['gif'].includes('text');
    const buffer = await (isAnimated ? builder.exportGIF() : builder.exportPNG());
    const ext = isAnimated ? 'gif' : 'png';
    
    const attachment = new AttachmentBuilder(buffer, { name: `animafy-text.${ext}` });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered in ${duration}ms`, files: [attachment] });
}

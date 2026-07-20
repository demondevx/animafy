import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-progress')
    .setDescription('Test the new visual effects: progress bars');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const canvas = animafyClient.canvas();
    canvas.setSize(800, 400)
        .setBackground('#1a1a2e')
        .drawProgressBar(100, 180, 600, 40, 0.75, {
            barColor: '#FF3366',
            bgColor: '#16161F',
            radius: 20
        })
        .drawText('75%', 400, 240, 24, 'sans-serif', '#ffffff');

    const buffer = await canvas.exportPNG();
    await interaction.editReply({ files: [{ attachment: buffer, name: 'progress.png' }] });
}

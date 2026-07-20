import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-gradient')
    .setDescription('Test the new visual effects: gradients');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const canvas = animafyClient.canvas();
    canvas.setSize(800, 400)
        .setBackground('#1a1a2e')
        .drawGradient('linear', 100, 100, 600, 200, [
            { offset: 0, color: '#FF3366' },
            { offset: 1, color: '#7289DA' }
        ], 45)
        .drawText('Linear Gradient', 400, 200, 48, 'sans-serif', '#ffffff');

    const buffer = await canvas.exportPNG();
    await interaction.editReply({ files: [{ attachment: buffer, name: 'gradient.png' }] });
}

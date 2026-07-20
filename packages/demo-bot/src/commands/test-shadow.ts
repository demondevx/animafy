import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-shadow')
    .setDescription('Test the new visual effects: shadows');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const canvas = animafyClient.canvas();
    canvas.setSize(800, 400)
        .setBackground('#1a1a2e')
        .pushState()
        .setShadow(10, 10, 20, 'rgba(0, 0, 0, 0.8)')
        .drawRect(200, 100, 400, 200, '#FF3366', 20)
        .popState()
        .drawText('No Shadow Here', 300, 200, 32, 'sans-serif', '#ffffff');

    const buffer = await canvas.exportPNG();
    await interaction.editReply({ files: [{ attachment: buffer, name: 'shadow.png' }] });
}

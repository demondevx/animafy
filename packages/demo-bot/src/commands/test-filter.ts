import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-filter')
    .setDescription('Test the new visual effects: filters');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const canvas = animafyClient.canvas();
    canvas.setSize(800, 400)
        .setBackground('#1a1a2e')
        .pushState()
        .setFilter('blur(5px)')
        .drawText('Blurred Text', 100, 100, 48, 'sans-serif', '#ffffff')
        .popState()
        .drawText('Sharp Text', 100, 200, 48, 'sans-serif', '#ffffff');

    const buffer = await canvas.exportPNG();
    await interaction.editReply({ files: [{ attachment: buffer, name: 'filter.png' }] });
}

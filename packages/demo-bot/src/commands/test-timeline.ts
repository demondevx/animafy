import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-timeline')
    .setDescription('Test the timeline GIF builder');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const gif = await animafyClient.timeline()
        .setSize(800, 400)
        .setFPS(20)
        .addFrame((canvas) => {
            canvas.setBackground('#0D0D12')
                .drawText('Frame 1', 100, 200, 48, 'sans-serif', '#FF3366');
        }, 1000)
        .transition('fade', 500)
        .addFrame((canvas) => {
            canvas.setBackground('#16161F')
                .drawText('Frame 2', 500, 200, 48, 'sans-serif', '#7289DA');
        }, 1000)
        .export();

    await interaction.editReply({ files: [{ attachment: gif, name: 'timeline.gif' }] });
}

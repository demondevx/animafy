import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-rank')
    .setDescription('Test the RankCard template')
    .addBooleanOption(option => 
        option.setName('animated')
            .setDescription('Return as animated GIF')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const isAnimated = interaction.options.getBoolean('animated') ?? false;
    const user = interaction.user;

    const buffer = await animafyClient.rankCard({
        username: user.username,
        avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 256 }),
        level: 42,
        xp: 8750,
        maxXp: 10000,
        rank: 12,
        theme: 'neon',
        animated: isAnimated
    });

    await interaction.editReply({ files: [{ attachment: buffer, name: `rank.${isAnimated ? 'gif' : 'png'}` }] });
}

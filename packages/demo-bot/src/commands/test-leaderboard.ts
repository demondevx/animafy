import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-leaderboard')
    .setDescription('Test the LeaderboardCard template')
    .addBooleanOption(option => 
        option.setName('animated')
            .setDescription('Return as animated GIF')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const isAnimated = interaction.options.getBoolean('animated') ?? false;
    const user = interaction.user;

    const buffer = await animafyClient.leaderboardCard({
        title: 'Global Top 5',
        entries: [
            { username: 'PlayerOne', avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 128 }), score: '9999 XP' },
            { username: 'PlayerTwo', avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 128 }), score: '8888 XP' },
            { username: 'PlayerThree', avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 128 }), score: '7777 XP' },
            { username: 'PlayerFour', avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 128 }), score: '6666 XP' },
            { username: 'PlayerFive', avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 128 }), score: '5555 XP' },
        ],
        theme: 'neon',
        animated: isAnimated
    });

    await interaction.editReply({ files: [{ attachment: buffer, name: `leaderboard.${isAnimated ? 'gif' : 'png'}` }] });
}

import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-levelup')
    .setDescription('Test the LevelUpCard template')
    .addBooleanOption(option => 
        option.setName('animated')
            .setDescription('Return as animated GIF')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const isAnimated = interaction.options.getBoolean('animated') ?? false;
    const user = interaction.user;

    const buffer = await animafyClient.levelUpCard({
        username: user.username,
        avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 256 }),
        oldLevel: 41,
        newLevel: 42,
        theme: 'neon',
        animated: isAnimated
    });

    await interaction.editReply({ files: [{ attachment: buffer, name: `levelup.${isAnimated ? 'gif' : 'png'}` }] });
}

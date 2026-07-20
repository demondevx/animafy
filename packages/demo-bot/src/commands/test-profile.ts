import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-profile')
    .setDescription('Test the ProfileCard template')
    .addBooleanOption(option => 
        option.setName('animated')
            .setDescription('Return as animated GIF')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const isAnimated = interaction.options.getBoolean('animated') ?? false;
    const user = interaction.user;

    const buffer = await animafyClient.profileCard({
        username: user.username,
        avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 256 }),
        bio: 'Just a regular Discord user testing out Animafy v2.0 features!',
        badges: ['🦄', '⭐', '🔥'],
        stats: [
            { label: 'Followers', value: '1.2k' },
            { label: 'Following', value: '300' },
            { label: 'Posts', value: '42' }
        ],
        theme: 'neon',
        animated: isAnimated
    });

    await interaction.editReply({ files: [{ attachment: buffer, name: `profile.${isAnimated ? 'gif' : 'png'}` }] });
}

import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { animafyClient } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('Test the WelcomeCard template')
    .addBooleanOption(option => 
        option.setName('animated')
            .setDescription('Return as animated GIF')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const isAnimated = interaction.options.getBoolean('animated') ?? false;
    const user = interaction.user;

    const buffer = await animafyClient.welcomeCard({
        username: user.username,
        avatarUrl: user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 256 }),
        serverName: interaction.guild?.name ?? 'My Server',
        memberCount: interaction.guild?.memberCount ?? 1337,
        theme: 'neon',
        animated: isAnimated
    });

    await interaction.editReply({ files: [{ attachment: buffer, name: `welcome.${isAnimated ? 'gif' : 'png'}` }] });
}

import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Displays a welcome onboarding card.')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('The user to welcome')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const targetUser = interaction.options.getUser('target') ?? interaction.user;
    const avatarUrl = targetUser.displayAvatarURL({ size: 256, forceStatic: false });
    
    // Background image
    const bgUrl = 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/javascript/javascript.png';

    const builder = canvasService.createBuilder()
        .setSize(900, 300)
        .drawImage(bgUrl, 0, 0, 900, 300)
        // Add a dark gradient/overlay so text is readable
        .drawRect(0, 0, 900, 300, 'rgba(0, 0, 0, 0.4)')
        // Draw avatar centered
        .drawAvatar(avatarUrl, 150, 150, 80)
        // Draw text
        .drawText('WELCOME', 300, 110, 60, 'sans-serif', '#ffffff')
        .drawText(`${targetUser.username.toUpperCase()}`, 300, 170, 48, 'sans-serif', '#00A8FC')
        .drawText(`You are the 1,337th member! 🎉`, 300, 220, 24, 'sans-serif', '#DBDEE1');

    const isAnimated = avatarUrl.includes('.gif');
    const buffer = await (isAnimated ? builder.exportGIF() : builder.exportPNG());
    const ext = isAnimated ? 'gif' : 'png';
    const attachment = new AttachmentBuilder(buffer, { name: `welcome-card.${ext}` });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered welcome card in ${duration}ms (Ext: ${ext})`, files: [attachment] });
}

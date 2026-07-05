import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Displays a production-quality rank card.')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('The user to view rank for')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const targetUser = interaction.options.getUser('target') ?? interaction.user;
    const avatarUrl = targetUser.displayAvatarURL({ size: 256, forceStatic: false });

    // Mock rank data
    const level = 42;
    const currentXp = 4500;
    const requiredXp = 5000;
    const rank = 3;

    // Progress bar math
    const barX = 250;
    const barY = 170;
    const barWidth = 450;
    const barHeight = 24;
    const progress = Math.min(currentXp / requiredXp, 1);
    const fillWidth = barWidth * progress;

    const builder = canvasService.createBuilder()
        .setSize(800, 250)
        // Background card
        .drawRect(0, 0, 800, 250, '#1E1F22', 20)
        // Inner banner (optional, but looks nice)
        .drawRect(20, 20, 760, 210, '#2B2D31', 15)
        
        // Avatar Background (Ring)
        .drawAvatar(avatarUrl, 125, 125, 65)

        // User details
        .drawText(targetUser.username, 250, 90, 42, 'sans-serif', '#ffffff')
        .drawText(`RANK #${rank}`, 580, 90, 30, 'sans-serif', '#DBDEE1')
        .drawText(`LEVEL ${level}`, 430, 90, 30, 'sans-serif', '#00A8FC')
        
        // Progress Bar Background
        .drawRect(barX, barY, barWidth, barHeight, '#111214', barHeight / 2)
        // Progress Bar Fill
        .drawRect(barX, barY, fillWidth, barHeight, '#00A8FC', barHeight / 2)
        
        // XP Text
        .drawText(`${currentXp} / ${requiredXp} XP`, 580, 150, 20, 'sans-serif', '#B5BAC1');

    const isAnimated = avatarUrl.includes('.gif');
    const buffer = await (isAnimated ? builder.exportGIF() : builder.exportPNG());
    const ext = isAnimated ? 'gif' : 'png';
    const attachment = new AttachmentBuilder(buffer, { name: `rank-card.${ext}` });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered rank card in ${duration}ms (Ext: ${ext})`, files: [attachment] });
}

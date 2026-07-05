import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Showcases the Animafy avatar capabilities.')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('The user to fetch the avatar for')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const targetUser = interaction.options.getUser('target') ?? interaction.user;
    
    // Request dynamic avatar (GIF if animated, WebP otherwise)
    const avatarUrl = targetUser.displayAvatarURL({ size: 256, forceStatic: false });

    // Build the canvas
    const builder = canvasService.createBuilder()
        .setSize(600, 400)
        .setBackground('#2B2D31')
        .drawText(`${targetUser.username}'s Avatar`, 50, 60, 40, 'sans-serif', '#ffffff')
        
        // Draw the same avatar twice to prove the engine handles it efficiently
        .drawText('Animated (GIF)', 100, 120, 24, 'sans-serif', '#B5BAC1')
        .drawAvatar(avatarUrl, 150, 150, 100)
        
        .drawText('Static (PNG fallback)', 350, 120, 24, 'sans-serif', '#B5BAC1')
        // We simulate a static fallback by exporting as PNG or just requesting standard png URL
        .drawAvatar(targetUser.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true }), 400, 150, 100);

    // If the original avatar is a GIF, exportGIF will preserve animation for the first one!
    const isAnimated = avatarUrl.includes('.gif');
    const buffer = await (isAnimated ? builder.exportGIF() : builder.exportPNG());
    const ext = isAnimated ? 'gif' : 'png';
    
    const attachment = new AttachmentBuilder(buffer, { name: `animafy-avatar.${ext}` });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered in ${duration}ms (Ext: ${ext})`, files: [attachment] });
}

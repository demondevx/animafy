import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Extreme Unicode and Custom Emoji stress test.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const pool = ['<a:emoji_1:1523115541362114712>', '💰'];

    // Generate a massive string of 300+ emojis mixed with text and malformed data
    let spamText = '';
    for (let i = 0; i < 350; i++) {
        spamText += pool[Math.floor(Math.random() * pool.length)];
        if (i % 25 === 24) spamText += '\n'; // Add line breaks
    }

    const builder = canvasService.createBuilder()
        .setSize(1000, 800)
        .setBackground('#111214')
        .drawText('Adversarial Emoji Parsing Test (300+ ZWJ/Malformed)', 20, 50, 36, 'sans-serif', '#ffffff')
        .drawText(spamText, 20, 120, 32, 'sans-serif', '#ffffff');

    // We export as GIF to handle animated emojis if present!
    const buffer = await builder.exportGIF();
    
    const attachment = new AttachmentBuilder(buffer, { name: 'emoji-stress.gif' });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: `Rendered adversarial payload (350 items) in ${duration}ms`, files: [attachment] });
}

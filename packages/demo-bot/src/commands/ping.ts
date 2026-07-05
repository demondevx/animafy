import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with latency information.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    
    await interaction.editReply(`🏓 Pong!\nGateway: \`${interaction.client.ws.ping}ms\`\nAPI: \`${latency}ms\`\nCanvas Engine: \`Ready\``);
}

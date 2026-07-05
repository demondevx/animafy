import { Events, type Interaction } from 'discord.js';
import { commands } from '../handlers/commandHandler.js';
import { logger } from '../utils/logger.js';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        logger.error(`Error executing ${interaction.commandName}`, error);
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } catch (e) {
            logger.error(`Failed to send fallback error message (likely interaction expired):`, e);
        }
    }
}

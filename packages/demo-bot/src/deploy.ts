import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { commands, loadCommands } from './handlers/commandHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    logger.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
    process.exit(1);
}

(async () => {
    await loadCommands();
    const rest = new REST().setToken(token);

    try {
        logger.info(`Started refreshing ${commands.size} application (/) commands.`);

        const body = commands.map(c => {
            const json = c.data.toJSON();
            // Set contexts to allow user install
            (json as any).integration_types = [0, 1]; // Guild, User Install
            (json as any).contexts = [0, 1, 2]; // Guild, Bot DM, Private Channel
            return json;
        });

        await rest.put(
            Routes.applicationCommands(clientId),
            { body },
        );

        logger.info(`Successfully reloaded application (/) commands.`);
    } catch (error) {
        logger.error('Error deploying commands:', error);
    }
})();

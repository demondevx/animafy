import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadCommands } from './handlers/commandHandler.js';
import { logger } from './utils/logger.js';
import * as readyEvent from './events/ready.js';
import * as interactionCreateEvent from './events/interactionCreate.js';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

await loadCommands();

client.once(readyEvent.name, readyEvent.execute);
client.on(interactionCreateEvent.name, interactionCreateEvent.execute);

if (!process.env.DISCORD_TOKEN) {
    logger.error('Missing DISCORD_TOKEN in environment variables.');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(err => {
    logger.error('Failed to login:', err);
});

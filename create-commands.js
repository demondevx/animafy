const fs = require('fs');
const path = require('path');

const commands = ['help', 'showcase', 'avatar', 'emoji', 'text', 'gif', 'rank', 'welcome', 'benchmark', 'version'];

const template = (name) => `import { SlashCommandBuilder, type ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('${name}')
    .setDescription('Showcases the Animafy ${name} capabilities.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const builder = canvasService.createBuilder()
        .setSize(800, 400)
        .setBackground('#2B2D31')
        .drawText('Animafy ${name}', 400, 50, 48, 'sans-serif', '#ffffff');

    const isAnimated = ['gif'].includes('${name}');
    const buffer = await (isAnimated ? builder.exportGIF() : builder.exportPNG());
    const ext = isAnimated ? 'gif' : 'png';
    
    const attachment = new AttachmentBuilder(buffer, { name: \`animafy-${name}.\${ext}\` });
    const duration = Math.round(performance.now() - start);

    await interaction.editReply({ content: \`Rendered in \${duration}ms\`, files: [attachment] });
}
`;

commands.forEach(name => {
    fs.writeFileSync(path.join(__dirname, 'packages/demo-bot/src/commands', `${name}.ts`), template(name));
});

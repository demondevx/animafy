import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('determinism')
    .setDescription('Validates deterministic frame-level rendering.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const start = performance.now();

    const ITERATIONS = 50;
    const baseHashes: string[] = [];
    let mismatchFound = false;
    let mismatchIteration = -1;

    for (let i = 0; i < ITERATIONS; i++) {
        const builder = canvasService.createBuilder()
            .setSize(800, 400)
            .setBackground('#1E1F22')
            .drawAvatar('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', 200, 200, 80)
            .drawAvatar('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', 600, 200, 80)
            .drawText('Deterministic Output Sync 🚀', 150, 100, 40, 'sans-serif', '#ffffff');

        let currentHashes: string[] = [];
        await builder.exportGIF({
            onMetrics: (m: any) => {
                if (m.frameHashes) currentHashes = m.frameHashes;
            }
        });

        if (i === 0) {
            baseHashes.push(...currentHashes);
        } else {
            if (currentHashes.length !== baseHashes.length) {
                mismatchFound = true;
                mismatchIteration = i;
                break;
            }
            for (let j = 0; j < baseHashes.length; j++) {
                if (currentHashes[j] !== baseHashes[j]) {
                    mismatchFound = true;
                    mismatchIteration = i;
                    break;
                }
            }
            if (mismatchFound) break;
        }
    }

    const duration = Math.round(performance.now() - start);

    const embed = new EmbedBuilder()
        .setTitle('🧬 Determinism Validation')
        .setColor(mismatchFound ? '#FF0000' : '#00FF00')
        .addFields(
            { name: 'Iterations', value: `\`${ITERATIONS}\``, inline: true },
            { name: 'Frame Count', value: `\`${baseHashes.length}\``, inline: true },
            { name: 'Total Validation Time', value: `\`${duration}ms\``, inline: true },
            { name: 'Result', value: mismatchFound ? `❌ Mismatch at iteration ${mismatchIteration}` : '✅ 100% Deterministic', inline: false }
        );

    await interaction.editReply({ embeds: [embed] });
}

import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('benchmark')
    .setDescription('Runs a performance benchmark and cache metric analysis.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const embed = new EmbedBuilder()
        .setTitle('Animafy Engine Benchmark')
        .setColor('#5865F2')
        .setDescription('Running cache and rendering performance tests...');
        
    await interaction.editReply({ embeds: [embed] });

    // The asset to test
    const avatarUrl = 'https://github.githubassets.com/images/spinners/octocat-spinner-128.gif';

    // Helper to generate a heavy frame
    const createBuilder = () => {
        return canvasService.createBuilder()
            .setSize(800, 400)
            .setBackground('#1E1F22')
            .drawAvatar(avatarUrl, 100, 200, 80)
            .drawAvatar(avatarUrl, 400, 200, 80)
            .drawAvatar(avatarUrl, 700, 200, 80)
            .drawText('🚀 Cache Performance Test 🚀', 400, 80, 40, 'sans-serif', '#ffffff');
    };

    // 1. Cold Cache Performance (Cache Miss)
    // We append a random query parameter to ensure a cache miss on the URL level for the asset manager
    const coldUrl = avatarUrl + '?bust=' + Date.now();
    const builderCold = canvasService.createBuilder()
        .setSize(800, 400)
        .setBackground('#1E1F22')
        .drawAvatar(coldUrl, 100, 200, 80)
        .drawText('Cold Start', 400, 80, 40, 'sans-serif', '#ffffff');

    const startCold = performance.now();
    await builderCold.exportPNG(); // Just fetch and render 1 frame
    const coldMissTime = performance.now() - startCold;

    // 2. Warm Cache Performance (Cache Hit)
    // Same URL is already cached now!
    const startWarm = performance.now();
    await builderCold.exportPNG();
    const warmHitTime = performance.now() - startWarm;

    // 3. GIF Encoding Time (Isolated)
    // We use the same builder which is already cached. The time it takes to exportGIF vs exportPNG
    const builderGif = canvasService.createBuilder()
        .setSize(800, 400)
        .setBackground('#1E1F22')
        .drawAvatar(coldUrl, 100, 200, 80)
        .drawText('GIF Encoding', 400, 80, 40, 'sans-serif', '#ffffff');
        
    let loadTime = 0;
    let composeTime = 0;
    let encodeTime = 0;

    const startGif = performance.now();
    await builderGif.exportGIF({
        onMetrics: (m: any) => {
            composeTime = m.composeTime;
            encodeTime = m.encodeTime;
        }
    });
    const totalGifTime = performance.now() - startGif;
    loadTime = totalGifTime - composeTime - encodeTime;

    // Build the results embed
    const resultsEmbed = new EmbedBuilder()
        .setTitle('📊 Benchmark Results')
        .setColor('#00FF00')
        .addFields(
            { name: 'Cold Cache (Miss)', value: `\`${coldMissTime.toFixed(2)} ms\``, inline: true },
            { name: 'Warm Cache (Hit)', value: `\`${warmHitTime.toFixed(2)} ms\``, inline: true },
            { name: 'Performance Gain', value: `\`${(coldMissTime / warmHitTime).toFixed(2)}x faster\``, inline: true },
            { name: 'Full GIF Pipeline', value: `\`${totalGifTime.toFixed(2)} ms\``, inline: false },
            { name: '↳ Asset Decode', value: `\`${loadTime.toFixed(2)} ms\``, inline: true },
            { name: '↳ Frame Compose', value: `\`${composeTime.toFixed(2)} ms\``, inline: true },
            { name: '↳ GIF Encode', value: `\`${encodeTime.toFixed(2)} ms\``, inline: true }
        )
        .setFooter({ text: 'Powered by @napi-rs/canvas & Animafy AssetManager' });

    await interaction.editReply({ embeds: [resultsEmbed] });
}

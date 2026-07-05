import { config } from 'dotenv';
import { animafyClient } from './services/canvasService.js';

config();

const USER_ID = '903646866237976606';

async function getAvatarUrl() {
    const token = process.env.DISCORD_TOKEN;
    const res = await fetch(`https://discord.com/api/v10/users/${USER_ID}`, {
        headers: { Authorization: `Bot ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    const user = await res.json() as any;
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif?size=256`;
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAvatarPipeline(avatarUrl: string) {
    const fetchStart = performance.now();
    const fetchRes = await fetch(avatarUrl);
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fetchTime = performance.now() - fetchStart;

    const decodeStart = performance.now();
    await animafyClient.cache.resolve(buffer);
    const decodeTime = performance.now() - decodeStart;

    const builder = animafyClient.canvas()
        .setSize(600, 400)
        .setBackground('#2B2D31')
        .drawAvatar(avatarUrl, 150, 150, 100);

    let composeTime = 0;
    let encodeTime = 0;
    const exportStart = performance.now();
    await builder.exportGIF({
        onMetrics: (metrics) => {
            composeTime = metrics.composeTime;
            encodeTime = metrics.encodeTime;
        },
        fastMode: true // Run fast mode in benchmark
    });
    // exportTime is measured directly by the encode step
    const exportTime = encodeTime;

    return { fetchTime, decodeTime, composeTime, exportTime, totalTime: fetchTime + decodeTime + composeTime + exportTime };
}

async function runShowcasePipeline(avatarUrl: string) {
    const builder = animafyClient.canvas()
        .setSize(800, 400)
        .setBackground('#2B2D31')
        .drawText('Animafy Engine Showcase ✨', 50, 80, 48, 'sans-serif', '#ffffff')
        .drawAvatar(avatarUrl, 150, 200, 100)
        .drawText('Unicode Emojis: 🔥🚀😂👻', 300, 200, 32, 'sans-serif', '#ffffff');

    const start = performance.now();
    await builder.exportGIF({ fastMode: true });
    return performance.now() - start;
}

function getMemMB() {
    return process.memoryUsage().heapUsed / 1024 / 1024;
}

async function main() {
    console.log('Fetching user avatar URL...');
    const avatarUrl = await getAvatarUrl();
    console.log(`Avatar URL: ${avatarUrl}`);

    const initialMem = getMemMB();
    let peakMem = initialMem;
    const updatePeak = () => {
        const mem = getMemMB();
        if (mem > peakMem) peakMem = mem;
    };

    // 1. /avatar rendering test
    console.log('\n--- 1. Avatar Rendering Test (20 iterations) ---');
    const avatarMetrics = { fetch: 0, decode: 0, render: 0, export: 0, count: 20 };
    for (let i = 1; i <= 20; i++) {
        // Clear cache to simulate cold asset fetch each time
        animafyClient.cache['cache']['cache'].clear();
        
        const m = await runAvatarPipeline(avatarUrl);
        updatePeak();
        console.log(`Run #${i}:`);
        console.log(`Fetch: ${m.fetchTime.toFixed(2)} ms`);
        console.log(`Decode: ${m.decodeTime.toFixed(2)} ms`);
        console.log(`Render: ${m.composeTime.toFixed(2)} ms`);
        console.log(`Export: ${m.exportTime.toFixed(2)} ms`);
        console.log(`Total: ${m.totalTime.toFixed(2)} ms\n`);

        avatarMetrics.fetch += m.fetchTime;
        avatarMetrics.decode += m.decodeTime;
        avatarMetrics.render += m.composeTime;
        avatarMetrics.export += m.exportTime;
        if (global.gc) global.gc();
    }

    // 2. & 3. /showcase stress render + Cache performance
    console.log('\n--- 2 & 3. Showcase Stress + Cache Performance (10 iterations) ---');
    animafyClient.cache['cache']['cache'].clear();
    const showcaseRuns: number[] = [];
    
    for (let i = 1; i <= 10; i++) {
        const duration = await runShowcasePipeline(avatarUrl);
        showcaseRuns.push(duration);
        updatePeak();
        console.log(`Showcase Run #${i}: ${duration.toFixed(2)} ms (Mem: ${getMemMB().toFixed(2)} MB)`);
    }

    const coldStart = showcaseRuns[0];
    let warmStartAvg = 0;
    for (let i = 1; i < showcaseRuns.length; i++) warmStartAvg += showcaseRuns[i];
    warmStartAvg /= (showcaseRuns.length - 1);
    const speedup = coldStart / warmStartAvg;

    // 4. GIF avatar correctness
    console.log('\n--- 4. GIF Correctness Check ---');
    const asset = animafyClient.cache.getCached(avatarUrl) as any;
    const isAnimated = asset && 'frames' in asset && asset.frames.length > 1;
    console.log(`Animated: ${isAnimated}`);
    console.log(`Frame Count: ${isAnimated ? asset.frames.length : 1}`);
    
    const finalMem = getMemMB();

    console.log('\n\n=== ANIMAFY PERFORMANCE REPORT ===\n');
    console.log('Avatar Pipeline:');
    console.log(`- avg fetch time: ${(avatarMetrics.fetch / 20).toFixed(2)} ms`);
    console.log(`- avg decode time: ${(avatarMetrics.decode / 20).toFixed(2)} ms`);
    console.log(`- avg render time: ${(avatarMetrics.render / 20).toFixed(2)} ms`);
    console.log(`- avg export time: ${(avatarMetrics.export / 20).toFixed(2)} ms\n`);

    console.log('Showcase Pipeline:');
    console.log(`- cold start avg: ${coldStart.toFixed(2)} ms`);
    console.log(`- warm start avg: ${warmStartAvg.toFixed(2)} ms`);
    console.log(`- cache speedup ratio: ${speedup.toFixed(2)}x\n`);

    console.log('Memory:');
    console.log(`- initial: ${initialMem.toFixed(2)} MB`);
    console.log(`- peak: ${peakMem.toFixed(2)} MB`);
    console.log(`- final: ${finalMem.toFixed(2)} MB\n`);

    const bottleneck = Math.max(avatarMetrics.fetch, avatarMetrics.decode, avatarMetrics.render, avatarMetrics.export);
    let bottleneckName = '';
    if (bottleneck === avatarMetrics.fetch) bottleneckName = 'Asset Fetching (Network)';
    if (bottleneck === avatarMetrics.decode) bottleneckName = 'GIF Decoding (CPU)';
    if (bottleneck === avatarMetrics.render) bottleneckName = 'Canvas Compose (CPU)';
    if (bottleneck === avatarMetrics.export) bottleneckName = 'GIF Encoding (CPU)';

    console.log('Bottlenecks:');
    console.log(`1. ${bottleneckName}`);
    
    console.log('\nRecommendations:');
    if (bottleneckName.includes('Encoding')) {
        console.log('- Consider switching to lower frame rates or smaller resolution for GIF encoding, or use worker threads for encoding.');
    } else if (bottleneckName.includes('Decoding')) {
        console.log('- Pre-warm cache for known active users, or use WebAssembly for faster GIF decoding.');
    } else {
        console.log('- Optimization required in network layer (keep-alive connections).');
    }
}

main().catch(console.error);

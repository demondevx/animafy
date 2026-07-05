import { config } from 'dotenv';
import { animafyClient } from './services/canvasService.js';

config();

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSingleJob(id: number, avatarUrl: string): Promise<any> {
    const builder = animafyClient.canvas()
        .setSize(800, 400)
        .setBackground('#2B2D31')
        .drawText(`Concurrent User ${id}`, 50, 80, 48, 'sans-serif', '#ffffff')
        .drawAvatar(avatarUrl, 150, 200, 100)
        .drawText('Unicode Emojis: 🔥🚀😂👻', 300, 200, 32, 'sans-serif', '#ffffff');

    let composeTime = 0;
    let encodeTime = 0;

    const start = performance.now();
    await builder.exportGIF({
        fastMode: false,
        onMetrics: (m: any) => {
            composeTime = m.composeTime;
            encodeTime = m.encodeTime;
        }
    });
    const totalTime = performance.now() - start;

    return { id, totalTime, composeTime, encodeTime };
}

async function main() {
    console.log('Fetching user avatar URL...');
    const userId = '903646866237976606'; // Target testing user
    let avatarUrl = '';
    
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user');
    }

    const userData = await response.json();
    avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.gif?size=256`;
    console.log(`Avatar URL: ${avatarUrl}`);

    // Pre-cache asset to only test render/encode saturation, not network saturation
    console.log('Pre-caching asset...');
    const buf = await (await fetch(avatarUrl)).arrayBuffer();
    await animafyClient.cache.resolve(Buffer.from(buf));

    console.log('\n--- STARTING CONCURRENCY SATURATION (20 JOBS) ---');
    
    let peakMemory = 0;
    const interval = setInterval(() => {
        const mem = process.memoryUsage().heapUsed / 1024 / 1024;
        if (mem > peakMemory) peakMemory = mem;
    }, 100);

    const CONCURRENCY = 20;
    const promises: Promise<any>[] = [];

    const saturationStart = performance.now();

    for (let i = 1; i <= CONCURRENCY; i++) {
        promises.push(runSingleJob(i, avatarUrl));
    }

    const results = await Promise.all(promises);
    const saturationTotal = performance.now() - saturationStart;

    clearInterval(interval);

    results.sort((a, b) => a.totalTime - b.totalTime);

    const avg = results.reduce((acc, curr) => acc + curr.totalTime, 0) / CONCURRENCY;
    const max = results[CONCURRENCY - 1].totalTime;
    const p95 = results[Math.floor(CONCURRENCY * 0.95) - 1].totalTime;
    
    const avgEncode = results.reduce((acc, curr) => acc + curr.encodeTime, 0) / CONCURRENCY;

    console.log('\n=== SATURATION BENCHMARK RESULTS ===');
    console.log(`Concurrent Jobs: ${CONCURRENCY}`);
    console.log(`Fast Mode: OFF (Full Quality)`);
    console.log(`Total Wall-Clock Time: ${saturationTotal.toFixed(2)} ms`);
    console.log(`Peak Heap Usage: ${peakMemory.toFixed(2)} MB`);
    console.log('\nPer-Job Render Time:');
    console.log(`- Avg: ${avg.toFixed(2)} ms`);
    console.log(`- Max: ${max.toFixed(2)} ms`);
    console.log(`- P95: ${p95.toFixed(2)} ms`);
    console.log(`- Avg Encode Time: ${avgEncode.toFixed(2)} ms`);
}

main().catch(console.error);

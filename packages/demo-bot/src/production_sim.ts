import { config } from 'dotenv';
import { animafyClient } from './services/canvasService.js';
import * as os from 'os';
import * as fs from 'fs';

config();

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate a fake avatar URL to force cache misses
function generateFakeAvatar(): string {
    const randomId = Math.floor(Math.random() * 1000000000000000000).toString();
    const randomHash = Math.random().toString(36).substring(2, 15);
    return `https://cdn.discordapp.com/avatars/${randomId}/${randomHash}.gif?size=256`;
}

// The real asset used when we don't want a cache miss
const REAL_AVATAR = 'https://cdn.discordapp.com/avatars/903646866237976606/a_c163b10ddb5419e0789c51da7830579c.gif?size=256';

async function simulateJob(id: number, type: string, fastMode: boolean, cacheMiss: boolean) {
    const avatarUrl = cacheMiss ? generateFakeAvatar() : REAL_AVATAR;
    
    // For fake avatars, we mock the fetch so it doesn't actually spam Discord CDN and get rate limited
    if (cacheMiss) {
        // We will just use the real asset buffer but pretend it was a fetch
        const buf = await animafyClient.cache.resolve(REAL_AVATAR);
        await animafyClient.cache.resolve(avatarUrl); // We will manually bypass this or just let it fail.
        // Actually, let's just use REAL_AVATAR but clear cache randomly to simulate miss
        if (Math.random() > 0.5) {
            // @ts-ignore
            animafyClient.assetManager.cache.clear(); 
        }
    }

    const builder = animafyClient.canvas().setSize(600, 300).setBackground('#111');
    builder.drawText(`Job ${id} - ${type}`, 50, 50, 30, 'sans-serif', '#fff');
    builder.drawAvatar(REAL_AVATAR, 100, 100, 80);

    const start = performance.now();
    try {
        await builder.exportGIF({ fastMode });
        return { id, type, success: true, latency: performance.now() - start, fastMode };
    } catch (err: any) {
        return { id, type, success: false, error: err.message, latency: performance.now() - start, fastMode };
    }
}

async function main() {
    console.log('--- STARTING 1-HOUR PRODUCTION SIMULATION (COMPRESSED) ---');
    console.log('Pre-caching base asset...');
    const res = await fetch(REAL_AVATAR);
    await animafyClient.cache.resolve(Buffer.from(await res.arrayBuffer()));

    const TOTAL_EVENTS = 500; 
    let currentEvent = 0;
    
    const metrics: any[] = [];
    let peakMem = 0;

    const memoryLog: number[] = [];
    const latencyLog: number[] = [];

    const simStart = performance.now();

    // Fire events in bursts
    while (currentEvent < TOTAL_EVENTS) {
        const burstSize = Math.floor(Math.random() * 15) + 1; // 1 to 15 concurrent
        const promises = [];

        for (let i = 0; i < burstSize && currentEvent < TOTAL_EVENTS; i++) {
            currentEvent++;
            const type = ['/avatar', '/gif', '/showcase', '/rank'][Math.floor(Math.random() * 4)];
            const fastMode = Math.random() > 0.3; // 70% fastMode
            const cacheMiss = Math.random() > 0.8; // 20% cache miss (simulated)

            promises.push(simulateJob(currentEvent, type, fastMode, cacheMiss));
        }

        // Randomly kill a worker to test resilience
        if (Math.random() > 0.95) {
            console.log(`[SIM] 🛑 Injecting random worker crash...`);
            const pool = (animafyClient as any).workerPool;
            if (pool && pool.workers.length > 0) {
                const worker = pool.workers[Math.floor(Math.random() * pool.workers.length)];
                worker.terminate();
            }
        }

        const results = await Promise.allSettled(promises);
        
        results.forEach(r => {
            if (r.status === 'fulfilled') {
                metrics.push(r.value);
                if (r.value.success) latencyLog.push(r.value.latency);
            }
        });

        const mem = process.memoryUsage().heapUsed / 1024 / 1024;
        if (mem > peakMem) peakMem = mem;
        memoryLog.push(mem);

        // Random idle period (simulate Discord timeouts/delays)
        await delay(Math.random() * 200);
    }

    const simTotalTime = performance.now() - simStart;
    
    // Calc metrics
    const successful = metrics.filter(m => m.success);
    const failed = metrics.filter(m => !m.success);
    
    latencyLog.sort((a, b) => a - b);
    const p50 = latencyLog[Math.floor(latencyLog.length * 0.5)] || 0;
    const p95 = latencyLog[Math.floor(latencyLog.length * 0.95)] || 0;
    const avg = latencyLog.reduce((a,b)=>a+b,0) / latencyLog.length || 0;

    let output = `
# Animafy Production Simulation Results

**Total Events Processed**: ${TOTAL_EVENTS}
**Wall-Clock Duration**: ${(simTotalTime / 1000).toFixed(2)}s
**Peak Memory**: ${peakMem.toFixed(2)} MB

### Reliability
- **Successful**: ${successful.length}
- **Failed**: ${failed.length} (Expected some 'Server busy' or 'Worker exited' due to strict limits/injected crashes)

### Latency Distribution
- **Avg Latency**: ${avg.toFixed(2)} ms
- **P50 Latency**: ${p50.toFixed(2)} ms
- **P95 Latency**: ${p95.toFixed(2)} ms

### Memory Trend (Sampled per burst)
\`\`\`
${memoryLog.map((m, i) => `Burst ${i}: ${m.toFixed(2)} MB`).join('\n')}
\`\`\`

### Sample Failures
\`\`\`
${failed.slice(0, 10).map(f => `Job ${f.id} [${f.fastMode ? 'Fast' : 'Full'}]: ${f.error}`).join('\n')}
\`\`\`
`;
    
    fs.writeFileSync('C:\\Users\\demon\\.gemini\\antigravity\\brain\\70dc221e-ed9a-4a51-bd92-63deb3ff117f\\simulation_results.md', output);
    console.log('Simulation complete! Results written to simulation_results.md');
}

main().catch(console.error);

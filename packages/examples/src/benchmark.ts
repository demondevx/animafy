import { AssetManager } from '@animafy/assets';
import { OmggifDecoder } from '@animafy/decoders';
import { CanvasBuilder } from '@animafy/core';

async function runBenchmark() {
    console.log('--- Animafy Benchmark ---');
    const assetManager = new AssetManager({
        maxSize: 100,
        ttl: 60000
    });
    assetManager.setGifDecoder(new OmggifDecoder());

    const avatarUrl = 'https://github.githubassets.com/images/spinners/octocat-spinner-128.gif';

    async function runSingleRender() {
        const builder = new CanvasBuilder(assetManager)
            .setSize(800, 400)
            .setBackground('#1E1F22')
            .drawAvatar(avatarUrl, 50, 50, 100)
            .drawText('Spamming commands! 😂', 200, 100, 40, 'sans-serif', '#ffffff');
        
        return await builder.exportGIF(); 
    }

    // 1. Cold boot
    console.log('\n[1] Cold Run...');
    let start = performance.now();
    await runSingleRender();
    console.log(`Cold Run: ${Math.round(performance.now() - start)}ms`);
    
    let mem = process.memoryUsage();
    console.log(`Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)} MB`);

    // 2. Cached Run
    console.log('\n[2] Cached Run...');
    start = performance.now();
    await runSingleRender();
    console.log(`Cached Run: ${Math.round(performance.now() - start)}ms`);

    mem = process.memoryUsage();
    console.log(`Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)} MB`);

    // 3. Spam Simulation
    console.log('\n[3] Spam Simulation (10 concurrent renders)...');
    start = performance.now();
    await Promise.all(Array.from({ length: 10 }).map(() => runSingleRender()));
    console.log(`10 Renders: ${Math.round(performance.now() - start)}ms`);

    mem = process.memoryUsage();
    console.log(`Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)} MB`);
}

runBenchmark().catch(console.error);

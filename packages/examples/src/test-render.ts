import { AssetManager } from '@animafy/assets';
import { OmggifDecoder } from '@animafy/decoders';
import { CanvasBuilder } from '@animafy/core';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const assetManager = new AssetManager({
        maxSize: 100,
        ttl: 60000
    });
    assetManager.setGifDecoder(new OmggifDecoder());

    // Fallback GIF and static URLs for testing decoding
    const builder = new CanvasBuilder(assetManager)
        .setSize(800, 400)
        .setBackground('#1E1F22')
        .drawAvatar('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', 50, 50, 100) // Valid test GIF
        .drawText('Hello 😂 👨‍👩‍👧‍👦', 200, 100, 40, 'sans-serif', '#ffffff');

    console.log('Rendering GIF...');
    const start = performance.now();
    
    try {
        const gifBuffer = await builder.exportGIF();
        fs.writeFileSync(path.join(__dirname, '../../test.gif'), gifBuffer);
        console.log(`Rendered successfully in ${Math.round(performance.now() - start)}ms. Wrote to test.gif`);
    } catch (err) {
        console.error('Render failed:', err);
    }
}

run();

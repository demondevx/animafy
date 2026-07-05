import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { canvasService } from '../services/canvasService.js';

export const data = new SlashCommandBuilder()
    .setName('stress-test')
    .setDescription('Developer-only command to stress test the Animafy engine.')
    .addIntegerOption(option => 
        option.setName('duration_minutes')
            .setDescription('Duration to run the test in minutes (default 0 for one-shot)')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(14)
    )
    .setDefaultMemberPermissions(0); // Admin only

class Semaphore {
    private tasks: (() => void)[] = [];
    constructor(private count: number) {}
    
    async acquire() {
        if (this.count > 0) {
            this.count--;
            return;
        }
        await new Promise<void>(resolve => this.tasks.push(resolve));
    }
    
    release() {
        this.count++;
        if (this.tasks.length > 0) {
            this.count--;
            const next = this.tasks.shift();
            if (next) next();
        }
    }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout exceeded (${timeoutMs}ms)`)), timeoutMs);
    });
    
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timer!);
    }
}

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== 'YOUR_DEVELOPER_ID' && !interaction.memberPermissions?.has('Administrator')) {
        return interaction.reply({ content: 'Unauthorized.', ephemeral: true });
    }

    await interaction.deferReply();

    const durationMinutes = interaction.options.getInteger('duration_minutes') ?? 0;
    const isLoopMode = durationMinutes > 0;
    const endTimestamp = Date.now() + (durationMinutes * 60 * 1000);

    const embed = new EmbedBuilder()
        .setTitle('🔥 Animafy Stress Test 🔥')
        .setColor('#FF0000')
        .setDescription(`Running ${isLoopMode ? `for ${durationMinutes} minutes` : 'one-shot'} under strict concurrency limits...`);
    await interaction.editReply({ embeds: [embed] });

    if (global.gc) global.gc(); // Force GC for clean baseline
    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    const CONCURRENCY_LIMIT = 5;
    const TIMEOUT_MS = 10000;
    const semaphore = new Semaphore(CONCURRENCY_LIMIT);

    let successCount = 0;
    let failureCount = 0;
    let totalRenderTime = 0;
    let maxRenderTime = 0;
    let peakMem = startMem;
    const memSnapshots: number[] = [];

    const runTask = async (taskName: string, renderFn: () => Promise<Buffer>) => {
        await semaphore.acquire();
        const start = performance.now();
        try {
            await withTimeout(renderFn(), TIMEOUT_MS);
            const duration = performance.now() - start;
            totalRenderTime += duration;
            if (duration > maxRenderTime) maxRenderTime = duration;
            successCount++;
        } catch (error) {
            failureCount++;
            console.error(`[Stress Test] Task ${taskName} failed:`, error);
        } finally {
            semaphore.release();
        }
    };

    let loops = 0;
    let lastLogTime = Date.now();

    // The core payload loop
    do {
        const tasks: Promise<void>[] = [];

        // 20 Showcase tests per loop
        for (let i = 0; i < 20; i++) {
            tasks.push(runTask(`Showcase-${loops}-${i}`, async () => {
                const builder = canvasService.createBuilder()
                    .setSize(1000, 500)
                    .drawImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&auto=format&fit=crop', 0, 0, 1000, 500)
                    .drawText(`Stress Test Run ${loops}-${i} 🚀🔥`, 80, 120, 56, 'sans-serif', '#ffffff')
                    .drawAvatar('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', 100, 200, 100);
                return builder.exportGIF();
            }));
        }

        // 10 heavy GIF tests per loop
        for (let i = 0; i < 10; i++) {
            tasks.push(runTask(`HeavyGIF-${loops}-${i}`, async () => {
                const builder = canvasService.createBuilder()
                    .setSize(800, 400)
                    .drawAvatar('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', 200, 200, 80)
                    .drawAvatar('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', 400, 200, 80)
                    .drawAvatar('https://github.githubassets.com/images/spinners/octocat-spinner-128.gif', 600, 200, 80)
                    .drawText(`Syncing emojis: 🚀✨🚀✨`, 250, 350, 32, 'sans-serif', '#ffffff');
                return builder.exportGIF();
            }));
        }

        await Promise.all(tasks);
        loops++;

        // Memory Snapshot Logging every ~30 seconds
        if (isLoopMode && Date.now() - lastLogTime > 30000) {
            if (global.gc) global.gc();
            const currentMem = process.memoryUsage().heapUsed;
            if (currentMem > peakMem) peakMem = currentMem;
            memSnapshots.push(currentMem);
            console.log(`[Stress Test] Memory Snapshot: ${(currentMem / 1024 / 1024).toFixed(2)} MB`);
            lastLogTime = Date.now();
        }

    } while (isLoopMode && Date.now() < endTimestamp);

    if (global.gc) global.gc();
    const endMem = process.memoryUsage().heapUsed;
    if (endMem > peakMem) peakMem = endMem;

    const memDeltaMb = (endMem - startMem) / 1024 / 1024;
    const peakDeltaMb = (peakMem - startMem) / 1024 / 1024;
    const avgTime = successCount > 0 ? totalRenderTime / successCount : 0;
    const totalTime = (performance.now() - startTime) / 1000;

    const resultsEmbed = new EmbedBuilder()
        .setTitle('🔥 Stress Test Results 🔥')
        .setColor(failureCount === 0 && memDeltaMb < 50 ? '#00FF00' : '#FF0000')
        .addFields(
            { name: 'Total Time', value: `\`${totalTime.toFixed(2)}s\``, inline: true },
            { name: 'Loops Completed', value: `\`${loops}\``, inline: true },
            { name: 'Success / Failed', value: `\`${successCount} / ${failureCount}\``, inline: true },
            { name: 'Average Render', value: `\`${avgTime.toFixed(2)}ms\``, inline: true },
            { name: 'Max Render', value: `\`${maxRenderTime.toFixed(2)}ms\``, inline: true },
            { name: 'Start Mem', value: `\`${(startMem / 1024 / 1024).toFixed(2)} MB\``, inline: true },
            { name: 'End Mem (Delta)', value: `\`${(endMem / 1024 / 1024).toFixed(2)} MB (${memDeltaMb > 0 ? '+' : ''}${memDeltaMb.toFixed(2)} MB)\``, inline: true },
            { name: 'Peak Mem', value: `\`${(peakMem / 1024 / 1024).toFixed(2)} MB\``, inline: true }
        )
        .setFooter({ text: 'Ensure node runs with --expose-gc for accurate metrics' });

    await interaction.editReply({ embeds: [resultsEmbed] });
}

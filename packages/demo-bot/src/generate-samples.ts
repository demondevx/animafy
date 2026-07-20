import fs from 'fs';
import path from 'path';
import { animafyClient } from './services/canvasService.js';

const outDir = path.join(process.cwd(), 'samples');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

async function main() {
    console.log('Generating samples...');

    // Gradient
    console.log('Generating gradient.png...');
    const gradient = animafyClient.canvas()
        .setSize(800, 400).setBackground('#1a1a2e')
        .drawGradient('linear', 100, 100, 600, 200, [
            { offset: 0, color: '#FF3366' }, { offset: 1, color: '#7289DA' }
        ], 45)
        .drawText('Linear Gradient', 400, 200, 48, 'sans-serif', '#ffffff');
    fs.writeFileSync(path.join(outDir, 'gradient.png'), await gradient.exportPNG());

    // Shadow
    console.log('Generating shadow.png...');
    const shadow = animafyClient.canvas()
        .setSize(800, 400).setBackground('#1a1a2e')
        .pushState()
        .setShadow(10, 10, 20, 'rgba(0, 0, 0, 0.8)')
        .drawRect(200, 100, 400, 200, '#FF3366', 20)
        .popState();
    fs.writeFileSync(path.join(outDir, 'shadow.png'), await shadow.exportPNG());

    // Progress Bar
    console.log('Generating progress.png...');
    const progress = animafyClient.canvas()
        .setSize(800, 400).setBackground('#1a1a2e')
        .drawProgressBar(100, 180, 600, 40, 0.75, {
            barColor: '#FF3366', bgColor: '#16161F', radius: 20
        });
    fs.writeFileSync(path.join(outDir, 'progress.png'), await progress.exportPNG());

    // Filter
    console.log('Generating filter.png...');
    const filter = animafyClient.canvas()
        .setSize(800, 400).setBackground('#1a1a2e')
        .pushState().setFilter('blur(5px)').drawText('Blurred Text', 100, 100, 48, 'sans-serif', '#ffffff').popState()
        .drawText('Sharp Text', 100, 200, 48, 'sans-serif', '#ffffff');
    fs.writeFileSync(path.join(outDir, 'filter.png'), await filter.exportPNG());

    // Timeline
    console.log('Generating timeline.gif...');
    const timeline = await animafyClient.timeline()
        .setSize(800, 400).setFPS(20)
        .addFrame((c) => { c.setBackground('#0D0D12').drawText('Frame 1', 100, 200, 48, 'sans-serif', '#FF3366'); }, 1000)
        .transition('fade', 500)
        .addFrame((c) => { c.setBackground('#16161F').drawText('Frame 2', 500, 200, 48, 'sans-serif', '#7289DA'); }, 1000)
        .export();
    fs.writeFileSync(path.join(outDir, 'timeline.gif'), timeline);

    // Rank Card
    console.log('Generating rank.png...');
    const rankOpts = {
        username: 'DemonDevx',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
        level: 42, xp: 8750, maxXp: 10000, rank: 12, theme: 'neon'
    };
    fs.writeFileSync(path.join(outDir, 'rank.png'), await animafyClient.rankCard(rankOpts));

    // Welcome Card
    console.log('Generating welcome.png...');
    const welcomeOpts = {
        username: 'DemonDevx', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
        serverName: 'Animafy Community', memberCount: 1337, theme: 'neon'
    };
    fs.writeFileSync(path.join(outDir, 'welcome.png'), await animafyClient.welcomeCard(welcomeOpts));

    // Profile Card
    console.log('Generating profile.png...');
    const profileOpts = {
        username: 'DemonDevx', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
        bio: 'Creating awesome tools for Discord bots!', badges: ['🌟', '🔥'],
        stats: [{ label: 'Followers', value: '1.2k' }, { label: 'Following', value: '300' }], theme: 'neon'
    };
    fs.writeFileSync(path.join(outDir, 'profile.png'), await animafyClient.profileCard(profileOpts));

    // Leaderboard
    console.log('Generating leaderboard.png...');
    const lbOpts = {
        title: 'Global Top 5',
        entries: [
            { username: 'PlayerOne', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png', score: '9999 XP' },
            { username: 'PlayerTwo', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/1.png', score: '8888 XP' },
            { username: 'PlayerThree', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/2.png', score: '7777 XP' }
        ], theme: 'neon'
    };
    fs.writeFileSync(path.join(outDir, 'leaderboard.png'), await animafyClient.leaderboardCard(lbOpts));

    // Level Up
    console.log('Generating levelup.png...');
    const levelUpOpts = {
        username: 'DemonDevx', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
        oldLevel: 41, newLevel: 42, theme: 'neon'
    };
    fs.writeFileSync(path.join(outDir, 'levelup.png'), await animafyClient.levelUpCard(levelUpOpts));

    console.log('All samples generated successfully.');
    process.exit(0);
}

main().catch(console.error);

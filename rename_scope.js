const fs = require('fs');
const path = require('path');

function replaceScope(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (['node_modules', 'dist', '.git'].includes(file)) continue;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            replaceScope(fullPath);
        } else if (/\.(ts|js|json|md)$/i.test(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('@animafy/')) {
                console.log(`Updating scope in: ${fullPath}`);
                content = content.replace(/@animafy\//g, 'animafy-');
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

replaceScope(__dirname);
console.log('Finished renaming @animafy/ scopes to animafy-');

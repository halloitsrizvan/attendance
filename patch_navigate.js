const fs = require('fs');
const path = require('path');

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes('navigate') && content.includes('useRouter')) {
                // Replace navigate('/path') with navigate.push('/path')
                // Wait, use a regex that matches `navigate(` but ignores `navigate.push` or `navigate.back`
                // (?<!\.)navigate\(
                let modified = content.replace(/(?<!\.)\bnavigate\s*\(/g, 'navigate.push(');
                
                // Polyfill react-router's navigate(-1) if it existed
                modified = modified.replace(/navigate\.push\(\s*-1\s*\)/g, 'navigate.back()');
                
                if (modified !== content) {
                    fs.writeFileSync(fullPath, modified);
                    console.log(`Patched navigate in ${file}`);
                }
            }
        }
    }
}

processDir(path.join(__dirname, 'components'));
processDir(path.join(__dirname, 'app'));
console.log('Navigation patched');

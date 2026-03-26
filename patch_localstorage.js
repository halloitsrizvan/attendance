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
            
            if (content.includes('localStorage') && !content.includes('getSafeLocalStorage')) {
                // Add safe accessor
                const safeFn = `\nconst getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };\n`;
                
                // insert it after the imports
                const lines = content.split('\n');
                let lastImport = -1;
                for(let i=0; i<lines.length; i++){
                    if(lines[i].startsWith('import ')) lastImport = i;
                }
                
                lines.splice(lastImport + 1, 0, safeFn);
                content = lines.join('\n');

                // replace localStorage.
                content = content.replace(/localStorage\./g, 'getSafeLocalStorage().');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

processDir(path.join(__dirname, 'components'));
processDir(path.join(__dirname, 'app'));
console.log('localStorage patched!');

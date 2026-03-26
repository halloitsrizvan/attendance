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
            if (!content.includes('"use client"') && !content.includes("'use client'")) {
                content = '"use client";\n\n' + content;
            }
            // replace react-router-dom Link and useNavigate
            content = content.replace(/import\s+\{([^}]*useNavigate[^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, 'import { useRouter } from "next/navigation";');
            content = content.replace(/useNavigate\(\)/g, 'useRouter()');
            
            if (content.includes('react-router-dom') && content.includes('Link')) {
               content = content.replace(/import\s+\{([^}]*Link[^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, 'import Link from "next/link";');
               // also if it exported NavLink, we just replace with Link
               content = content.replace(/NavLink/g, 'Link');
            }
            // remove generic react-router-dom imports
            content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, '');
            fs.writeFileSync(fullPath, content);
        }
    }
}

processDir(path.join(__dirname, 'components'));
processDir(path.join(__dirname, 'context'));

// Merge CSS
try {
    let css = '';
    if (fs.existsSync('frontend/src/index.css')) {
        css += fs.readFileSync('frontend/src/index.css', 'utf8') + '\n';
    }
    if (fs.existsSync('frontend/src/App.css')) {
        css += fs.readFileSync('frontend/src/App.css', 'utf8') + '\n';
    }
    fs.mkdirSync('app', { recursive: true });
    fs.writeFileSync('app/globals.css', css);
    console.log("Components patched and globals.css created.");
} catch(e) {
    console.error("CSS merge failed:", e);
}

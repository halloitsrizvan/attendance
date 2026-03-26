const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages');
const appDir = path.join(__dirname, 'app');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

// Some custom mappings
const slugify = str => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace('.jsx', '').replace('.js', '');

files.forEach(file => {
   const originalPath = path.join(pagesDir, file);
   let content = fs.readFileSync(originalPath, 'utf8');

   // Transform react-router-dom to next/navigation
   content = content.replace(/import\s+\{([^}]*useNavigate[^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, 'import { useRouter } from "next/navigation";');
   content = content.replace(/useNavigate\(\)/g, 'useRouter()');
   
   // Replace Link from react-router-dom to next/link
   let hasReactRouter = content.includes('react-router-dom');
   if (hasReactRouter && content.includes('Link')) {
      content = content.replace(/import\s+\{([^}]*Link[^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, 'import Link from "next/link";');
   }

   // Always add "use client" as they are old React pages
   if (!content.includes('"use client"') && !content.includes("'use client'")) {
       content = `"use client";\n\n` + content;
   }

   let destDir = appDir;
   
   // Map Home to app/page.jsx
   if (file === 'Home.jsx' || file === 'Home.js') {
       destDir = appDir;
   } else {
       const slug = slugify(file);
       destDir = path.join(appDir, slug);
       fs.mkdirSync(destDir, { recursive: true });
   }

   fs.writeFileSync(path.join(destDir, 'page.jsx'), content);
});

// Also copy component files and add "use client" if they seem interactive, or just rely on the pages being client components initially
console.log("Pages migrated and react-router usages patched.");

const fs = require('fs');
const path = require('path');

const originalSrc = path.join(__dirname, '_frontend_backup', 'src');
const appDir = path.join(__dirname, 'app');

const routesMap = {
  'attendance/[id]': 'pages/Attendance.jsx',
  'class-wise': 'pages/ClassWIsePriv.jsx',
  'edit-attendance-classes': 'pages/EditClassPage.jsx',
  'edit-attendance/[id]': 'pages/EditAttedance.jsx', // Was misspelled in original
  'report': 'pages/ReportMain.jsx',
  'monthly-daily-report': 'components/report/DailyReport.jsx',
  'api-recall/[id]': 'pages/ApiRecall.jsx',
  'student': 'components/Students-portal/Name.jsx',
  'students-login': 'components/Students-portal/StudentLogin.jsx',
  'test': 'components/leave/FormTest.jsx',
  'leave': 'pages/LeaveMain.jsx',
  'leave-form': 'pages/LeaveFormMain.jsx',
  'leave-dashboard': 'pages/LeaveStatusMain.jsx',
  'minus-report': 'pages/MinusReport.jsx',
  'login': 'pages/Login.jsx',
  'signup': 'pages/Signup.jsx',
  '': 'pages/Home.jsx', // root
};

for (const [routePath, srcFile] of Object.entries(routesMap)) {
    const fullSourcePath = path.join(originalSrc, srcFile);
    if (!fs.existsSync(fullSourcePath)) continue;

    let content = fs.readFileSync(fullSourcePath, 'utf8');

    // 1. Add 'use client'
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
        content = '"use client";\n\n' + content;
    }

    // 2. React Router to Next Router
    content = content.replace(/import\s+\{([^}]*useNavigate[^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, 'import { useRouter } from "next/navigation";');
    content = content.replace(/useNavigate\(\)/g, 'useRouter()');
    
    if (content.includes('react-router-dom') && content.includes('Link')) {
        content = content.replace(/import\s+\{([^}]*Link[^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, 'import Link from "next/link";');
        content = content.replace(/NavLink/g, 'Link');
    }
    content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, ''); // remove any leftovers

    // 3. Patch Navigate invocations
    content = content.replace(/(?<!\.)\bnavigate\s*\(/g, 'navigate.push(');
    content = content.replace(/navigate\.push\(\s*-1\s*\)/g, 'navigate.back()');

    // 4. Safe Local Storage
    if (content.includes('localStorage') && !content.includes('getSafeLocalStorage')) {
        const safeFn = `\nconst getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };\n`;
        const lines = content.split('\n');
        let lastImport = -1;
        for(let i=0; i<lines.length; i++){ if(lines[i].startsWith('import ')) lastImport = i; }
        lines.splice(lastImport + 1, 0, safeFn);
        content = lines.join('\n');
        content = content.replace(/localStorage\./g, 'getSafeLocalStorage().');
    }

    // 5. Correct the 'useParams' from react-router to next/navigation's hook pattern
    // In React Router: const { id } = useParams()
    // In Next.js (params accessed via props or useParams):
    if (content.includes('useParams')) {
       let hasNextNav = content.includes('next/navigation');
       if (hasNextNav) {
           content = content.replace(/next\/navigation";?/, 'next/navigation";\nimport { useParams } from "next/navigation";');
       } else {
           content = `import { useParams } from "next/navigation";\n` + content;
       }
    }

    // Fix relative component imports since depth from root changed
    // E.g. original srcFile='pages/Attendance.jsx', routePath='attendance/[id]'. Time to fix `../components/`
    const originalDepth = srcFile.split('/').length - 1; // 1 for pages/Attendance.jsx
    const newDepth = routePath === '' ? 0 : routePath.split('/').length;
    
    // Depth difference dictates how to change `../` or `../../`
    // Convert all `../` to absolute aliases like `@/components/`!
    // But since Next.js jsconfig is root, we can just map `../components` to `@/components`
    // And `../../components` to `@/components`.
    content = content.replace(/\.\.\/\.\.\/components/g, '@/components');
    content = content.replace(/\.\.\/components/g, '@/components');
    content = content.replace(/\.\.\/\.\.\/Constants/g, '@/Constants');
    content = content.replace(/\.\.\/Constants/g, '@/Constants');

    // Create dest folder
    const destDir = path.join(appDir, routePath);
    fs.mkdirSync(destDir, { recursive: true });
    
    fs.writeFileSync(path.join(destDir, 'page.jsx'), content);
    console.log(`Mapped ${srcFile} -> /${routePath}`);
}
console.log("All routes explicitly mapped to App.js paths!");

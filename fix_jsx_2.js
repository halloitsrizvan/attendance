const fs = require('fs');
const path = 'c:/Users/Acer/coding/attendance/attendance/app/students-portal/page.jsx';
let content = fs.readFileSync(path, 'utf8').split('\n');

// Line 1468 is index 1467
// Line 1503 is index 1502
// Line 1504 is index 1503

content.splice(1503, 1); // Remove the extra )} at 1504

fs.writeFileSync(path, content.join('\n'));
console.log('Extra line removed');

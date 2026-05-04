const fs = require('fs');
const path = 'c:/Users/Acer/coding/attendance/attendance/app/students-portal/page.jsx';
let content = fs.readFileSync(path, 'utf8').split('\n');

// Line 1466 is index 1465
content[1465] = '                                                         </div>\n                                                     )}\n                                                     {(item.status === "returned" || item.returnedAt) && (() => {';

// Line 1501 is index 1500
content[1500] = '                                                     })()}';

fs.writeFileSync(path, content.join('\n'));
console.log('File updated successfully');

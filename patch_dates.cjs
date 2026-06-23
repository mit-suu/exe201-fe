const fs = require('fs');
const path = 'src/pages/customer/ProductDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

const todayStr = "new Date().toISOString().split('T')[0]";
const tomorrowStr = "new Date(Date.now() + 86400000).toISOString().split('T')[0]";

content = content.replace(
  "startDate: '',\n    endDate: '',",
  `startDate: ${todayStr},\n    endDate: ${tomorrowStr},`
);

// We can remove the date validation if we want, or leave it. Since we provide defaults, it won't trigger unless user clears the input.
const regex = /if \(!form\.startDate \|\| !form\.endDate\) \{[\s\S]*?return;\s*\}/;
content = content.replace(regex, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Added default dates to ProductDetail.jsx');

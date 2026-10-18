const fs = require('fs');
const path = require('path');
const root = 'C:/IEDB/STRAW Stack/apps/web';
for (const f of ['package.json', 'package-lock.json', 'tsconfig.json']) {
  try {
    JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
    console.log(f + ': OK');
  } catch (e) {
    console.log(f + ': FAIL ' + e.message);
  }
}

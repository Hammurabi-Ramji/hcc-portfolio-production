const fs = require('fs');
const path = require('path');
try {
  const h = fs.readFileSync(path.join(__dirname, 'assets', 'sue-host.exe'));
  const a = fs.readFileSync(path.join(__dirname, 'assets', 'sue-api.exe'));
  console.log('sue-host.exe size:', h.length);
  console.log('sue-api.exe size:', a.length);
  process.exit(0);
} catch(e) {
  console.error('FAILED:', e.message);
  process.exit(1);
}

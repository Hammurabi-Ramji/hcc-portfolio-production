const fs = require('fs');
const path = require('path');

const toastSrc = fs.readFileSync(
  path.join('C:/IEDB/STRAW Stack/apps/web/hooks/useToast.tsx'),
  'utf8'
);
const tw = fs.readFileSync(
  path.join('C:/IEDB/STRAW Stack/apps/web/tailwind.config.js'),
  'utf8'
);

const expected = {
  success: '#14532d',
  error: '#7f1d1d',
  warning: '#713f12',
  info: '#1e3a8a',
};

const missing = Object.entries(expected).filter(([, hex]) => !toastSrc.includes(hex));
const hooksGlob = tw.includes("./hooks/**/*.{js,ts,jsx,tsx,mdx}");
const whiteText = toastSrc.includes("color: '#ffffff'") || toastSrc.includes('color: "#ffffff"');

console.log('hooks_content_glob=' + hooksGlob);
console.log('white_foreground=' + whiteText);
for (const [name, hex] of Object.entries(expected)) {
  console.log(`variant_${name}=${toastSrc.includes(hex)} (${hex})`);
}
console.log('missing_variants=' + (missing.length ? missing.map(([n]) => n).join(',') : 'none'));

const distCandidates = ['.next-f003', '.next'].map((d) =>
  path.join('C:/IEDB/STRAW Stack/apps/web', d)
);
let cssHits = [];
for (const dist of distCandidates) {
  const staticCss = path.join(dist, 'static', 'css');
  if (!fs.existsSync(staticCss)) continue;
  for (const file of fs.readdirSync(staticCss).filter((f) => f.endsWith('.css'))) {
    const body = fs.readFileSync(path.join(staticCss, file), 'utf8');
    for (const [name, hex] of Object.entries(expected)) {
      if (body.toLowerCase().includes(hex.toLowerCase())) {
        cssHits.push(`${dist}/static/css/${file}:${name}`);
      }
    }
  }
}
console.log('built_css_hex_hits=' + (cssHits.length ? cssHits.join('|') : 'none (inline styles expected)'));
console.log('TOAST_INSPECT_OK=' + (missing.length === 0 && hooksGlob && whiteText));

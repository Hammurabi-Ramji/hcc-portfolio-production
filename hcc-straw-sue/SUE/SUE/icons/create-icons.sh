#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# QUICK ICON GENERATOR - PNG from Gradient
# Uses simple color fills (no ImageMagick required)
# ──────────────────────────────────────────────────────────────

echo "────────────────────────────────────────────────────────────"
echo "Creating SUE Icons"
echo "────────────────────────────────────────────────────────────"
echo ""

# Colors
BLUE="#2563eb"
PURPLE="#7c3aed"
WHITE="#ffffff"

# Create 16x16
echo "Creating 16x16 icon..."
cat > icons/icon16.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="16" height="16" fill="url(#g)" rx="3"/>
  <text x="8" y="11" text-anchor="middle" fill="white" font-family="Arial" font-size="7" font-weight="bold">HCC</text>
</svg>
EOF

# Create 48x48
echo "Creating 48x48 icon..."
cat > icons/icon48.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" fill="url(#g)" rx="8"/>
  <text x="24" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">HCC</text>
</svg>
EOF

# Create 128x128
echo "Creating 128x128 icon..."
cat > icons/icon128.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#g)" rx="16"/>
  <text x="64" y="78" text-anchor="middle" fill="white" font-family="Arial" font-size="40" font-weight="bold">HCC</text>
</svg>
EOF

echo ""
echo "✅ SVG icons created!"
echo ""
echo "These SVG files can be used directly in manifest.json:"
echo "  Chrome: ✓ Supports SVG"
echo "  Firefox: ✓ Supports SVG"
echo ""
echo "If you want PNG instead, you have 3 options:"
echo ""
echo "1. Online converter: https://cloudconvert.com/svg-to-png"
echo "2. ImageMagick (if installed):"
echo "   convert -density 300 icons/icon16.svg icons/icon16.png"
echo "3. Take screenshot from browser (right-click → Save as PNG)"
echo ""
echo "────────────────────────────────────────────────────────────"


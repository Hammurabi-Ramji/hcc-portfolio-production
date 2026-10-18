# ──────────────────────────────────────────────────────────────
# ICON GENERATION SCRIPT
# Generate HCC Icons for Browser Extension
# ──────────────────────────────────────────────────────────────

#!/usr/bin/env bash

# ──────────────────────────────────────────────────────────────
# PREREQUISITES
# ──────────────────────────────────────────────────────────────

# Install ImageMagick (if not already installed)
if ! command -v convert &> /dev/null; then
    echo "Installing ImageMagick..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y imagemagick
    elif [[ "$OSTYPE" == "msys" ]]; then
        choco install imagemagick
        echo "⚠️  Please restart your terminal after installation"
        exit 0
    else
        echo "⚠️  ImageMagick not found. Please install manually."
        echo "   macOS: brew install imagemagick"
        echo "   Linux: sudo apt-get install imagemagick"
        echo "   Windows: https://imagemagick.org/script/download.php"
        exit 1
    fi
fi

echo "✅ ImageMagick installed"

# ──────────────────────────────────────────────────────────────
# ICON SETTINGS
# ──────────────────────────────────────────────────────────────

# HCC Brand Colors (SUE-inspired)
GRADIENT_START="#2563eb"  # Primary Blue
GRADIENT_END="#7c3aed"    # Primary Purple
TEXT_COLOR="#ffffff"
FONT_SIZE_16=8
FONT_SIZE_48=14
FONT_SIZE_128=32
BACKGROUND="#0f172a"      # Deep Navy

echo ""
echo "────────────────────────────────────────────────────────────"
echo "SUE Icons"
echo "────────────────────────────────────────────────────────────"
echo "Creating icons with HCC branding..."
echo "Colors: $GRADIENT_START → $GRADIENT_END"
echo "────────────────────────────────────────────────────────────"

# ──────────────────────────────────────────────────────────────
# GENERATE 16x16 ICON
# ──────────────────────────────────────────────────────────────

echo ""
echo "Creating 16x16 icon..."

convert -size 16x16 xc:$BACKGROUND \
  -fill "url(#gradient)" \
  -draw "circle 8,8 8,0" \
  -font "DejaVu-Sans" \
  -pointsize $FONT_SIZE_16 \
  -fill $TEXT_COLOR \
  -gravity center \
  -annotate +0,+1 "HCC" \
  icons/icon16.png

# Create a more detailed version with border
convert -size 16x16 xc:$BACKGROUND \
  -draw "rectangle 0,0 15,15" \
  -fill $TEXT_COLOR \
  -pointsize $FONT_SIZE_16 \
  -gravity center \
  -annotate +0,+1 "HCC" \
  icons/icon16-detailed.png

echo "✅ 16x16 icons created"

# ──────────────────────────────────────────────────────────────
# GENERATE 48x48 ICON
# ──────────────────────────────────────────────────────────────

echo ""
echo "Creating 48x48 icon..."

convert -size 48x48 xc:$BACKGROUND \
  -fill "url(#gradient)" \
  -draw "circle 24,24 24,0" \
  -font "DejaVu-Sans" \
  -pointsize $FONT_SIZE_48 \
  -fill $TEXT_COLOR \
  -gravity center \
  -annotate +0,0 "HCC" \
  icons/icon48.png

# Create a more detailed version with border and gradient
convert -size 48x48 xc:$BACKGROUND \
  -draw "rectangle 2,2 46,46" \
  -fill $TEXT_COLOR \
  -pointsize $FONT_SIZE_48 \
  -gravity center \
  -annotate +0,0 "HCC" \
  icons/icon48-detailed.png

echo "✅ 48x48 icons created"

# ──────────────────────────────────────────────────────────────
# GENERATE 128x128 ICON
# ──────────────────────────────────────────────────────────────

echo ""
echo "Creating 128x128 icon..."

convert -size 128x128 xc:$BACKGROUND \
  -fill "url(#gradient)" \
  -draw "circle 64,64 64,0" \
  -font "DejaVu-Sans" \
  -pointsize $FONT_SIZE_128 \
  -fill $TEXT_COLOR \
  -gravity center \
  -annotate +0,+2 "HCC" \
  icons/icon128.png

# Create a more detailed version with rounded corners
convert -size 128x128 xc:$BACKGROUND \
  -draw "rounded-rectangle 4,4 124,124 10,10" \
  -fill $TEXT_COLOR \
  -pointsize $FONT_SIZE_128 \
  -gravity center \
  -annotate +0,+2 "HCC" \
  icons/icon128-rounded.png

echo "✅ 128x128 icons created"

# ──────────────────────────────────────────────────────────────
# GENERATE SVG VECTORS (for scalability)
# ──────────────────────────────────────────────────────────────

echo ""
echo "Creating SVG vector icons..."

# SVG 16x16
cat > icons/icon16.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="16" height="16" fill="url(#gradient)" rx="3"/>
  <text x="8" y="11" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">HCC</text>
</svg>
EOF

# SVG 48x48
cat > icons/icon48.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="48" height="48" fill="url(#gradient)" rx="8"/>
  <text x="24" y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">HCC</text>
</svg>
EOF

# SVG 128x128
cat > icons/icon128.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#gradient)" rx="16"/>
  <text x="64" y="78" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="40" font-weight="bold">HCC</text>
</svg>
EOF

echo "✅ SVG icons created"

# ──────────────────────────────────────────────────────────────
# CONVERT SVG TO PNG (if ImageMagick supports it)
# ──────────────────────────────────────────────────────────────

if command -v rsvg-convert &> /dev/null || convert --version | grep -q "ImageMagick"; then
    echo ""
    echo "Converting SVG to PNG..."
    
    convert -density 300 icons/icon16.svg icons/icon16.png
    convert -density 300 icons/icon48.svg icons/icon48.png
    convert -density 300 icons/icon128.svg icons/icon128.png
    
    echo "✅ PNG icons from SVG created"
else
    echo ""
    echo "⚠️  SVG conversion skipped. Using existing PNGs or create manually."
fi

# ──────────────────────────────────────────────────────────────
# ALTERNATIVE: CREATE WITH CSS/HTML (for browser-based generation)
# ──────────────────────────────────────────────────────────────

echo ""
echo "────────────────────────────────────────────────────────────"
echo "ALTERNATIVE: Generate icons via HTML/CSS"
echo "────────────────────────────────────────────────────────────"
echo ""
echo "If ImageMagick fails, create icons manually:"
echo ""
echo "1. Save this HTML file as 'generate-icons.html':"
echo ""
echo "   <!DOCTYPE html>"
echo "   <html>"
echo "   <body>"
echo "     <div style='width:16px;height:16px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;text-align:center;font-size:8px;display:flex;align-items:center;justify-content:center;border-radius:3px;'>HCC</div>"
echo "     <div style='width:48px;height:48px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;text-align:center;font-size:16px;display:flex;align-items:center;justify-content:center;border-radius:8px;'>HCC</div>"
echo "     <div style='width:128px;height:128px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;text-align:center;font-size:40px;display:flex;align-items:center;justify-content:center;border-radius:16px;'>HCC</div>"
echo "   </body>"
echo "   </html>"
echo ""
echo "2. Open in browser and take screenshots"
echo ""
echo "────────────────────────────────────────────────────────────"

# ──────────────────────────────────────────────────────────────
# FINAL STATUS
# ──────────────────────────────────────────────────────────────

echo ""
echo "────────────────────────────────────────────────────────────"
echo "Icons Generated Successfully!"
echo "────────────────────────────────────────────────────────────"
echo "Files created:"
ls -lh icons/

echo ""
echo "Next step: Reload extension in browser"
echo "Chrome: chrome://extensions → Reload icon"
echo "────────────────────────────────────────────────────────────"


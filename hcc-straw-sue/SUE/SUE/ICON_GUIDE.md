# ──────────────────────────────────────────────────────────────
# SUE - ICON GUIDE
# Generate or download icons for your extension
# ──────────────────────────────────────────────────────────────

## CURRENT ICONS (SVG)

I've created 3 SVG icons with your brand colors:

| Icon | File | Size | Description |
|------|------|------|-------------|
| 📦 Small | `icon16.svg` | 16x16 | Browser toolbar icon |
| 📦 Medium | `icon48.svg` | 48x48 | Extension details |
| 📦 Large | `icon128.svg` | 128x128 | Web store listing |

**Design:**
- Gradient background: #2563eb (blue) → #7c3aed (purple)
- White "HCC" text centered
- Rounded corners (3px, 8px, 16px respectively)
- Scalable vector format

## OPTION 1: Convert SVG to PNG (Recommended)

If you have ImageMagick installed:

```bash
cd /SUE/sue/icons
convert -density 300 icon16.svg icon16.png
convert -density 300 icon48.svg icon48.png
convert -density 300 icon128.svg icon128.png
```

If you don't have ImageMagick, use one of these alternatives:

### Alternative A: Online Converter
1. Go to: https://cloudconvert.com/svg-to-png
2. Upload `icon16.svg` → Convert → Download
3. Repeat for `icon48.svg` and `icon128.svg`

### Alternative B: Browser DevTools
1. Open Chrome DevTools (F12)
2. Create a new element:
   ```html
   <div style="
     width: 16px; height: 16px;
     background: linear-gradient(135deg, #2563eb, #7c3aed);
     color: white;
     text-align: center;
     line-height: 16px;
     font-size: 8px;
     font-weight: bold;
     border-radius: 3px;
   ">HCC</div>
   ```
3. Screenshot at 3x resolution
4. Save as `icon16.png`
5. Repeat for 48x48 and 128x128

### Alternative C: Use Existing PNGs (If You Have SUE_App.PNG)
If you have your SUE_App.PNG file, you can:
1. Extract the HCC logo/text from it
2. Crop to square format
3. Save as PNG files in the icons folder

## OPTION 2: Use Placeholder Icons

For immediate testing, I've created simple placeholder icons:

```bash
# Create placeholder PNGs (requires Python)
python3 << 'EOF'
from PIL import Image, ImageDraw, ImageFont

# Try to use a system font, otherwise fallback
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
except:
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        font = ImageFont.load_default()

for size, padding, font_size in [(16, 3, 8), (48, 8, 16), (128, 16, 40)]:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient-like background (solid for simplicity)
    draw.rectangle([0, 0, size-1, size-1], fill=(37, 99, 235, 255))
    draw.rectangle([0, 0, size-1, size-1], fill=(124, 58, 237, 255))
    
    # Add text
    draw.text((size//2, size//2), "HCC", fill=(255, 255, 255, 255), font=font, anchor="mm")
    img.save(f'icons/icon{size}.png')
    print(f"Created icon{size}.png")
EOF
```

## OPTION 3: Download from HCC Branding

If you have official HCC branding assets:

1. Replace the SVG files in `/SUE/sue/icons/`
2. Ensure they're square (16x16, 48x48, 128x128)
3. Update `manifest.json` if filenames differ

```json
{
  "icons": {
    "16": "icons/my-logo-16.png",
    "48": "icons/my-logo-48.png",
    "128": "icons/my-logo-128.png"
  }
}
```

## RECOMMENDED: Use SVG Directly

Chrome and Firefox support SVG icons natively! You can use the SVG files directly:

1. Keep the `.svg` files as-is
2. No conversion needed
3. Scalable and crisp at any size

Just make sure your `manifest.json` points to `.svg` files:

```json
{
  "icons": {
    "16": "icons/icon16.svg",
    "48": "icons/icon48.svg",
    "128": "icons/icon128.svg"
  }
}
```

## CUSTOMIZATION TIPS

### Change Colors
Edit `THEME.md` and update the gradient:

```css
--accent-blue: #2563eb;  /* Change this */
--accent-purple: #7c3aed; /* Change this */
```

### Add Logo Image
If you have a logo PNG/SVG:

```bash
# Copy your logo to icons folder
cp /path/to/your-logo.png icons/

# Update manifest.json
{
  "icons": {
    "16": "icons/your-logo-16.png",
    "48": "icons/your-logo-48.png",
    "128": "icons/your-logo-128.png"
  }
}
```

### Add App Icon Variants
Create different styles for different views:

- `icon16-sidebar.svg` - Simplified version for sidebar
- `icon48-toolbar.svg` - Detailed version for toolbar
- `icon128-store.svg` - High-res for web store

---

*Icon guide | R.K. Girdhari | Hammurabi Coding Company*


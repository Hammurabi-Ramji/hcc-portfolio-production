# ──────────────────────────────────────────────────────────────
# SUE EXTENSION — THEME CONFIGURATION
# Based on SUE App Theme
# ──────────────────────────────────────────────────────────────

## COLOR PALETTE (Derived from SUE App)

### Primary Brand Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #2563eb | Brand accents, buttons, links |
| Primary Purple | #7c3aed | AI features, special items |
| Success Green | #16a34a | Status badges, success states |
| Warning Amber | #d97706 | Warnings, pending states |
| Alert Red | #dc2626 | Errors, delete actions |

### Background Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Deep Navy | #0f172a | Main background |
| Dark Slate | #1e293b | Cards, panels |
| Medium Slate | #334155 | Borders, dividers |
| Light Slate | #475569 | Secondary text, muted |

### Text Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Pure White | #ffffff | Primary text |
| Light Gray | #e2e8f0 | Secondary text |
| Muted Gray | #94a3b8 | Tertiary text |
| Dark Muted | #64748b | Disabled text |

### Accent Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Cyan Accent | #0891b2 | Info states, hover |
| Pink Accent | #db2777 | AI chat bubbles |
| Gold Accent | #f59e0b | Premium features |

## ICON DESIGN SPECIFICATIONS

### Icon Style
- **Shape**: Rounded rectangles with 8px radius
- **Stroke**: 2px, using brand colors
- **Fill**: Transparent with brand color background
- **Size**: 16x16, 48x48, 128x128 (with padding)
- **Font**: Inter or system font for "HCC" text
- **Padding**: 4px internal padding for 16x16, 8px for 48x48

### Icon Variants

#### 1. Primary Icon (Logo)
- Background: Linear gradient (#2563eb → #7c3aed)
- Text: "HCC" in white, centered
- Border: 2px white stroke

#### 2. Dashboard Icon
- Background: #16a34a (green)
- Icon: Simple bar chart (3 bars)
- Style: Minimal, clean

#### 3. AI Chat Icon
- Background: #7c3aed (purple)
- Icon: Chat bubble with sparkle
- Style: Friendly, modern

#### 4. Projects Icon
- Background: #2563eb (blue)
- Icon: Folder outline
- Style: Professional, organized

#### 5. Cloud Icon
- Background: #0891b2 (cyan)
- Icon: Cloud outline
- Style: Light, airy

### Icon Generation Script

```bash
#!/usr/bin/env bash
# Generate icons from template

# 16x16 icon
convert -size 16x16 xc:transparent \
  -fill "url(#gradient)" -draw "rectangle 0,0 15,15" \
  -fill white -gravity center -pointsize 8 \
  -annotate +0,0 "HCC" \
  icons/icon16.png

# 48x48 icon
convert -size 48x48 xc:transparent \
  -fill "url(#gradient)" -draw "rectangle 0,0 47,47" \
  -fill white -gravity center -pointsize 14 \
  -annotate +0,0 "HCC" \
  icons/icon48.png

# 128x128 icon (for web store)
convert -size 128x128 xc:transparent \
  -fill "url(#gradient)" -draw "rectangle 0,0 127,127" \
  -fill white -gravity center -pointsize 32 \
  -annotate +0,0 "HCC" \
  icons/icon128.png
```

## CUSTOMIZATION GUIDE

### Change Brand Colors
Edit `styles.css` → `:root` section:
```css
:root {
  --bg-primary: #0f172a;      /* SUE Deep Navy */
  --bg-secondary: #1e293b;    /* SUE Dark Slate */
  --accent-blue: #2563eb;     /* SUE Primary Blue */
  --accent-purple: #7c3aed;   /* SUE Primary Purple */
}
```

### Change Accent Gradient
Edit `styles.css`:
```css
.sue-header {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}
```

### Update Icon Colors
Edit `manifest.json`:
```json
{
  "icons": {
    "16": "icons/icon16-gradient.png",  // Gradient version
    "48": "icons/icon48-gradient.png",
    "128": "icons/icon128-gradient.png"
  }
}
```

### Theme Variants

#### Light Mode (Alternative)
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --accent-blue: #3b82f6;
}
```

#### Dark Mode (Enhanced)
```css
:root {
  --bg-primary: #020617;
  --bg-secondary: #0f172a;
  --accent-blue: #3b82f6;
  --accent-purple: #8b5cf6;
}
```

---

*Theme configured for SUE App integration | R.K. Girdhari*


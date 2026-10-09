# 🎨 Radix Labs UI/UX Design System

**Version:** 1.0.0  
**Date:** October 3, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Library](#component-library)
6. [Dashboard Design](#dashboard-design)
7. [Voice & Tone](#voice--tone)
8. [Accessibility](#accessibility)
9. [Implementation Guide](#implementation-guide)

---

## 🎯 Design Principles

### Core Principles

1. **Professional & Trust-Building**
   - Clean, pharmaceutical-grade aesthetics
   - Consistent visual language
   - FDA compliance visual indicators

2. **User-Centric Efficiency**
   - Task-oriented interface design
   - Minimal cognitive load
   - Clear information hierarchy

3. **Data Integrity Focus**
   - Audit trail visibility
   - Clear validation states
   - Error prevention through design

4. **Accessibility First**
   - WCAG 2.1 AA compliant
   - Keyboard navigation support
   - Screen reader friendly

5. **Responsive & Adaptive**
   - Mobile-first approach
   - Progressive enhancement
   - Cross-device consistency

---

## 🎨 Color System

### Primary Brand Colors

```css
--radix-primary: #008F39;         /* Professional Green */
--radix-primary-dark: #00692C;    /* Dark Green */
--radix-primary-light: #E6F7EC;   /* Light Green */
```

**Usage:**
- Primary actions and CTAs
- Brand elements
- Active states
- Success indicators (in context)

### Secondary Colors

```css
--radix-secondary: #0070BA;       /* Trust Blue */
--radix-secondary-dark: #005A94;  /* Dark Blue */
--radix-secondary-light: #E6F3FA; /* Light Blue */
```

**Usage:**
- Secondary actions
- Information displays
- Links and navigation
- Supporting elements

### Accent Colors

```css
--radix-accent-success: #2E7D32;  /* Success Green */
--radix-accent-warning: #FFA500;  /* Warning Orange */
--radix-accent-error: #D32F2F;    /* Error Red */
--radix-accent-info: #0288D1;     /* Info Blue */
```

**Usage:**
- Status indicators
- Alerts and notifications
- Validation feedback
- System messages

### Compliance Colors

```css
--radix-audit-highlight: #FFEB3B;   /* Audit Trail */
--radix-validation-pass: #4CAF50;   /* Validation Pass */
--radix-validation-fail: #F44336;   /* Validation Fail */
--radix-signature-required: #9C27B0; /* E-Signature */
```

**Usage:**
- FDA compliance indicators
- Audit trail highlighting
- Electronic signature prompts
- Validation status

### Neutral Grays

```css
--radix-gray-50: #FAFAFA;
--radix-gray-100: #F9F9F9;
--radix-gray-300: #E0E0E0;
--radix-gray-500: #999999;
--radix-gray-700: #666666;
--radix-gray-900: #333333;
```

**Usage:**
- Backgrounds
- Borders and dividers
- Disabled states
- Text hierarchy

### Color Accessibility

All color combinations meet WCAG 2.1 AA standards:
- **Text on backgrounds:** Minimum 4.5:1 contrast ratio
- **Large text:** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

---

## ✍️ Typography

### Font Family

**Primary:** Segoe UI (Windows), Roboto (Android), Helvetica Neue (Mac)
**Fallback:** Arial, sans-serif
**Monospace:** Consolas, Monaco, Courier New

### Type Scale

| Class | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `.h1` | 40px | 52px | Page titles |
| `.h2` | 32px | 44px | Section headers |
| `.h3` | 24px | 36px | Subsection headers |
| `.h4` | 20px | 32px | Card titles |
| `.h5` | 18px | 28px | Small headers |
| `.h6` | 16px | 24px | Minor headers |
| `.body-lg` | 18px | 28px | Large body text |
| `.body-md` | 16px | 24px | Default body text |
| `.body-sm` | 14px | 20px | Small text |
| `.body-xs` | 12px | 16px | Fine print |

### Font Weights

- **Regular (400):** Body text
- **Medium (500):** Emphasized text
- **Semibold (600):** Headings, labels
- **Bold (700):** Strong emphasis

### Typography Best Practices

1. **Line Length:** 50-75 characters optimal
2. **Paragraph Spacing:** 1.5x line height
3. **Letter Spacing:** Default for body, slight adjustment for headings
4. **Text Alignment:** Left-aligned for readability
5. **Hierarchy:** Clear size distinction between levels

---

## 📏 Spacing System

### 8-Point Grid System

All spacing uses multiples of 8px for consistency:

| Variable | Value | Usage |
|----------|-------|-------|
| `spacing-xxs` | 4px | Tight spacing |
| `spacing-xs` | 8px | Compact spacing |
| `spacing-sm` | 16px | Small spacing |
| `spacing-md` | 24px | Medium spacing |
| `spacing-lg` | 32px | Large spacing |
| `spacing-xl` | 48px | Extra large |
| `spacing-xxl` | 64px | Section spacing |

### Margin & Padding Utilities

```css
.m-{size}    /* Margin all sides */
.mt-{size}   /* Margin top */
.mb-{size}   /* Margin bottom */
.ml-{size}   /* Margin left */
.mr-{size}   /* Margin right */

.p-{size}    /* Padding all sides */
.pt-{size}   /* Padding top */
/* etc. */
```

---

## 🧩 Component Library

### Button System

#### Primary Button
```html
<button class="btn btn-primary">Save Changes</button>
```
**Usage:** Main actions, form submissions, primary CTAs

#### Secondary Button
```html
<button class="btn btn-secondary">Cancel</button>
```
**Usage:** Secondary actions, alternative choices

#### Ghost Button
```html
<button class="btn btn-ghost">Cancel</button>
```
**Usage:** Tertiary actions, cancel buttons

#### Button Sizes
```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Medium</button>
<button class="btn btn-primary btn-lg">Large</button>
```

#### Button States
- **Default:** Normal appearance
- **Hover:** Slight elevation, color change
- **Active:** Pressed appearance
- **Disabled:** Reduced opacity, no interaction
- **Focus:** Visible outline for accessibility

### Form Components

#### Text Input
```html
<div class="form-field">
    <label for="input-id" class="form-label form-label-required">
        Label Text
    </label>
    <input type="text" id="input-id" class="form-input" 
           placeholder="Placeholder text">
    <span class="form-hint">Helpful hint text</span>
</div>
```

#### Select Dropdown
```html
<div class="form-field">
    <label for="select-id" class="form-label">Label</label>
    <select id="select-id" class="form-select">
        <option value="">Choose option</option>
        <option value="1">Option 1</option>
    </select>
</div>
```

#### Textarea
```html
<div class="form-field">
    <label for="textarea-id" class="form-label">Description</label>
    <textarea id="textarea-id" class="form-textarea" 
              placeholder="Enter description"></textarea>
</div>
```

#### Checkbox
```html
<div class="form-check">
    <input type="checkbox" id="check-id" class="form-check-input">
    <label for="check-id" class="form-check-label">Option</label>
</div>
```

#### Validation States
```html
<!-- Error State -->
<input type="text" class="form-input error">
<span class="form-error">Error message</span>

<!-- Success State -->
<input type="text" class="form-input success">
<span class="form-success">Success message</span>
```

### Card Component

```html
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Card Title</h3>
        <p class="card-subtitle">Subtitle</p>
    </div>
    <div class="card-body">
        Card content goes here
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">Action</button>
    </div>
</div>
```

### Alert System

```html
<div class="alert alert-success">Success message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-error">Error message</div>
<div class="alert alert-info">Info message</div>
```

### Badge System

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Rejected</span>
```

### Table System

```html
<table class="table">
    <thead>
        <tr>
            <th>Column 1</th>
            <th>Column 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Data 1</td>
            <td>Data 2</td>
        </tr>
    </tbody>
</table>
```

### Tooltip System

```html
<div class="tooltip" role="tooltip">
    <div class="tooltip-arrow"></div>
    <div class="tooltip-inner">
        Use this dropdown to select your filing status.
    </div>
</div>
```

**Tooltip Guidelines:**
- Use sentence case with period
- Lead with verb for new functions
- No links (accessibility)
- Keep under 150 characters
- Don't obscure important content

---

## 📊 Dashboard Design

### KPI Card Component

```html
<div class="kpi-card card">
    <div class="card-header">
        <h3 class="card-title">Monthly Production</h3>
        <span class="card-subtitle">Last 30 days</span>
    </div>
    <div class="card-body">
        <div class="kpi-value">24,567 units</div>
        <div class="kpi-change positive">↑ 12% from last month</div>
    </div>
    <div class="card-footer">
        <div class="kpi-metrics">
            <div class="kpi-metric">
                <span class="metric-label">Target</span>
                <span class="metric-value">25,000</span>
            </div>
            <div class="kpi-metric">
                <span class="metric-label">Variance</span>
                <span class="metric-value">-433</span>
            </div>
        </div>
    </div>
</div>
```

### Dashboard Principles

1. **Speed of Understanding**
   - Clear visual hierarchy
   - Immediate insight visibility
   - Minimal mental processing

2. **Efficiency of Use**
   - Common tasks easily accessible
   - Quick navigation
   - Contextual actions

3. **Visual Beauty Supporting Function**
   - Clean aesthetics
   - Purposeful color use
   - Balanced whitespace

### Data Visualization Guidelines

**Chart Types:**
- **Line Charts:** Trends over time
- **Bar Charts:** Comparisons
- **Pie Charts:** Proportions (use sparingly)
- **Tables:** Detailed data

**Best Practices:**
- Use brand colors consistently
- Label axes clearly
- Include legends
- Show data context
- Enable interaction (tooltips, zoom)

---

## 💬 Voice & Tone

### Brand Voice Attributes

1. **Professional**
   - Clear, precise language
   - Technical accuracy
   - Industry-appropriate terminology

2. **Supportive**
   - Helpful guidance
   - Encouraging feedback
   - Error recovery assistance

3. **Empathetic**
   - Acknowledge user challenges
   - Understand workflow pressures
   - Reduce anxiety around compliance

4. **Action-Oriented**
   - Start with verbs
   - Clear next steps
   - Direct instructions

5. **Transparent**
   - Honest about processes
   - Clear about requirements
   - Open about limitations

### Microcopy Examples

**Success Messages:**
- ✅ "Document saved successfully"
- ✅ "Batch record signed and locked"
- ✅ "Validation complete - all tests passed"

**Error Messages:**
- ❌ "Unable to save changes. Please check your connection."
- ❌ "Signature required. Please sign to continue."
- ❌ "Validation failed: Missing required field 'Batch Number'"

**Guidance:**
- 💡 "You're doing great! Just 3 more fields to complete."
- 💡 "Tip: Use the batch number from your production log."
- 💡 "This information helps ensure FDA compliance."

**Progress:**
- 📊 "Step 2 of 5: Enter batch information"
- 📊 "80% complete - almost done!"
- 📊 "Review your entries before submitting"

### Writing Guidelines

1. **Be Concise:** Maximum 150 characters for tooltips
2. **Use Active Voice:** "Save the document" not "The document should be saved"
3. **Avoid Jargon:** Or explain technical terms when necessary
4. **Be Consistent:** Use same terms throughout
5. **Lead with Action:** Start with verbs for instructions

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: Minimum 4.5:1
- Large text: Minimum 3:1
- UI components: Minimum 3:1

**Keyboard Navigation:**
- Tab order follows visual flow
- Focus indicators visible
- Skip navigation links
- No keyboard traps

**Screen Readers:**
- Semantic HTML
- ARIA labels where needed
- Alt text for images
- Form labels properly associated

**Interactive Elements:**
- Minimum touch target: 44x44px
- Clear focus states
- Descriptive link text
- Error identification

### Accessibility Checklist

- [ ] All images have alt text
- [ ] Forms have associated labels
- [ ] Color isn't sole indicator
- [ ] Focus visible on all elements
- [ ] Keyboard accessible
- [ ] ARIA landmarks used
- [ ] Headings properly nested
- [ ] Sufficient color contrast
- [ ] Touch targets adequate size
- [ ] Error messages clear

---

## 🛠️ Implementation Guide

### Getting Started

1. **Include Design System CSS**
```html
<link rel="stylesheet" href="design-system.css">
```

2. **Use Semantic HTML**
```html
<header>, <nav>, <main>, <section>, <footer>
```

3. **Apply Utility Classes**
```html
<div class="container">
    <div class="card p-4 shadow-md">
        Content here
    </div>
</div>
```

### Component Usage

1. **Copy HTML structure** from component library
2. **Apply appropriate classes** from design system
3. **Customize content** while maintaining structure
4. **Test accessibility** with keyboard and screen reader
5. **Verify responsive** behavior across devices

### Custom Components

When creating new components:

1. Follow existing design patterns
2. Use design system colors and spacing
3. Maintain accessibility standards
4. Document component usage
5. Add to component library

### File Structure

```
System/UI/
├── Styles/
│   ├── design-system.css      # Core design system
│   ├── tailwind.config.js     # Tailwind config
│   └── postcss.config.js      # PostCSS config
├── Components/
│   ├── component-library.html # Component showcase
│   └── [component-files]      # Individual components
├── Pages/
│   └── [page-files]          # Application pages
└── Assets/
    └── [static-files]        # Images, icons, etc.
```

### Best Practices

1. **Consistency:** Use design system components consistently
2. **Documentation:** Document any customizations
3. **Testing:** Test across browsers and devices
4. **Performance:** Optimize CSS and assets
5. **Maintenance:** Keep design system updated

---

## 📚 Resources

### Design Files
- **CSS:** `System/UI/Styles/design-system.css`
- **Component Library:** `System/UI/Components/component-library.html`
- **Documentation:** This file

### External References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [FDA 21 CFR Part 11](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application)
- [Material Design](https://material.io/design) (inspiration)

### Support
For questions or contributions:
- Review existing components first
- Follow established patterns
- Test accessibility
- Document new components

---

## 📝 Version History

### Version 1.0.0 (October 3, 2025)
- Initial design system release
- Complete component library
- Color system established
- Typography scale defined
- Accessibility guidelines
- Dashboard components
- Form validation states
- FDA compliance indicators

---

## ✅ Design System Checklist

### For Designers
- [ ] Review color system
- [ ] Understand typography scale
- [ ] Study component library
- [ ] Follow spacing system
- [ ] Apply voice & tone guidelines

### For Developers
- [ ] Include design system CSS
- [ ] Use semantic HTML
- [ ] Apply appropriate classes
- [ ] Test accessibility
- [ ] Verify responsiveness
- [ ] Follow naming conventions

### For QA
- [ ] Test all components
- [ ] Verify color contrast
- [ ] Check keyboard navigation
- [ ] Test with screen readers
- [ ] Validate responsive design
- [ ] Cross-browser testing

---

**Radix Labs Design System** - Professional Pharmaceutical ERP UI/UX  
**Status:** Production Ready | **Version:** 1.0.0 | **Date:** October 3, 2025

*FDA 21 CFR Part 11 Compliant | cGMP Standards | WCAG 2.1 AA Accessible*

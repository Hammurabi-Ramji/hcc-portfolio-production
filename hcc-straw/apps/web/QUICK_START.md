# Quick Start Guide - AUTARCH Web Platform

This guide runs the quarantined legacy Next.js tree in `apps/web`. It is outside the sovereign STRAW/Eduba path and is not the STRAW or Eduba build. Eduba (`straw-app/crates/eduba-ledger`, `straw-app/crates/eduba-server`) is the append-only SQLite archival ledger via sqlx, not a school. The sovereign desktop is Trunk, Tauri 2, and pure Rust, with Axum on `127.0.0.1`. From `straw-app/`, use `trunk build`, `cargo tauri build`, and `cargo test --workspace --offline --locked`. The `npm` commands below apply only after `cd apps/web`.

## 🚀 Getting Started in 5 Minutes

### Step 1: Navigate to the Project
```bash
cd apps/web
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages including:
- next@15.1.8
- react & react-dom
- axios
- tailwindcss
- typescript
- react-hook-form
- zod
- zustand
- @tanstack/react-query
- lucide-react
- clsx & tailwind-merge
- date-fns

### Step 3: Configure Environment
From `apps/web`, copy the template that lives in this folder:

```bash
copy .env.example .env.local
```

The template sets `NEXT_PUBLIC_APP_URL`, `STRAW_API_PORT`, and `STRAW_WEB_ORIGIN`. Start `apps/api` with `cargo run --offline --locked` before exercising login. There is no `../.env.example`.

### Step 4: Start Development Server
```bash
npm run dev
```

Your app will start at `http://localhost:3000`

### Step 5: Open Your Browser
Navigate to:
- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Signup**: http://localhost:3000/signup
- **Dashboard**: http://localhost:3000/dashboard
- **Docs**: http://localhost:3000/docs

---

## 📖 What You'll See

### Home Page
- Hero section with call-to-action buttons
- Feature cards showcasing platform capabilities
- Footer with navigation links

### Login Page
- Email & password form
- Social login buttons (GitHub, Google)
- Remember me & forgot password links

### Signup Page
- Registration form with validation
- Username, email, password fields
- Terms & conditions checkbox

### Dashboard
- Sidebar navigation
- User profile section
- Stats cards
- Recent activity feed
- Quick action buttons

### Docs Page
- Table of contents
- Getting started guide
- Architecture overview
- Quick links

---

## 🛠️ Available Scripts

```bash
# From apps/web only — these are the declared package scripts
npm run dev          # Start Next on http://localhost:3000
npm run build        # Production build
npm start            # Serve the production build
npm run lint         # ESLint via next lint
npm run type-check   # tsc --noEmit

# Legacy API (separate terminal, from apps/api — not an npm script here)
cargo run --offline --locked
```

There is no `npm run format`, Docker, or database script in this package. Prettier config exists for editors only.

---

## Docker

Docker Compose is not part of this legacy tree. There is no `npm run docker:up` script here, and Docker is not how to build or run Eduba or the desktop. Start this tree with `cd apps/web` and `npm run dev`. Start the legacy API from `apps/api` with `cargo run --offline --locked` on `127.0.0.1:3001`.

---

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize your color scheme:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    }
  }
}
```

### Components
- Modify `components/Navbar.tsx` for navigation
- Update `components/Footer.tsx` for footer
- Customize `app/page.tsx` for home page

### Styles
- Global styles: `app/globals.css`
- Component classes: Tailwind utility classes

---

## 🔍 Troubleshooting

### Port 3000 Already in Use
```bash
# Change the Next port in package.json scripts. Leave 3001 for the legacy API.
"dev": "next dev -p 3002"
```

### Dependencies Installation Fails
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Run type check
npm run type-check

# Fix common issues
npm run lint
```

---

## 📚 Learn More

- [README.md](./README.md) - Full documentation
- [WEB_PLATFORM_SUMMARY.md](../../output/WEB_PLATFORM_SUMMARY.md) - Implementation details
- `/docs` - In-app documentation

---

## 🆘 Need Help?

1. Check the error message in your terminal
2. Review the [README.md](./README.md)
3. Inspect the component code for examples
4. Look at the `app/` directory for page patterns

---

These steps run the legacy Next.js tree from `apps/web`. They do not build Eduba or the desktop.

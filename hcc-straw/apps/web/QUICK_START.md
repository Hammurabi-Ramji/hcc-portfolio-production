# Quick Start Guide - AUTARCH Web Platform

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
# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Check code quality
npm run format       # Format code with Prettier

# Type Checking
npm run type-check   # Run TypeScript compiler
```

---

## 🐳 Docker Support (Optional)

If you want to use Docker:

```bash
# From root directory
cd C:\hcc-straw\hcc-straw
npm run docker:up    # Start all containers
npm run docker:down  # Stop containers
npm run docker:logs  # View logs
```

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
# Change port in package.json scripts
"dev": "next dev -p 3001"
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

**Ready to build amazing apps!** 🚀

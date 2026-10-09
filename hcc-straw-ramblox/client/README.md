# Next.js 15 + SQLite

This is a [Next.js 15](https://nextjs.org) client for Ramblox's local-first SQLite backend.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- SQLite database file (created automatically)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hammurabi-coding-company/ramblox.git
cd ramblox
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your local database settings if you want to override the defaults:
```env
SQLITE_PATH=../data/ramblox.db
```

4. Set up the local database:
- Run `pnpm setup-db`
- Or let the first server request initialize the schema automatically

5. Start the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
ramblox/
├── client/              # Next.js frontend
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   ├── lib/           # Utilities and API clients
│   └── public/        # Static assets
├── server/             # API routes and backend logic
│   ├── auth.ts        # Authentication handlers
│   ├── games.ts       # Game CRUD operations
│   ├── monetization.ts # Revenue tracking
│   └── analytics.ts   # Event tracking
├── scripts/            # Script templates
│   └── templates.js   # Roblox script snippets
├── docs/               # Documentation
└── shared/             # Shared types and utilities
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - TypeScript type checking

## Technologies Used

- **Next.js 15** - React framework with App Router
- **better-sqlite3** - local-first database storage
- **Zod** - TypeScript-first schema validation
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Lucide Icons** - Beautiful icon library

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License © Hammurabi Coding Company

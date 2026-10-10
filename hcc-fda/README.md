# hcc-fda - FDA Compliance Platform

## Overview
Comprehensive platform for managing FDA regulatory compliance, documentation, and quality assurance for medical devices and pharmaceuticals.

## Features

### Core Capabilities
- **Regulatory Submissions**: 510(k), PMA, De Novo, BLA, NDA
- **Quality Management System (QMS)**: CAPA, risk management, audit tracking
- **Document Control**: Versioning, approvals, audit trails
- **Training Management**: GMP training, competency tracking
- **Risk Assessment**: FMEA, hazard analysis, risk registers
- **Supplier Qualification**: Vendor assessment, audit schedules
- **Complaints Handling**: Customer feedback, adverse event tracking
- **Equipment Management**: Calibration, maintenance tracking

### Compliance Standards
- ✅ 21 CFR Part 11 (Electronic Records)
- ✅ ISO 13485 (Medical Device QMS)
- ✅ HIPAA (Healthcare Privacy)
- ✅ GDPR (Data Protection)
- ✅ FDA Quality System Regulation (QSR)

## Quick Start

```bash
# Navigate to app directory
cd Radix_App/RadixLabsApp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | User authentication |
| `/api/compliance` | GET/POST | Compliance status & submissions |
| `/api/capa` | GET/POST | CAPA management |
| `/api/risk` | GET/POST | Risk register |
| `/api/documents` | GET/POST | Document management |
| `/api/training` | GET/POST | Training management |

## Database

Run migrations from `database-schema.sql`:
```sql
-- Connect to your PostgreSQL database and run:
\i database-schema.sql
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: PostgreSQL with pgcrypto encryption
- **Authentication**: JWT + Role-based access control
- **Styling**: Tailwind CSS

## Security

- Password hashing with bcrypt
- Encrypted sensitive data fields
- Immutable audit logging
- Role-based access control (RBAC)
- Session management

## Development

```bash
# Run tests
npm test

# Generate coverage
npm run test:coverage

# Lint code
npm run lint
```

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Documentation

- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Compliance Standards](docs/COMPLIANCE.md)

## License

© Hammurabi Coding Company

---

**Built for FDA compliance** 🏥📋

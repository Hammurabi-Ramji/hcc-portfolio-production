# 🏗️ Northstar Installations — Full-Stack Flooring Management Platform

**Version 1.0.0** | **SQLite3 Edition** | **Production-Ready**

Professional flooring and installation management system with complete microservices architecture, real-time job scheduling, automated estimation calculations, and crew management.

## 🎯 Features

### 📊 Dashboard & Analytics
- Real-time project statistics
- Customer lifetime value tracking
- Job completion metrics
- Revenue forecasting
- Team performance analytics

### 👥 Customer Management
- Complete CRM system
- Contact management
- Job history tracking
- Referral source tracking
- VIP customer segmentation

### 📋 Estimation Engine
- **17 flooring types** with industry-standard pricing
- **4 material grades** (economy → luxury)
- Automatic waste factor calculation
- Complexity multiplier adjustments
- Real-time grand total computation
- Tax & markup handling

### 🔨 Job Management
- Full job lifecycle tracking
- Automated crew assignment
- Conflict detection
- Work order generation
- Progress tracking with photos
- 2-year warranty management

### 👷 Crew Management
- Crew availability calendars
- Specialization tracking
- Workload balancing
- Certification management
- Performance analytics

### 💰 Financial Management
- Invoicing system
- Payment tracking
- Job profitability analysis
- Labor cost optimization
- Material cost management

### 📦 Inventory Management
- Material stock tracking
- Supplier integration
- Reorder point management
- Waste tracking
- Cost per unit monitoring

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js + Express.js + Sequelize ORM
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Database**: SQLite3 (file-based, sovereign)
- **Cache**: Redis
- **Orchestration**: Docker Compose
- **API Protocol**: REST with JWT authentication

### Microservices
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                       │
│                    Port: 3000                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│               API Gateway (Express.js)                        │
│               Port: 8080 | Service Mesh                       │
└──────────────────┬──────────────────────────────────────────┘
         ┌─────────┼─────────┬────────────┬──────────┬────────┐
         │         │         │            │          │        │
    ┌────▼─┐  ┌───▼──┐  ┌──▼────┐  ┌───▼──┐  ┌───▼──┐  ┌──▼─┐
    │ CUST │  │ EST  │  │ FIELD │  │ CRM  │  │ FIN  │  │INV │
    │ 8084 │  │ 8086 │  │ 8087  │  │ 8090 │  │ 8088 │  │8089│
    └──┬───┘  └──┬───┘  └───┬───┘  └──┬───┘  └──┬───┘  └──┬──┘
       │         │           │         │         │         │
    ┌──▼┐   ┌───▼──┐     ┌──▼──┐  ┌──▼──┐  ┌──▼──┐   ┌──▼─┐
    │ DB│   │ DB   │     │ DB  │  │ DB  │  │ DB  │   │ DB │
    └───┘   └──────┘     └─────┘  └─────┘  └─────┘   └────┘
```

### Database Architecture
Each microservice has its own isolated SQLite3 database:

| Service | Database | Path |
|---------|----------|------|
| Customer | `customer.db` | `/data/customer.db` |
| Estimation | `estimation.db` | `/data/estimation.db` |
| Field Operations | `field_operations.db` | `/data/field_operations.db` |
| CRM | `crm.db` | `/data/crm.db` |
| Financial | `financial.db` | `/data/financial.db` |
| Inventory | `inventory.db` | `/data/inventory.db` |
| Document | `document.db` | `/data/document.db` |

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 20+** (for local development)
- **npm 10+**

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/northstarinstallations/platform.git
cd northstar-installations

# Create environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Wait for initialization (30 seconds)
# Then access http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Initialize databases
npm run setup

# Start development servers
npm run dev

# Access http://localhost:3000
```

## 🔐 Default Credentials

| Field | Value |
|-------|-------|
| Email | `admin@northstar.com` |
| Password | `password` |
| Role | Admin |

⚠️ **Change these credentials immediately in production!**

## 📊 API Endpoints

### Authentication
```bash
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Customers
```bash
GET    /api/customers              # List all customers
POST   /api/customers              # Create customer
GET    /api/customers/:id          # Get customer details
PUT    /api/customers/:id          # Update customer
GET    /api/customers/search       # Search customers
```

### Estimations
```bash
GET    /api/estimations            # List estimations
POST   /api/estimations            # Create estimation
GET    /api/estimations/:id        # Get estimation details
POST   /api/estimations/:id/calculate  # Calculate grand total
PATCH  /api/estimations/:id/status     # Update status
DELETE /api/estimations/:id        # Delete estimation
```

### Jobs
```bash
GET    /api/jobs                   # List jobs
POST   /api/jobs                   # Create job
GET    /api/jobs/:id               # Get job details
PUT    /api/jobs/:id               # Update job
PATCH  /api/jobs/:id/status        # Update job status
DELETE /api/jobs/:id               # Delete job
```

### Crew
```bash
GET    /api/crew                   # List crew members
POST   /api/crew                   # Create crew member
GET    /api/crew/:id               # Get crew details
PUT    /api/crew/:id               # Update crew
GET    /api/crew/availability      # Check availability
```

## 📈 Material & Labor Rates

### Flooring Types (17 total)
- Hardwood (solid, engineered)
- Vinyl (plank, sheet)
- Laminate
- Tile (ceramic, porcelain)
- Stone (natural, engineered)
- Carpet (broadloom, modular)
- Concrete
- Epoxy
- Polished Concrete
- Rubber
- Cork
- Bamboo

### Material Grades (4 levels)
- Economy
- Standard
- Premium
- Luxury

### Project Types (8 categories)
- Residential New Construction
- Residential Renovation
- Residential Replacement
- Commercial New Construction
- Commercial Renovation
- Industrial Warehouse
- Mixed-Use
- Hospitality

## 🧪 Testing

### Run All Tests
```bash
npm run test:ci
```

### Test Specific Service
```bash
npm run test --workspace=estimation-service
```

### Generate Coverage Report
```bash
npm run test:ci -- --coverage
```

## 📦 Building & Deployment

### Production Build
```bash
npm run build
docker-compose build
```

### Deploy to Production
```bash
docker-compose -f docker-compose.yml up -d
```

### Database Backup
```bash
tar -czf northstar-backup-$(date +%Y%m%d).tar.gz ./data/
```

### Database Restore
```bash
tar -xzf northstar-backup-YYYYMMDD.tar.gz
docker-compose restart
```

## 🛠️ Service Management

### View Logs
```bash
docker-compose logs -f                    # All services
docker-compose logs -f api-gateway        # Specific service
docker-compose logs -f customer-service   # Another service
```

### Restart Services
```bash
docker-compose restart                    # All services
docker-compose restart api-gateway        # Specific service
```

### Stop Services
```bash
docker-compose stop                       # Graceful stop
docker-compose down                       # Stop and remove containers
docker-compose down -v                    # Stop and remove volumes
```

## 📚 Documentation

- [API Reference](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Configuration Guide](./docs/CONFIGURATION.md)
- [Developer Guide](./docs/DEVELOPER.md)
- [Architecture Decision Records](./docs/ADR/)

## 🔐 Security

### Features Implemented
- ✅ JWT authentication with 24-hour expiry
- ✅ Refresh token rotation
- ✅ Role-based access control (RBAC)
- ✅ Bcrypt password hashing (10 rounds)
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS protection (React sanitization)
- ✅ CORS configuration
- ✅ Request validation (Joi schemas)
- ✅ Rate limiting
- ✅ HTTPS ready (TLS 1.3+)

### Production Checklist
- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET (32+ characters, random)
- [ ] Configure HTTPS certificates
- [ ] Set up automated backups
- [ ] Enable monitoring & alerting
- [ ] Configure mail service
- [ ] Setup CI/CD pipeline
- [ ] Enable database encryption (optional)
- [ ] Setup VPN access (optional)
- [ ] Configure firewall rules

## 🚨 Troubleshooting

### Services Won't Start
```bash
# Clean up and restart
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Issues
```bash
# Check database files
ls -lah ./data/

# Reset databases (⚠️ DESTRUCTIVE)
npm run docker:clean
docker-compose up -d
npm run setup
```

### API Gateway Connection Issues
```bash
# Check service health
curl http://localhost:8080/health
curl http://localhost:8084/health
curl http://localhost:8086/health
```

### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs -f frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

## 📞 Support & Contact

- **Documentation**: https://northstar.local/docs
- **Issues**: https://github.com/northstarinstallations/platform/issues
- **Email**: support@northstarinstallations.com
- **Phone**: +1-555-0100

## 📄 License

**Proprietary** — Northstar Installations, LLC  
All rights reserved. Unauthorized copying prohibited.

## 🎉 Credits

Built with ❤️ by the Northstar Installations development team.

---

**Last Updated**: 2025-05-24  
**Maintained By**: Northstar Engineering  
**Status**: ✅ Production Ready

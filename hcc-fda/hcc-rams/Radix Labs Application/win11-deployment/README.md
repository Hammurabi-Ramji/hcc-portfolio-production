# Radix App - Windows 11 Deployment Package

## Quick Start
1. Ensure Node.js 18+ is installed
2. Run: Start-RadixApp.bat or Start-RadixApp.ps1
3. Open browser to http://localhost:5173

## System Requirements
- Windows 11 (21H2 or later)
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space

## Installation

### Run Launcher
Double-click one of:
- Start-RadixApp.bat (Windows Batch - Recommended)
- Start-RadixApp.ps1 (PowerShell)

### Manual Start
Terminal 1 (Backend):
\\\ash
cd backend
npm start
\\\

Terminal 2 (Frontend):
\\\ash
cd frontend
npm start
\\\

## Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

## Configuration
Edit .env.production for:
- Database settings
- Email configuration
- Security parameters
- Feature flags

## Troubleshooting

### Port Already in Use
\\\powershell
netstat -ano | findstr :3001
taskkill /PID <number> /F
\\\

### Dependencies Issue
\\\ash
npm install
cd backend && npm install
cd ../frontend && npm install
\\\

### Database Issues
\\\ash
cd backend
npm run migrate
npm run seed
\\\

## Logs
Check logs/ directory for application logs.

## Support
See INSTALLATION_GUIDE.md for detailed information.

---
Radix Labs Unified ERP System v1.0.0

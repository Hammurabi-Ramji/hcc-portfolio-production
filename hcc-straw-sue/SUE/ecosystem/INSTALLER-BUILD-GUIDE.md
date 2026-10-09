# SUE Ecosystem v5.0.0 Complete Installer - Build Instructions

## Overview

The SUE Ecosystem v5.0.0 comes with a complete Windows installer that bundles:
- All 6 applications (web, backend, mobile, admin, chat, CLI)
- Complete documentation
- Configuration templates
- Start scripts

## Installation Paths

### Option 1: Build Executable Yourself

**Windows:**
```powershell
cd C:\SUE\ecosystem
.\build-installer.bat
```

**macOS/Linux:**
```bash
cd C:\SUE\ecosystem
chmod +x build-installer.sh
./build-installer.sh
```

This creates: `C:\SUE\ecosystem\release\SUE-Ecosystem-v5.0.0.exe`

### Option 2: Pre-Built Executable

Location: `C:\SUE\ecosystem\release\SUE-Ecosystem-v5.0.0.exe`

If not present, build it using Option 1.

## Build Requirements

- Node.js 18+
- npm (comes with Node.js)
- pnpm (`npm install -g pnpm`)
- pkg (`npm install -g pkg`)
- ~2GB free disk space
- ~5 minutes build time

## What the Installer Does

1. **Checks System Requirements**
   - Verifies Node.js 18+
   - Checks for Docker
   - Validates available disk space

2. **Prompts User for Installation**
   - Installation directory selection
   - Confirmation prompt
   - Interactive setup wizard

3. **Installs Files**
   - Copies all ecosystem files
   - Downloads dependencies (pnpm install)
   - Sets up environment (.env file)
   - Creates start scripts

4. **Configuration**
   - Copies .env.example to .env
   - Sets up Docker Compose
   - Prepares database

5. **Creates Shortcuts**
   - START-ECOSYSTEM.bat for quick launch
   - Desktop shortcuts (optional)

## Distribution

### File Size
- **SUE-Ecosystem-v5.0.0.exe**: ~200-300 MB
  (Compressed with Brotli, includes Node.js runtime)

### Hosting Options
1. GitHub Releases
2. Official website download
3. Direct distribution
4. Package manager (Chocolatey, Winget)

### Checksums
After building, document:
```
SHA256: <hash>
MD5: <hash>
```

## Installation Process (User Perspective)

1. Download `SUE-Ecosystem-v5.0.0.exe`
2. Double-click to run
3. Answer setup questions:
   - Installation directory (default: C:\Program Files\SUE)
   - Confirm installation
4. Wait 5-10 minutes for installation
5. Installer shows next steps

## Post-Installation

User sees:
```
✅ SUE Ecosystem installed successfully!

Next steps:
  1. Navigate to: C:\Program Files\SUE
  2. Open PowerShell/Terminal
  3. Run: docker-compose up
  4. In new terminals, start each app:
     - cd sue-cloud-backend && pnpm dev
     - cd sue-dashboard-web && pnpm dev
     - cd sue-admin-portal && pnpm dev
     - cd sue-ai-chat && pnpm dev
  5. Access dashboard at http://localhost:3000
```

## Troubleshooting Build Issues

### "pkg not found"
```powershell
npm install -g pkg
```

### "pnpm install fails"
```powershell
pnpm install --force
```

### "Build takes too long"
- This is normal (2-3 minutes)
- Check disk space (need ~5GB free)
- Check internet connection

### "Node.js version error"
- Update Node.js to 18+ from nodejs.org
- Verify: `node --version`

## Advanced: Create MSI Installer

For advanced distribution, you can wrap the executable in an MSI:

```powershell
# Install WiX Toolset from https://wixtoolset.org
# Then create .wxs file and compile with candle/light

# Or use NSIS (Nullsoft Scriptable Install System)
```

## Advanced: Code Signing

To add digital signature (trusted by Windows):

```powershell
# Requires certificate
signtool sign /f certificate.pfx /p password /t http://timestamp.server SUE-Ecosystem-v5.0.0.exe
```

## Distribution Timeline

1. **Day 1**: Build executable
2. **Day 2**: Test on clean Windows machine
3. **Day 3**: Create checksums and documentation
4. **Day 4**: Upload to GitHub Releases
5. **Day 5**: Announce availability

## File Manifest

```
release/
├── SUE-Ecosystem-v5.0.0.exe    (Windows installer)
├── README.txt                   (Installation guide)
├── CHECKSUMS.txt               (SHA256 hashes)
└── INSTALL-GUIDE.md            (Detailed instructions)
```

## Support for Users

### Common Issues

**"Docker not found"**
- Install Docker Desktop from docker.com
- Restart computer

**"Port 3000 in use"**
- Change port in package.json
- Or kill process using port

**"Installation fails"**
- Check disk space (need 50GB+)
- Ensure internet connection
- Disable antivirus temporarily

## Next Steps

1. **Build executable:**
   ```powershell
   cd C:\SUE\ecosystem
   .\build-installer.bat
   ```

2. **Test on clean machine**

3. **Create release package**

4. **Distribute to users**

---

**Ready to build?** Run `build-installer.bat` (Windows) or `build-installer.sh` (macOS/Linux)

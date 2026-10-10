# 🏭 VetPharma ERP - Complete Deployment Guide

**Large Animal Pharmaceutical Manufacturing Company ERP System**  
Version 1.0.0 | Distribution Website Deployment to ZAP-Hosting

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Deployment Package Structure](#deployment-package-structure)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Building Installers (Optional)](#building-installers-optional)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

---

## 🚀 Quick Start

### Fastest Deployment (3 Steps)

1. **Download the deployment package** (index.html)
2. **Login to Plesk File Manager**: https://panel.plesk-simeon.zap.cloud
3. **Upload `index.html` to `/httpdocs`** directory

Your distribution site is now live!

---

## 📦 Prerequisites

### Required
- ZAP-Hosting account access
- SFTP client (FileZilla, WinSCP, or command-line)
- Web browser for verification

### Optional (for building actual installers)
- Rust toolchain (1.70+)
- Node.js (18+)
- Tauri CLI
- Platform-specific build tools

---

## 📁 Deployment Package Structure

```
deploy-package/
├── index.html              # Main distribution website
└── installers/             # Directory for installer files
    ├── VetPharma-ERP_1.0.0_x64_en-US.msi    (Windows)
    ├── VetPharma-ERP_1.0.0_x64.dmg          (macOS)
    └── vet-pharma-erp_1.0.0_amd64.deb       (Linux)
```

**Note**: The installers directory will be created automatically. You'll need to build or place actual installer files here (see [Building Installers](#building-installers-optional)).

---

## 🌐 Deployment Methods

### Method 1: Plesk File Manager (Easiest) ⭐

**Perfect for: Non-technical users, quick deployment**

1. **Login to Plesk Panel**
   ```
   URL: https://panel.plesk-simeon.zap.cloud
   Username: zap1314609
   Password: [Your password]
   ```

2. **Navigate to File Manager**
   - Click: `Files` → `File Manager`
   - Navigate to: `/httpdocs`

3. **Upload Files**
   - Click `Upload` button
   - Select `index.html`
   - Wait for upload to complete

4. **Create Installers Directory**
   - Click `New Directory`
   - Name it: `installers`

5. **Upload Installer Files** (when ready)
   - Navigate into `installers` folder
   - Upload .msi, .dmg, and .deb files

**✓ Complete!** Visit your domain to verify.

---

### Method 2: SFTP via FileZilla (Recommended)

**Perfect for: Multiple file uploads, recurring deployments**

1. **Download FileZilla**
   - https://filezilla-project.org/

2. **Connect to Server**
   ```
   Host: panel.plesk-simeon.zap.cloud
   Username: zap1314609
   Protocol: SFTP
   Port: 22
   Password: [Your password]
   ```

3. **Navigate and Upload**
   - Remote site: `/httpdocs`
   - Local site: `deploy-package` folder
   - Drag and drop all files

4. **Verify Upload**
   - Check files appear in remote directory
   - Verify file sizes match

---

### Method 3: Command-Line SFTP (Advanced)

**Perfect for: Automation, scripting, CI/CD**

1. **Execute Deployment Script**
   ```bash
   chmod +x deploy-to-zap.sh
   ./deploy-to-zap.sh
   ```

2. **Manual SFTP Commands** (alternative)
   ```bash
   # Connect
   sftp zap1314609@panel.plesk-simeon.zap.cloud
   
   # Navigate
   cd /httpdocs
   
   # Create directory
   mkdir installers
   
   # Upload files
   put deploy-package/index.html
   cd installers
   put deploy-package/installers/*
   
   # Verify
   ls -la
   
   # Exit
   bye
   ```

---

### Method 4: WinSCP (Windows Users)

**Perfect for: Windows users familiar with GUI**

1. **Download WinSCP**
   - https://winscp.net/

2. **Create New Connection**
   ```
   File Protocol: SFTP
   Host name: panel.plesk-simeon.zap.cloud
   Port number: 22
   User name: zap1314609
   Password: [Your password]
   ```

3. **Upload Files**
   - Left pane: Navigate to `deploy-package`
   - Right pane: Navigate to `/httpdocs`
   - Drag and drop files

---

## ✅ Post-Deployment Verification

### 1. Test Website Access

**Visit your domain:**
```
https://your-domain.com
```

**Expected results:**
- ✅ Professional landing page loads
- ✅ Gradient purple background visible
- ✅ "VetPharma ERP" title displays
- ✅ 30 modules listed
- ✅ Download buttons present

### 2. Verify File Structure

**Check via File Manager or SFTP:**
```
/httpdocs/
├── index.html              ✓ Present
└── installers/             ✓ Directory exists
    ├── *.msi               ⏳ (Add when built)
    ├── *.dmg               ⏳ (Add when built)
    └── *.deb               ⏳ (Add when built)
```

### 3. Test Download Links

**Before building installers:**
- Links will show 404 errors (expected)
- Website still displays correctly
- Users can see what will be available

**After adding installers:**
- Test each download link
- Verify file downloads correctly
- Check file sizes are reasonable (~40-60 MB)

### 4. Mobile Responsiveness

**Test on different devices:**
- Desktop browser (1920x1080)
- Tablet view (768px)
- Mobile view (375px)

**Expected:** Layout adapts gracefully

---

## 🔨 Building Installers (Optional)

**⚠️ Note**: This section is for when you want to create actual working installers. The website works without them!

### Prerequisites

1. **Install Rust**
   ```bash
   # Linux/macOS
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Windows
   # Download from: https://rustup.rs
   ```

2. **Install Node.js**
   ```bash
   # Download from: https://nodejs.org (LTS version)
   ```

3. **Install Tauri CLI**
   ```bash
   cargo install tauri-cli
   ```

### Build Process

1. **Clone/Create Project**
   ```bash
   # Create project directory
   mkdir VetPharmaERP
   cd VetPharmaERP
   
   # Initialize project structure (requires full source code)
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd src-tauri
   cargo build
   cd ..
   ```

3. **Build for Production**
   ```bash
   # Build all platforms (requires platform-specific setup)
   npm run tauri:build
   ```

4. **Locate Installers**
   ```bash
   # Windows
   src-tauri/target/release/bundle/msi/*.msi
   
   # macOS
   src-tauri/target/release/bundle/dmg/*.dmg
   
   # Linux
   src-tauri/target/release/bundle/deb/*.deb
   ```

5. **Upload to ZAP-Hosting**
   ```bash
   # Copy to deployment package
   cp src-tauri/target/release/bundle/msi/*.msi deploy-package/installers/
   cp src-tauri/target/release/bundle/dmg/*.dmg deploy-package/installers/
   cp src-tauri/target/release/bundle/deb/*.deb deploy-package/installers/
   
   # Upload using any method above
   ```

---

## 🔧 Troubleshooting

### Issue: Cannot Connect via SFTP

**Symptoms:**
- Connection timeout
- Authentication failed
- Permission denied

**Solutions:**

1. **Verify Credentials**
   ```
   Username: zap1314609
   Host: panel.plesk-simeon.zap.cloud
   Port: 22 (for SFTP)
   ```

2. **Check Password**
   - Ensure you've changed from default
   - Try resetting via Plesk panel
   - Check for special characters

3. **Firewall Issues**
   - Ensure port 22 is not blocked
   - Try different network
   - Disable VPN temporarily

4. **Use Alternative Method**
   - Try Plesk File Manager instead
   - Web-based upload always works

---

### Issue: Files Upload But Site Shows 404

**Symptoms:**
- Upload successful
- But domain shows "Not Found"

**Solutions:**

1. **Verify Directory**
   ```
   Correct: /httpdocs/index.html
   Wrong: /httpdocs/deploy-package/index.html
   ```

2. **Check File Permissions**
   ```
   index.html should have: 644 permissions
   Via File Manager: Right-click → Change Permissions
   ```

3. **Clear Browser Cache**
   ```
   Ctrl+Shift+Delete (Chrome/Firefox)
   Clear cached images and files
   ```

4. **Check Domain Configuration**
   - Ensure domain points to `/httpdocs`
   - Check in Plesk: Hosting Settings → Document Root

---

### Issue: Download Links Show 404

**Expected Behavior:**
- Before adding installers: 404 is normal
- After adding installers: Should download

**Solutions:**

1. **Verify Installer Files Exist**
   ```bash
   # Check via SFTP
   cd /httpdocs/installers
   ls -la
   
   # Should show:
   # VetPharma-ERP_1.0.0_x64_en-US.msi
   # VetPharma-ERP_1.0.0_x64.dmg
   # vet-pharma-erp_1.0.0_amd64.deb
   ```

2. **Check File Names Match HTML**
   - HTML links must exactly match filenames
   - Case-sensitive on Linux servers
   - No extra spaces in names

3. **Verify File Permissions**
   ```
   Files should be: 644
   Directory should be: 755
   ```

---

### Issue: Website Looks Broken

**Symptoms:**
- No styling
- Plain text only
- Layout issues

**Solutions:**

1. **Check HTML Upload**
   - Ensure complete `index.html` uploaded
   - File size should be ~15 KB
   - Re-upload if corrupted

2. **Browser Compatibility**
   - Test in Chrome/Firefox/Edge
   - Update browser to latest version

3. **View Source**
   - Right-click → View Page Source
   - Verify CSS is present in `<style>` tags
   - Check for error messages

---

## 🔒 Security Considerations

### Critical Security Steps

1. **Change Default Password** ⚠️
   ```
   Login to: https://panel.plesk-simeon.zap.cloud
   Go to: Settings → Password
   Set strong password: 16+ characters
   ```

2. **Enable HTTPS**
   - Plesk: SSL/TLS Certificates → Let's Encrypt
   - Free SSL certificate
   - Automatic renewal

3. **Set File Permissions**
   ```
   Files: 644 (rw-r--r--)
   Directories: 755 (rwxr-xr-x)
   ```

4. **Regular Updates**
   - Check Plesk for system updates
   - Monitor security bulletins
   - Keep backups current

5. **Access Control**
   - Use strong passwords
   - Enable two-factor authentication
   - Limit SSH access to known IPs (optional)

### Recommended Security Settings

```
✅ Use SFTP (not FTP)
✅ Enable SSL certificate
✅ Set restrictive file permissions
✅ Regular password changes
✅ Monitor access logs
✅ Keep Plesk updated
❌ Never share credentials
❌ Don't disable security features
❌ Avoid public wifi for admin tasks
```

---

## 📊 Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] Have ZAP-Hosting credentials ready
- [ ] Have changed default password
- [ ] Have deployment package prepared
- [ ] Have chosen deployment method
- [ ] Have backup of any existing files

### Deployment
- [ ] Connected to server successfully
- [ ] Navigated to correct directory (`/httpdocs`)
- [ ] Uploaded `index.html`
- [ ] Created `installers` directory
- [ ] Uploaded installer files (if available)
- [ ] Verified file permissions (644 for files, 755 for dirs)

### Post-Deployment
- [ ] Visited domain URL
- [ ] Website loads correctly
- [ ] All sections visible
- [ ] Module list displays
- [ ] Download buttons present
- [ ] Tested on mobile device
- [ ] Verified installer links (if applicable)
- [ ] Enabled HTTPS/SSL
- [ ] Cleared browser cache
- [ ] Documented deployment date

---

## 🎯 Next Steps

After successful deployment:

1. **Build Actual Installers**
   - Follow [Building Installers](#building-installers-optional) section
   - Upload to `/httpdocs/installers/`

2. **Customize Branding**
   - Edit `index.html`
   - Update company name
   - Change color scheme
   - Add logo images

3. **Setup Analytics** (Optional)
   - Add Google Analytics
   - Track download statistics
   - Monitor visitor behavior

4. **Configure Custom Domain**
   - Purchase domain (if needed)
   - Point DNS to ZAP-Hosting
   - Configure in Plesk

5. **Setup Email Notifications**
   - Configure contact form
   - Add support email
   - Setup auto-responders

---

## 📞 Support Resources

### ZAP-Hosting Support
- **Website**: https://zap-hosting.com/en/customer/support/
- **Panel**: https://panel.plesk-simeon.zap.cloud

### Additional Resources
- **Tauri Documentation**: https://tauri.app
- **Rust Documentation**: https://doc.rust-lang.org
- **Svelte Documentation**: https://svelte.dev
- **SQLite Documentation**: https://www.sqlite.org

---

## 📝 Version History

### Version 1.0.0 (Current)
- Initial distribution website
- Complete 30-module system design
- FDA 21 CFR Part 11 compliant
- Offline-capable desktop application
- Multi-platform support (Windows/macOS/Linux)

---

## 📄 License

This system is proprietary software designed for Large Animal Pharmaceutical Manufacturing Companies. Unauthorized distribution or modification is prohibited.

---

**🎉 Congratulations!** You now have a complete deployment guide for your VetPharma ERP distribution website.

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section above.

---

*Last Updated: September 29, 2025*
#!/bin/bash
# ──────────────────────────────────────────────────────────────
# SUE - DEPLOYMENT TO ZAP HOSTING
# Automates deployment to the Zap Hosting VPS
# ──────────────────────────────────────────────────────────────

set -e

# Configuration
VPS_IP="YOUR_VPS_IP_HERE"      # Replace with actual IP
VPS_USER="root"                 # Usually root for new VPS
VPS_PORT="22"
APP_DIR="/var/www/sue"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     SUE - Deploy to Zap Hosting                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 1. Pre-flight checks
echo_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Check if built
echo_step "Checking build status..."
if [ ! -f "dist/sue-view.js" ]; then
    echo -e "${RED}✗ Build not found! Run 'npm run package' first${NC}"
    exit 1
fi
echo_success "Build ready"

# Check if VPS is reachable
echo_step "Checking VPS connectivity..."
if ! ping -c 1 "$VPS_IP" > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot reach VPS at $VPS_IP${NC}"
    echo "   Make sure:"
    echo "   1. VPS is running"
    echo "   2. Firewall allows ICMP"
    echo "   3. IP address is correct"
    exit 1
fi
echo_success "VPS is reachable"

# 2. Create release package
echo_step "Creating release package..."
RELEASE_DIR="/tmp/hcc-release-$(date +%Y%m%d%H%M%S)"
mkdir -p "$RELEASE_DIR"

# Copy built files
cp -r dist/ "$RELEASE_DIR/"
cp package.json "$RELEASE_DIR/"

# Create .env.example (not actual credentials)
cat > "$RELEASE_DIR/.env.example" << 'EOF'
NODE_ENV=production
PORT=8080
DATABASE_URL=mysql://user:password@localhost:3306/hcc_main
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
EOF

echo_success "Release package created"

# 3. Deploy to VPS
echo_step "Deploying to VPS ($VPS_IP)..."

# Create remote directory
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "mkdir -p $APP_DIR"

# Upload files
rsync -avz -e "ssh -p $VPS_PORT" \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.env' \
    dist/ "$VPS_USER@$VPS_IP:$APP_DIR/"

echo_success "Files uploaded"

# 4. Install dependencies on VPS
echo_step "Installing dependencies on VPS..."
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" << 'EOF'
cd /var/www/sue
npm install --production
EOF

echo_success "Dependencies installed"

# 5. Configure SSL (optional - run after DNS propagation)
echo_step "SSL Certificate Setup"
echo ""
echo "Run this command on the VPS to get SSL:"
echo "  sudo certbot --nginx -d hcc.hammurabicoding.com"
echo ""

# 6. Start services
echo_step "Starting services..."
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" << 'EOF'
# Reload systemd
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable hcc-api
sudo systemctl start hcc-api
sudo systemctl restart nginx

# Check status
sudo systemctl status hcc-api --no-pager
EOF

echo_success "Services started"

# 7. Final status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo ""
echo "📊 Status:"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "sudo systemctl is-active hcc-api nginx"
echo ""
echo "🌐 Access:"
echo "  Extension: Load from dist/ folder in Chrome"
echo "  API:       https://hcc.hammurabicoding.com/api"
echo "  Dashboard: https://hcc.hammurabicoding.com"
echo ""
echo "📝 Next Steps:"
echo "  1. Update DNS to point to $VPS_IP"
echo "  2. Run: sudo certbot --nginx -d hcc.hammurabicoding.com"
echo "  3. Test extension in browser"
echo "  4. Monitor logs: sudo journalctl -u hcc-api -f"
echo ""


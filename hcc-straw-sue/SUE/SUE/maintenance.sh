#!/bin/bash
# ──────────────────────────────────────────────────────────────
# SUE - BACKUP & MAINTENANCE SCRIPT
# Daily database backup and system monitoring
# ──────────────────────────────────────────────────────────────

set -e

# Configuration
BACKUP_DIR="/var/backups/hcc"
LOG_FILE="/var/log/hcc-maintenance.log"
DB_NAME="hcc_main"
DB_USER="hcc_user"
DB_PASS="CHANGE_THIS"  # Update with actual password
WEBSPACE_HOST="yourwebspace.zap-hosting.com"
WEBSPACE_USER="your_web_username"
WEBSPACE_PASS="your_web_password"

# Date stamp
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hcc_backup_$DATE.sql.gz"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check disk space
check_disk_space() {
    log "📊 Checking disk space..."
    FREE_SPACE=$(df -h /var/www | awk 'NR==2 {print $4}')
    
    if [ $(echo "$FREE_SPACE" | grep -o '[0-9]*' | head -1) -lt 10000 ]; then
        log "⚠️ WARNING: Low disk space! Only ${FREE_SPACE} free"
        return 1
    else
        log "✅ Disk space OK: ${FREE_SPACE} free"
        return 0
    fi
}

# Backup MySQL database
backup_database() {
    log "💾 Backing up MySQL database..."
    
    if ! mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
        log "❌ Database backup failed!"
        return 1
    fi
    
    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Database backup created: $BACKUP_FILE (${SIZE})"
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "hcc_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true
    log "✅ Old backups (7+ days) cleaned up"
}

# Backup configuration files
backup_config() {
    log "📄 Backing up configuration..."
    
    CONFIG_BACKUP="$BACKUP_DIR/config_backup_$DATE.tar.gz"
    
    if tar -czf "$CONFIG_BACKUP" \
        /etc/nginx/sites-available/hcc* \
        /etc/systemd/system/hcc-api.service \
        /var/www/sue/.env 2>/dev/null; then
        
        log "✅ Config backup created: $CONFIG_BACKUP"
    else
        log "⚠️ Config backup skipped (file may not exist)"
    fi
}

# Check services
check_services() {
    log "🔍 Checking services..."
    
    local ISSUES=0
    
    # Nginx
    if sudo systemctl is-active --quiet nginx; then
        log "✅ Nginx is running"
    else
        log "❌ Nginx is NOT running"
        ISSUES=$((ISSUES + 1))
    fi
    
    # HCC API
    if sudo systemctl is-active --quiet hcc-api; then
        log "✅ HCC API is running"
    else
        log "❌ HCC API is NOT running"
        ISSUES=$((ISSUES + 1))
    fi
    
    # MySQL
    if sudo systemctl is-active --quiet mysql; then
        log "✅ MySQL is running"
    else
        log "❌ MySQL is NOT running"
        ISSUES=$((ISSUES + 1))
    fi
    
    # Redis
    if sudo systemctl is-active --quiet redis-server; then
        log "✅ Redis is running"
    else
        log "⚠️ Redis is NOT running (optional)"
    fi
    
    return $ISSUES
}

# Monitor resource usage
monitor_resources() {
    log "📊 Monitoring resources..."
    
    # CPU
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    log "  CPU Usage: ${CPU_USAGE}%"
    
    # Memory
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
    log "  Memory Usage: ${MEM_USAGE}%"
    
    # Swap
    SWAP_USAGE=$(free | grep Swap | awk '{printf("%.1f"), $3/$2 * 100.0}')
    log "  Swap Usage: ${SWAP_USAGE}%"
    
    if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
        log "⚠️ WARNING: High memory usage!"
    fi
}

# Update logs
rotate_logs() {
    log "📝 Rotating logs..."
    
    # Clear old nginx logs if too large
    if [ -f "/var/log/nginx/hcc-api.error.log" ]; then
        LOG_SIZE=$(du -b /var/log/nginx/hcc-api.error.log | cut -f1)
        if [ "$LOG_SIZE" -gt 104857600 ]; then  # 100MB
            log "⚠️ Error log is >100MB, rotating..."
            sudo truncate -s 0 /var/log/nginx/hcc-api.error.log
        fi
    fi
    
    log "✅ Log rotation complete"
}

# Send notifications (optional)
send_notification() {
    if [ "$1" = "WARNING" ] || [ "$1" = "ERROR" ]; then
        # Email notification to admin
        # echo "HCC Maintenance Alert: $2" | mail -s "HCC Alert" admin@yourdomain.com
        
        # Or use webhook (Slack, Discord, etc.)
        # curl -X POST -H 'Content-type: application/json' \
        #   --data "{\"text\":\"HCC Alert: $2\"}" \
        #   YOUR_WEBHOOK_URL
        
        log "📧 Notification sent (if configured)"
    fi
}

# Main maintenance routine
run_maintenance() {
    log "═══════════════════════════════════════════════════════════"
    log "Starting maintenance routine"
    
    # 1. Check disk space
    check_disk_space || send_notification "WARNING" "Low disk space detected"
    
    # 2. Check services
    check_services
    if [ $? -ne 0 ]; then
        send_notification "ERROR" "Service check failed"
        log "❌ Service check failed - check manual intervention needed"
        return 1
    fi
    
    # 3. Monitor resources
    monitor_resources
    
    # 4. Backup database
    backup_database
    
    # 5. Backup configuration
    backup_config
    
    # 6. Rotate logs
    rotate_logs
    
    log "═══════════════════════════════════════════════════════════"
    log "Maintenance routine completed successfully"
}

# SSL certificate check
check_ssl_certificates() {
    log "🔒 Checking SSL certificates..."
    
    CERT_DOMAIN="hcc.hammurabicoding.com"
    CERT_PATH="/etc/letsencrypt/live/$CERT_DOMAIN/fullchain.pem"
    
    if [ -f "$CERT_PATH" ]; then
        EXPIRY=$(openssl x509 -in "$CERT_PATH" -noout -enddate | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
        NOW=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW) / 86400 ))
        
        log "  Certificate expires: $EXPIRY (${DAYS_LEFT} days left)"
        
        if [ $DAYS_LEFT -lt 30 ]; then
            log "⚠️ WARNING: Certificate expiring soon!"
            send_notification "WARNING" "SSL certificate expiring in $DAYS_LEFT days"
        elif [ $DAYS_LEFT -lt 7 ]; then
            log "❌ CRITICAL: Certificate expiring in less than 7 days!"
            send_notification "ERROR" "SSL certificate expires in $DAYS_LEFT days"
        else
            log "✅ Certificate is valid"
        fi
    else
        log "⚠️ SSL certificate not found"
    fi
}

# Update system (monthly)
system_update() {
    log "🔄 Checking for system updates..."
    
    UPDATE_AVAILABLE=$(apt list --upgradable 2>/dev/null | grep -c "upgradable")
    
    if [ "$UPDATE_AVAILABLE" -gt 0 ]; then
        log "⚠️ $UPDATE_AVAILABLE updates available"
        log "   Run: sudo apt update && sudo apt upgrade -y"
    else
        log "✅ System is up to date"
    fi
}

# Show status (quick check)
show_status() {
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║     SUE - System Status                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 Services:"
    echo "  Nginx:    $(sudo systemctl is-active nginx 2>/dev/null || echo 'unknown')"
    echo "  HCC API:  $(sudo systemctl is-active hcc-api 2>/dev/null || echo 'unknown')"
    echo "  MySQL:    $(sudo systemctl is-active mysql 2>/dev/null || echo 'unknown')"
    echo "  Redis:    $(sudo systemctl is-active redis-server 2>/dev/null || echo 'unknown')"
    echo ""
    echo "💾 Storage:"
    df -h /var/www | tail -1 | awk '{print "  Used: " $3 " / " $2 " (" $5 ")"}'
    echo ""
    echo "🧠 Memory:"
    free -h | grep Mem | awk '{print "  Used: " $3 " / " $2}'
    echo ""
    echo "🔒 SSL Certificate:"
    CERT_DOMAIN="hcc.hammurabicoding.com"
    if [ -f "/etc/letsencrypt/live/$CERT_DOMAIN/fullchain.pem" ]; then
        EXPIRY=$(openssl x509 -in "/etc/letsencrypt/live/$CERT_DOMAIN/fullchain.pem" -noout -enddate | cut -d= -f2)
        echo "  Expires: $EXPIRY"
    else
        echo "  Not configured"
    fi
    echo ""
}

# Parse command
case "${1:-run}" in
    run)
        run_maintenance
        check_ssl_certificates
        ;;
    status)
        show_status
        ;;
    backup)
        backup_database
        backup_config
        ;;
    update)
        system_update
        ;;
    ssl)
        check_ssl_certificates
        ;;
    *)
        echo "Usage: $0 {run|status|backup|update|ssl}"
        echo ""
        echo "Commands:"
        echo "  run  - Run full maintenance routine (default)"
        echo "  status - Show quick system status"
        echo "  backup - Run backups only"
        echo "  update - Check for system updates"
        echo "  ssl    - Check SSL certificate status"
        exit 1
        ;;
esac


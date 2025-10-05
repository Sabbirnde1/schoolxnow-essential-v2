#!/bin/bash
# Check backup status and send alert if backup is too old

set -e

# Configuration
BACKUP_DIR="./backups"
MAX_AGE_HOURS=48  # Alert if backup is older than 48 hours

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Checking backup status..."

# Find most recent backup
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "schoolxnow_backup_*.sql.gz" -o -name "schoolxnow_backup_*.zip" 2>/dev/null | sort -r | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}✗ ERROR: No backups found!${NC}"
    echo "Run backup script immediately!"
    exit 1
fi

# Get backup age in hours
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    BACKUP_TIME=$(stat -f %m "$LATEST_BACKUP")
else
    # Linux
    BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
fi

CURRENT_TIME=$(date +%s)
BACKUP_AGE_SECONDS=$((CURRENT_TIME - BACKUP_TIME))
BACKUP_AGE_HOURS=$((BACKUP_AGE_SECONDS / 3600))

# Check if backup is too old
if [ $BACKUP_AGE_HOURS -gt $MAX_AGE_HOURS ]; then
    echo -e "${RED}✗ WARNING: Latest backup is $BACKUP_AGE_HOURS hours old!${NC}"
    echo "Expected: Less than $MAX_AGE_HOURS hours"
    echo "File: $LATEST_BACKUP"
    echo ""
    echo "Action required: Run backup script now!"
    exit 1
fi

# All good
echo -e "${GREEN}✓ OK: Backup is current${NC}"
echo "Age: $BACKUP_AGE_HOURS hours"
echo "File: $(basename "$LATEST_BACKUP")"
echo "Size: $(du -h "$LATEST_BACKUP" | cut -f1)"
echo "Modified: $(date -r "$LATEST_BACKUP" '+%Y-%m-%d %H:%M:%S')"

exit 0

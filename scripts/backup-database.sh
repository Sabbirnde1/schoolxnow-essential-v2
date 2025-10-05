#!/bin/bash
# SchoolXnow Database Backup Script
# Run weekly for additional protection beyond Supabase automated backups

set -e  # Exit on error

# Configuration
PROJECT_REF="ktknzhypndszujoakaxq"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="schoolxnow_backup_${DATE}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SchoolXnow Database Backup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${RED}ERROR: SUPABASE_ACCESS_TOKEN not set${NC}"
    echo "Set it with: export SUPABASE_ACCESS_TOKEN='your_token'"
    exit 1
fi

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"
echo -e "${YELLOW}→${NC} Backup directory: $BACKUP_DIR"

# Start backup
echo -e "${YELLOW}→${NC} Starting backup at $(date)"
echo -e "${YELLOW}→${NC} Connecting to project: $PROJECT_REF"

# Dump database (data only, schema is in migrations)
if npx supabase db dump --project-ref "$PROJECT_REF" --data-only > "$BACKUP_DIR/$BACKUP_FILE" 2>&1; then
    echo -e "${GREEN}✓${NC} Database dumped successfully"
else
    echo -e "${RED}✗${NC} Backup failed!"
    exit 1
fi

# Check file size
FILESIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo -e "${YELLOW}→${NC} Backup size: $FILESIZE"

# Compress the backup
echo -e "${YELLOW}→${NC} Compressing backup..."
if gzip "$BACKUP_DIR/$BACKUP_FILE"; then
    echo -e "${GREEN}✓${NC} Backup compressed"
    COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_FILE}.gz" | cut -f1)
    echo -e "${YELLOW}→${NC} Compressed size: $COMPRESSED_SIZE"
else
    echo -e "${YELLOW}!${NC} Compression failed, keeping uncompressed"
fi

# Keep only last 4 weeks of backups
echo -e "${YELLOW}→${NC} Cleaning up old backups (keeping last 28 days)..."
DELETED=$(find "$BACKUP_DIR" -name "schoolxnow_backup_*.sql.gz" -mtime +28 -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Removed $DELETED old backup(s)"
else
    echo -e "${YELLOW}→${NC} No old backups to remove"
fi

# List current backups
echo ""
echo -e "${GREEN}Current backups:${NC}"
ls -lh "$BACKUP_DIR"/schoolxnow_backup_*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Backup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backup file: ${GREEN}${BACKUP_FILE}.gz${NC}"
echo -e "Location: ${GREEN}$BACKUP_DIR/${NC}"
echo ""

# Optional: Upload to cloud storage
# Uncomment and configure for AWS S3, Google Cloud, etc.
# if command -v aws &> /dev/null; then
#     echo "Uploading to S3..."
#     aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" "s3://your-bucket/schoolxnow-backups/$(date +%Y/%m/%d)/"
#     echo "✓ Uploaded to cloud storage"
# fi

exit 0

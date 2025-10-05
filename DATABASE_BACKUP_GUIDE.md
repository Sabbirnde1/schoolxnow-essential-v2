# Database Backup Strategy for SchoolXnow

## 🎯 Backup Overview

A comprehensive backup strategy protects your school's critical data from:
- Accidental data deletion
- Application bugs
- Security breaches
- Hardware failures
- Human errors

---

## ✅ Step-by-Step Backup Setup

### 1. Enable Point-in-Time Recovery (PITR) ⭐ CRITICAL

**What it does:** Allows you to restore your database to any point in time (within retention period)

**How to enable:**

1. **Go to Database Settings:**
   https://app.supabase.com/project/ktknzhypndszujoakaxq/settings/database

2. **Find "Point-in-Time Recovery" section**

3. **Enable PITR:**
   - Toggle the PITR switch to **ON**
   - Choose retention period: **7 days** (recommended minimum)
   - For production: Consider **14-30 days**

4. **Confirm and Save**

**Cost:** Small additional charge based on WAL (Write-Ahead Log) storage

**Benefits:**
- ✅ Restore to any second within retention period
- ✅ Protects against accidental deletions
- ✅ No manual intervention needed
- ✅ Zero performance impact

---

### 2. Configure Automated Daily Backups

**Supabase provides automated daily backups on paid plans**

**Check your backup status:**

1. Go to: https://app.supabase.com/project/ktknzhypndszujoakaxq/settings/database
2. Scroll to **"Backups"** section
3. Check:
   - ✅ Daily backups enabled
   - ✅ Retention period (typically 7 days on Pro plan)
   - ✅ Last successful backup timestamp

**If on Free plan:**
- Upgrade to Pro plan for automated backups
- Or set up manual backups (see below)

---

### 3. Manual Backup Script (Weekly Recommended)

Create a backup script for additional protection:

**File: `scripts/backup-database.sh`**

```bash
#!/bin/bash
# Weekly database backup script
# Run this every Sunday at 2 AM via cron or Task Scheduler

# Configuration
PROJECT_REF="ktknzhypndszujoakaxq"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="schoolxnow_backup_${DATE}.sql"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Set Supabase access token
export SUPABASE_ACCESS_TOKEN="your_access_token_here"

# Pull database schema and data
echo "Starting backup at $(date)"
npx supabase db dump --project-ref "$PROJECT_REF" --data-only > "$BACKUP_DIR/${BACKUP_FILE}"

# Compress the backup
gzip "$BACKUP_DIR/${BACKUP_FILE}"

# Keep only last 4 weeks of backups
find "$BACKUP_DIR" -name "schoolxnow_backup_*.sql.gz" -mtime +28 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
echo "Backup size: $(du -h "$BACKUP_DIR/${BACKUP_FILE}.gz" | cut -f1)"

# Optional: Upload to cloud storage (AWS S3, Google Drive, etc.)
# aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" s3://your-bucket/backups/
```

**File: `scripts/backup-database.ps1` (Windows PowerShell)**

```powershell
# Weekly database backup script for Windows
# Run this every Sunday at 2 AM via Task Scheduler

# Configuration
$PROJECT_REF = "ktknzhypndszujoakaxq"
$BACKUP_DIR = ".\backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "schoolxnow_backup_$DATE.sql"

# Create backup directory if not exists
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

# Set Supabase access token
$env:SUPABASE_ACCESS_TOKEN = "your_access_token_here"

# Pull database schema and data
Write-Host "Starting backup at $(Get-Date)"
npx supabase db dump --project-ref $PROJECT_REF --data-only | Out-File "$BACKUP_DIR\$BACKUP_FILE" -Encoding UTF8

# Compress the backup
Compress-Archive -Path "$BACKUP_DIR\$BACKUP_FILE" -DestinationPath "$BACKUP_DIR\$BACKUP_FILE.zip" -Force
Remove-Item "$BACKUP_DIR\$BACKUP_FILE"

# Keep only last 4 weeks of backups
Get-ChildItem "$BACKUP_DIR\schoolxnow_backup_*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-28) } | 
    Remove-Item

Write-Host "Backup completed: $BACKUP_FILE.zip"
Write-Host "Backup size: $((Get-Item "$BACKUP_DIR\$BACKUP_FILE.zip").Length / 1MB) MB"

# Optional: Upload to OneDrive, Google Drive, or Azure Blob Storage
```

---

### 4. Set Up Automated Backup Schedule

#### **Option A: GitHub Actions (Recommended for Developers)**

Create `.github/workflows/backup.yml`:

```yaml
name: Weekly Database Backup

on:
  schedule:
    # Run every Sunday at 2 AM UTC
    - cron: '0 2 * * 0'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Supabase CLI
        run: npm install -g supabase

      - name: Create backup
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          mkdir -p backups
          DATE=$(date +%Y%m%d_%H%M%S)
          npx supabase db dump --project-ref ktknzhypndszujoakaxq --data-only > backups/backup_$DATE.sql
          gzip backups/backup_$DATE.sql

      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/*.sql.gz
          retention-days: 30

      # Optional: Upload to cloud storage
      - name: Configure AWS credentials
        if: false # Enable if using AWS S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Upload to S3
        if: false # Enable if using AWS S3
        run: |
          aws s3 cp backups/*.sql.gz s3://your-bucket/schoolxnow-backups/
```

**Setup:**
1. Add `SUPABASE_ACCESS_TOKEN` to GitHub Secrets
2. Commit the workflow file
3. Backups run automatically every Sunday

#### **Option B: Windows Task Scheduler**

1. Open Task Scheduler
2. Create Basic Task
3. Name: "SchoolXnow Weekly Backup"
4. Trigger: Weekly, Sunday, 2:00 AM
5. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "D:\MyPersonal Project\SchoolXnow\schoolxnow-essential-v2\scripts\backup-database.ps1"`
6. Save and test

#### **Option C: Linux Cron Job**

```bash
# Edit crontab
crontab -e

# Add this line (runs every Sunday at 2 AM)
0 2 * * 0 /path/to/schoolxnow-essential-v2/scripts/backup-database.sh >> /var/log/schoolxnow-backup.log 2>&1
```

---

### 5. Test Your Backup (CRITICAL!)

**Never trust a backup you haven't tested!**

**Test procedure:**

1. **Create a test backup:**
   ```bash
   npx supabase db dump --project-ref ktknzhypndszujoakaxq --data-only > test_backup.sql
   ```

2. **Restore to local database (safe test):**
   ```bash
   # Start local Supabase
   npx supabase start
   
   # Restore backup
   npx supabase db reset
   psql postgresql://postgres:postgres@localhost:54322/postgres < test_backup.sql
   ```

3. **Verify data integrity:**
   - Check critical tables have data
   - Verify record counts match
   - Test key queries work

4. **Document the restore process**

**Test schedule:** Every 3 months

---

### 6. Cloud Storage Integration (Optional but Recommended)

**Store backups in multiple locations for disaster recovery**

#### **AWS S3 Setup:**

```bash
# Install AWS CLI
# Configure credentials
aws configure

# Upload backup
aws s3 cp backups/backup.sql.gz s3://your-bucket/schoolxnow/$(date +%Y/%m/%d)/

# List backups
aws s3 ls s3://your-bucket/schoolxnow/ --recursive
```

#### **Google Drive Setup:**

Use `rclone` to sync backups:

```bash
# Install rclone
# Configure Google Drive
rclone config

# Sync backups
rclone copy backups/ gdrive:SchoolXnow-Backups/
```

---

### 7. Backup Monitoring & Alerts

**Create a backup monitoring script:**

**File: `scripts/check-backup-status.sh`**

```bash
#!/bin/bash
# Check if backup is recent and send alert if not

BACKUP_DIR="./backups"
ALERT_EMAIL="admin@schoolxnow.com"
MAX_AGE_HOURS=48

# Find most recent backup
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)

if [ -z "$LATEST_BACKUP" ]; then
    echo "ERROR: No backups found!"
    # Send alert email
    exit 1
fi

# Check age
BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600 ))

if [ $BACKUP_AGE -gt $MAX_AGE_HOURS ]; then
    echo "WARNING: Latest backup is $BACKUP_AGE hours old!"
    # Send alert email
    exit 1
fi

echo "OK: Latest backup is $BACKUP_AGE hours old"
echo "File: $LATEST_BACKUP"
```

---

### 8. Backup Retention Policy

**Recommended retention schedule:**

| Backup Type | Frequency | Retention | Purpose |
|-------------|-----------|-----------|---------|
| PITR (Supabase) | Continuous | 7-30 days | Quick recovery from recent mistakes |
| Automated Daily | Daily | 7-14 days | Recent snapshots |
| Manual Weekly | Weekly | 4-8 weeks | Monthly history |
| Monthly Archive | Monthly | 1-2 years | Compliance & long-term recovery |
| Yearly Archive | Yearly | 5+ years | Legal/compliance requirements |

---

### 9. Disaster Recovery Plan

**Document the recovery process:**

#### **Scenario 1: Recent Data Loss (< 7 days)**

1. Use PITR to restore to specific timestamp:
   - Go to Supabase Dashboard → Database → Backups
   - Select timestamp before data loss
   - Click "Restore"
   - Confirm (creates new database)

2. Update application connection string
3. Verify data integrity
4. Switch application to restored database

**Recovery Time:** 15-30 minutes

#### **Scenario 2: Complete Database Loss**

1. Create new Supabase project
2. Restore from latest backup:
   ```bash
   psql $NEW_DATABASE_URL < backups/latest_backup.sql
   ```
3. Update application environment variables
4. Run migrations if needed
5. Test application thoroughly

**Recovery Time:** 1-3 hours

#### **Scenario 3: Partial Data Corruption**

1. Export affected tables from backup
2. Compare with current data
3. Selectively restore correct data
4. Verify integrity

**Recovery Time:** 2-4 hours

---

### 10. Security Best Practices

**Protect your backups:**

✅ **Encrypt backups:**
```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt when needed
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

✅ **Secure storage:**
- Use encrypted cloud storage
- Restrict access (IAM policies)
- Enable versioning
- Use private buckets/folders

✅ **Secure credentials:**
- Never commit backup scripts with tokens
- Use environment variables
- Rotate access tokens quarterly
- Use separate backup-only credentials

✅ **Audit access:**
- Log all backup access
- Monitor unusual activity
- Review access logs monthly

---

## 📋 Backup Checklist

### Initial Setup (One-time)
- [ ] Enable PITR in Supabase Dashboard
- [ ] Verify automated daily backups enabled
- [ ] Create backup scripts directory
- [ ] Set up manual backup script
- [ ] Configure automated schedule (GitHub Actions/Cron/Task Scheduler)
- [ ] Set up cloud storage integration (optional)
- [ ] Test backup and restore process
- [ ] Document recovery procedures

### Weekly Tasks
- [ ] Verify backup ran successfully
- [ ] Check backup file size (should be consistent)
- [ ] Review backup logs for errors

### Monthly Tasks
- [ ] Test restore process
- [ ] Verify backup integrity
- [ ] Review storage usage
- [ ] Clean up old backups per retention policy
- [ ] Update disaster recovery documentation

### Quarterly Tasks
- [ ] Full disaster recovery test
- [ ] Review and update backup strategy
- [ ] Rotate access credentials
- [ ] Audit backup access logs

---

## 🚨 Emergency Contacts

**In case of data loss:**

1. **Don't panic!** Backups are in place
2. **Stop all write operations** immediately
3. **Contact:** [Your IT/Database Admin]
4. **Follow disaster recovery plan** (above)
5. **Document incident** for post-mortem

---

## 📊 Backup Metrics to Monitor

Track these metrics:

- **Backup Success Rate:** Should be 100%
- **Backup Duration:** Should be consistent
- **Backup Size:** Should grow gradually
- **Last Successful Backup:** Should be < 24 hours
- **Storage Used:** Monitor costs
- **Recovery Time:** Test regularly

---

## 💰 Cost Estimation

**Monthly backup costs:**

| Component | Cost |
|-----------|------|
| PITR (7 days) | ~$5-15/month |
| Automated backups (included in Pro) | Included |
| Cloud storage (100GB) | $2-5/month |
| **Total** | **~$7-20/month** |

**Worth it?** Absolutely! Losing student data could cost thousands.

---

## 🎯 Next Steps

1. **Enable PITR now** (5 minutes)
2. **Set up weekly manual backups** (15 minutes)
3. **Test restore process** (30 minutes)
4. **Schedule regular testing** (quarterly)

---

**Created:** October 5, 2025  
**Last Updated:** October 5, 2025  
**Review Schedule:** Quarterly


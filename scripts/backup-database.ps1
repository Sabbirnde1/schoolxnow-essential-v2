# SchoolXnow Database Backup Script (Windows PowerShell)
# Run weekly for additional protection beyond Supabase automated backups

param(
    [string]$ProjectRef = "ktknzhypndszujoakaxq",
    [string]$BackupDir = ".\backups"
)

# Configuration
$ErrorActionPreference = "Stop"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "schoolxnow_backup_$DATE.sql"

Write-Host "========================================" -ForegroundColor Green
Write-Host "SchoolXnow Database Backup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if SUPABASE_ACCESS_TOKEN is set
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "ERROR: SUPABASE_ACCESS_TOKEN not set" -ForegroundColor Red
    Write-Host 'Set it with: $env:SUPABASE_ACCESS_TOKEN = "your_token"'
    exit 1
}

# Create backup directory if not exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    Write-Host "→ Created backup directory: $BackupDir" -ForegroundColor Yellow
} else {
    Write-Host "→ Backup directory: $BackupDir" -ForegroundColor Yellow
}

# Start backup
Write-Host "→ Starting backup at $(Get-Date)" -ForegroundColor Yellow
Write-Host "→ Connecting to project: $ProjectRef" -ForegroundColor Yellow

# Dump database (data only, schema is in migrations)
try {
    Write-Host "→ Dumping database..." -ForegroundColor Yellow
    npx supabase db dump --project-ref $ProjectRef --data-only | Out-File "$BackupDir\$BACKUP_FILE" -Encoding UTF8
    Write-Host "✓ Database dumped successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Backup failed: $_" -ForegroundColor Red
    exit 1
}

# Check file size
$FileSize = (Get-Item "$BackupDir\$BACKUP_FILE").Length
$FileSizeMB = [math]::Round($FileSize / 1MB, 2)
Write-Host "→ Backup size: $FileSizeMB MB" -ForegroundColor Yellow

# Compress the backup
try {
    Write-Host "→ Compressing backup..." -ForegroundColor Yellow
    Compress-Archive -Path "$BackupDir\$BACKUP_FILE" -DestinationPath "$BackupDir\$BACKUP_FILE.zip" -Force
    Remove-Item "$BackupDir\$BACKUP_FILE"
    Write-Host "✓ Backup compressed" -ForegroundColor Green
    
    $CompressedSize = (Get-Item "$BackupDir\$BACKUP_FILE.zip").Length
    $CompressedSizeMB = [math]::Round($CompressedSize / 1MB, 2)
    Write-Host "→ Compressed size: $CompressedSizeMB MB" -ForegroundColor Yellow
} catch {
    Write-Host "! Compression failed, keeping uncompressed" -ForegroundColor Yellow
}

# Keep only last 4 weeks of backups
Write-Host "→ Cleaning up old backups (keeping last 28 days)..." -ForegroundColor Yellow
$OldBackups = Get-ChildItem "$BackupDir\schoolxnow_backup_*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-28) }

if ($OldBackups) {
    $DeletedCount = ($OldBackups | Measure-Object).Count
    $OldBackups | Remove-Item
    Write-Host "✓ Removed $DeletedCount old backup(s)" -ForegroundColor Green
} else {
    Write-Host "→ No old backups to remove" -ForegroundColor Yellow
}

# List current backups
Write-Host ""
Write-Host "Current backups:" -ForegroundColor Green
Get-ChildItem "$BackupDir\schoolxnow_backup_*.zip" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 | 
    ForEach-Object {
        $SizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  $($_.Name) - $SizeMB MB - $($_.LastWriteTime)" -ForegroundColor Cyan
    }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Backup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Backup file: " -NoNewline
Write-Host "$BACKUP_FILE.zip" -ForegroundColor Green
Write-Host "Location: " -NoNewline
Write-Host "$BackupDir\" -ForegroundColor Green
Write-Host ""

# Optional: Upload to cloud storage
# Uncomment and configure for Azure Blob Storage, OneDrive, etc.
# if (Get-Command az -ErrorAction SilentlyContinue) {
#     Write-Host "Uploading to Azure Blob Storage..."
#     az storage blob upload `
#         --account-name youraccount `
#         --container-name backups `
#         --name "schoolxnow/$(Get-Date -Format 'yyyy/MM/dd')/$BACKUP_FILE.zip" `
#         --file "$BackupDir\$BACKUP_FILE.zip"
#     Write-Host "✓ Uploaded to cloud storage" -ForegroundColor Green
# }

exit 0

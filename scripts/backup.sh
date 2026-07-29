#!/bin/bash

# ============================================
# Backup Script for Lazward Dental Clinic
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/home/deployer/lazward-dental-clinic"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/backup.log"
DATE=$(date '+%Y-%m-%d_%H-%M-%S')

# Functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    log "INFO: $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    log "WARN: $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "ERROR: $1"
}

backup_mongodb() {
    log_info "Starting MongoDB backup..."
    
    local backup_file="$BACKUP_DIR/mongodb_backup_$DATE.gz"
    
    docker exec lazward-mongodb mongodump --archive --gzip > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_info "MongoDB backup completed: $backup_file"
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Backup size: $size"
        return 0
    else
        log_error "MongoDB backup failed"
        return 1
    fi
}

backup_uploads() {
    log_info "Starting uploads backup..."
    
    local backup_file="$BACKUP_DIR/uploads_backup_$DATE.tar.gz"
    
    if [ -d "$PROJECT_DIR/uploads" ] && [ "$(ls -A $PROJECT_DIR/uploads)" ]; then
        tar -czf "$backup_file" -C "$PROJECT_DIR" uploads
        
        if [ $? -eq 0 ]; then
            log_info "Uploads backup completed: $backup_file"
            local size=$(du -h "$backup_file" | cut -f1)
            log_info "Backup size: $size"
            return 0
        else
            log_error "Uploads backup failed"
            return 1
        fi
    else
        log_warn "No uploads to backup"
        return 0
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 7 days)..."
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "mongodb_backup_*.gz" -type f -mtime +7 -delete
    find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -type f -mtime +7 -delete
    
    log_info "Old backups cleaned up"
}

check_disk_space() {
    local usage=$(df -h /home/deployer | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 85 ]; then
        log_error "Disk usage is too high (${usage}%), skipping backup"
        return 1
    fi
    
    log_info "Disk usage: ${usage}%"
    return 0
}

main() {
    cd "$PROJECT_DIR"
    
    # Create backup directory if not exists
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_DIR/logs"
    
    log_info "Starting backup process..."
    
    # Check disk space before backup
    if ! check_disk_space; then
        exit 1
    fi
    
    local failed_backups=0
    
    # Backup MongoDB
    if ! backup_mongodb; then
        failed_backups=$((failed_backups + 1))
    fi
    
    # Backup uploads
    if ! backup_uploads; then
        failed_backups=$((failed_backups + 1))
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    if [ $failed_backups -eq 0 ]; then
        log_info "Backup process completed successfully"
        exit 0
    else
        log_error "Backup process completed with $failed_backups failures"
        exit 1
    fi
}

main "$@"

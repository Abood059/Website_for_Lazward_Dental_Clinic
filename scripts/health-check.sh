#!/bin/bash

# ============================================
# Health Check Script for Lazward Dental Clinic
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/home/deployer/lazward-dental-clinic"
LOG_FILE="$PROJECT_DIR/logs/health.log"

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

check_container_running() {
    local container_name=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_info "Container $container_name is running"
        return 0
    else
        log_error "Container $container_name is not running"
        return 1
    fi
}

check_container_health() {
    local container_name=$1
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
    
    if [ "$health_status" = "healthy" ] || [ "$health_status" = "none" ]; then
        log_info "Container $container_name health: $health_status"
        return 0
    else
        log_error "Container $container_name health: $health_status"
        return 1
    fi
}

check_api_endpoint() {
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -f -s http://localhost:5000/api/stats > /dev/null 2>&1; then
            log_info "API endpoint is responding"
            return 0
        fi
        retry_count=$((retry_count + 1))
        sleep 5
    done
    
    log_error "API endpoint is not responding after $max_retries attempts"
    return 1
}

check_mongodb_connection() {
    if docker exec lazward-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log_info "MongoDB is responding"
        return 0
    else
        log_error "MongoDB is not responding"
        return 1
    fi
}

check_disk_space() {
    local usage=$(df -h /home/deployer | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt 90 ]; then
        log_error "Disk usage is critical: ${usage}%"
        return 1
    elif [ "$usage" -gt 80 ]; then
        log_warn "Disk usage is high: ${usage}%"
        return 0
    else
        log_info "Disk usage is normal: ${usage}%"
        return 0
    fi
}

check_memory_usage() {
    local mem_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100.0}')
    if [ "$mem_usage" -gt 90 ]; then
        log_error "Memory usage is critical: ${mem_usage}%"
        return 1
    elif [ "$mem_usage" -gt 80 ]; then
        log_warn "Memory usage is high: ${mem_usage}%"
        return 0
    else
        log_info "Memory usage is normal: ${mem_usage}%"
        return 0
    fi
}

restart_container_if_needed() {
    local container_name=$1
    log_warn "Attempting to restart container $container_name..."
    
    cd "$PROJECT_DIR"
    docker-compose restart "$container_name"
    
    sleep 15
    
    if check_container_running "$container_name"; then
        log_info "Container $container_name restarted successfully"
        return 0
    else
        log_error "Failed to restart container $container_name"
        return 1
    fi
}

send_alert() {
    local message=$1
    # Add your alert mechanism here (email, Slack, etc.)
    log_error "ALERT: $message"
    # Example: send email or webhook notification
}

main() {
    cd "$PROJECT_DIR"
    
    log_info "Starting health check..."
    
    local failed_checks=0
    
    # Check application container
    if ! check_container_running "lazward-app"; then
        failed_checks=$((failed_checks + 1))
        restart_container_if_needed "lazward-app" || send_alert "Failed to restart application container"
    fi
    
    # Check MongoDB container
    if ! check_container_running "lazward-mongodb"; then
        failed_checks=$((failed_checks + 1))
        restart_container_if_needed "lazward-mongodb" || send_alert "Failed to restart MongoDB container"
    fi
    
    # Check container health
    if ! check_container_health "lazward-app"; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # Check API endpoint
    if ! check_api_endpoint; then
        failed_checks=$((failed_checks + 1))
        restart_container_if_needed "lazward-app" || send_alert "API endpoint not responding"
    fi
    
    # Check MongoDB connection
    if ! check_mongodb_connection; then
        failed_checks=$((failed_checks + 1))
        restart_container_if_needed "lazward-mongodb" || send_alert "MongoDB not responding"
    fi
    
    # Check system resources
    check_disk_space || failed_checks=$((failed_checks + 1))
    check_memory_usage || failed_checks=$((failed_checks + 1))
    
    if [ $failed_checks -eq 0 ]; then
        log_info "All health checks passed"
        exit 0
    else
        log_error "Health check failed with $failed_checks failed checks"
        exit 1
    fi
}

main "$@"

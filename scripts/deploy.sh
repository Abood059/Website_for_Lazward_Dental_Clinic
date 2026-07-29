#!/bin/bash

# ============================================
# Automated Deployment Script for Lazward Dental Clinic
# Optimized for low-resource VPS (1 CPU, 0.5 RAM, 25 GB)
# ============================================

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="134.122.77.174"
VPS_USER="deployer"
PROJECT_DIR="/home/deployer/lazward-dental-clinic"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_KEY="$HOME/.ssh/id_ed25519_digitalocean"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_ssh_connection() {
    log_info "Checking SSH connection to VPS..."
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
        "$VPS_USER@$VPS_HOST" "echo 'Connection successful'" > /dev/null 2>&1; then
        log_info "SSH connection successful"
        return 0
    else
        log_error "Failed to connect to VPS"
        return 1
    fi
}

setup_vps_environment() {
    log_info "Setting up VPS environment..."
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << 'ENDSSH'
        # Update system packages
        sudo apt-get update -y
        
        # Install Docker if not installed
        if ! command -v docker &> /dev/null; then
            echo "Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        fi
        
        # Install Docker Compose if not installed
        if ! command -v docker-compose &> /dev/null; then
            echo "Installing Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Create project directory
        mkdir -p ~/lazward-dental-clinic
        mkdir -p ~/lazward-dental-clinic/logs
        mkdir -p ~/lazward-dental-clinic/backups
        
        # Setup swap file for low memory (1GB)
        if [ ! -f /swapfile ]; then
            echo "Setting up swap file..."
            sudo fallocate -l 1G /swapfile
            sudo chmod 600 /swapfile
            sudo mkswap /swapfile
            sudo swapon /swapfile
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        fi
        
        # Configure firewall (UFW)
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw --force enable
        
        echo "VPS environment setup complete"
ENDSSH
}

copy_files_to_vps() {
    log_info "Copying files to VPS..."
    
    # Create necessary directories
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "mkdir -p $PROJECT_DIR/{config,routes,controllers,models,services,middleware,validations,utils,images,uploads}"
    
    # Copy Docker files
    scp -i "$SSH_KEY" "$LOCAL_DIR/docker-compose.yml" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" "$LOCAL_DIR/Dockerfile" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" "$LOCAL_DIR/.dockerignore" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    
    # Copy package files
    scp -i "$SSH_KEY" "$LOCAL_DIR/package.json" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" "$LOCAL_DIR/package-lock.json" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    
    # Copy application files
    scp -i "$SSH_KEY" "$LOCAL_DIR/server.js" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" "$LOCAL_DIR/app.js" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    
    # Copy directories
    scp -i "$SSH_KEY" -r "$LOCAL_DIR/config/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" -r "$LOCAL_DIR/routes/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" -r "$LOCAL_DIR/controllers/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" -r "$LOCAL_DIR/models/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" -r "$LOCAL_DIR/services/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" -r "$LOCAL_DIR/middleware/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" -r "$LOCAL_DIR/validations/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    scp -i "$SSH_KEY" -r "$LOCAL_DIR/utils/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    
    # Copy static files
    scp -i "$SSH_KEY" "$LOCAL_DIR"/*.html "$VPS_USER@$VPS_HOST:$PROJECT_DIR/" 2>/dev/null || true
    scp -i "$SSH_KEY" "$LOCAL_DIR"/*.css "$VPS_USER@$VPS_HOST:$PROJECT_DIR/" 2>/dev/null || true
    scp -i "$SSH_KEY" "$LOCAL_DIR"/*.js "$VPS_USER@$VPS_HOST:$PROJECT_DIR/" 2>/dev/null || true
    
    # Copy images if exists
    if [ -d "$LOCAL_DIR/images" ]; then
        scp -i "$SSH_KEY" -r "$LOCAL_DIR/images/" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    fi
    
    log_info "Files copied successfully"
}

setup_environment_variables() {
    log_info "Setting up environment variables..."
    
    if [ ! -f "$LOCAL_DIR/.env" ]; then
        log_warn ".env file not found. Creating template..."
        cat > "$LOCAL_DIR/.env.example" << EOF
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://lazward:CHANGE_THIS_PASSWORD@mongodb:27017/lazord_lab?authSource=admin
MONGO_USERNAME=lazward
MONGO_PASSWORD=CHANGE_THIS_PASSWORD
JWT_SECRET=CHANGE_THIS_TO_STRONG_SECRET
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@lazord.com
EOF
        log_error "Please create .env file with your actual values"
        return 1
    fi
    
    # Copy .env file to VPS
    scp -i "$SSH_KEY" "$LOCAL_DIR/.env" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/"
    
    log_info "Environment variables set up"
}

deploy_application() {
    log_info "Deploying application..."
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << ENDSSH
        cd $PROJECT_DIR
        
        # Stop existing containers
        docker-compose down || true
        
        # Build and start containers
        docker-compose up -d --build
        
        # Wait for containers to be healthy
        echo "Waiting for containers to be healthy..."
        sleep 30
        
        # Check container status
        docker-compose ps
        
        # Show logs
        docker-compose logs --tail=50
ENDSSH
}

health_check() {
    log_info "Running health checks..."
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << ENDSSH
        # Check if containers are running
        if ! docker ps | grep -q lazward-app; then
            echo "ERROR: Application container is not running"
            exit 1
        fi
        
        if ! docker ps | grep -q lazward-mongodb; then
            echo "ERROR: MongoDB container is not running"
            exit 1
        fi
        
        # Check API endpoint
        sleep 10
        if curl -f http://localhost:5000/api/stats > /dev/null 2>&1; then
            echo "Health check passed"
        else
            echo "ERROR: API endpoint not responding"
            exit 1
        fi
ENDSSH
}

setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << 'ENDSSH'
        sudo tee /etc/logrotate.d/lazward-docker << EOF
/home/deployer/lazward-dental-clinic/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 deployer deployer
}
EOF
ENDSSH
}

setup_cron_jobs() {
    log_info "Setting up cron jobs for backups..."
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << 'ENDSSH'
        # Add backup script to cron (daily at 2 AM)
        (crontab -l 2>/dev/null; echo "0 2 * * * cd ~/lazward-dental-clinic && ./scripts/backup.sh >> logs/backup.log 2>&1") | crontab -
        
        # Add health check to cron (every 5 minutes)
        (crontab -l 2>/dev/null; echo "*/5 * * * * cd ~/lazward-dental-clinic && ./scripts/health-check.sh >> logs/health.log 2>&1") | crontab -
ENDSSH
}

main() {
    log_info "Starting deployment process..."
    
    # Check prerequisites
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key not found at $SSH_KEY"
        exit 1
    fi
    
    # Execute deployment steps
    check_ssh_connection || exit 1
    setup_vps_environment
    copy_files_to_vps
    setup_environment_variables || exit 1
    deploy_application
    health_check || exit 1
    setup_log_rotation
    setup_cron_jobs
    
    log_info "Deployment completed successfully!"
    log_info "Application is running at http://$VPS_HOST:5000"
}

# Run main function
main "$@"

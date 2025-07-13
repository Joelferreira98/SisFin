#!/bin/bash

# Deployment script for VPS with MySQL
# Make sure to run this script with sudo privileges

echo "🚀 Starting Finance Manager deployment on VPS..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker and Docker Compose
echo "🐳 Installing Docker and Docker Compose..."
apt install -y docker.io docker-compose
systemctl start docker
systemctl enable docker

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /opt/finance-manager
cd /opt/finance-manager

# Copy application files (assuming you've uploaded them to the server)
echo "📄 Make sure you have uploaded all project files to /opt/finance-manager/"

# Set permissions
echo "🔒 Setting permissions..."
chown -R root:root /opt/finance-manager
chmod +x deploy.sh

# Create environment file
echo "⚙️  Creating environment file..."
cat > .env << EOF
EVOLUTION_API_URL=https://your-evolution-api-url.com
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_INSTANCE_NAME=your-instance-name
NODE_ENV=production
EOF

echo "📝 Please edit the .env file with your actual Evolution API credentials:"
echo "nano .env"
echo ""
echo "After configuring .env, run:"
echo "docker-compose up -d"
echo ""
echo "✅ Setup complete! The application will be available at http://your-server-ip:3000"
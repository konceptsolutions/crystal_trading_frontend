#!/bin/bash

# Setup systemd service for KSO application

set -e

SERVICE_FILE="systemd/kso.service"
SYSTEMD_DIR="/etc/systemd/system"

echo "Setting up systemd service..."

sudo cp "$SERVICE_FILE" "$SYSTEMD_DIR/kso.service"
sudo systemctl daemon-reload
sudo systemctl enable kso.service

echo "✓ Systemd service installed and enabled"
echo ""
echo "Useful commands:"
echo "  Start:   sudo systemctl start kso"
echo "  Stop:    sudo systemctl stop kso"
echo "  Status:  sudo systemctl status kso"
echo "  Logs:    sudo journalctl -u kso -f"


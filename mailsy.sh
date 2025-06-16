#!/bin/bash

set -e

GIT_REPO="https://github.com/isawebapp/mailsy.git"
INSTALL_DIR="$HOME/mailsy"

show_menu() {
  echo "========== Mailsy Installer =========="
  echo "1) Install"
  echo "2) Update"
  echo "3) Uninstall"
  echo "======================================="
  read -p "Select an option [1-3]: " CHOICE
  case $CHOICE in
    1) install_mailsy ;;
    2) update_mailsy ;;
    3) uninstall_mailsy ;;
    *) echo "Invalid choice. Exiting." ; exit 1 ;;
  esac
}

install_mailsy() {
  echo "🚀 Starting Mailsy Installation..."

  # 1. System dependencies
  echo "📦 Installing system dependencies..."
  sudo apt update
  sudo apt install -y git curl sqlite3 build-essential

  # 2. Node.js: Must be at least v18, but install 22 if not installed at all
  echo "🔍 Checking Node.js version..."
  if command -v node >/dev/null 2>&1; then
    VERSION=$(node -v | sed 's/^v//')
    MAJOR=${VERSION%%.*}
    if [ "$MAJOR" -lt 18 ]; then
      echo "❌ Node.js v$VERSION detected (<18)."
      read -p "Do you want to install Node.js 22? (y/n): " INSTALL_22
      if [[ "$INSTALL_22" =~ ^[Yy]$ ]]; then
        echo "⬇️ Installing Node.js 22..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt install -y nodejs
      else
        echo "❌ Installation requires Node.js >=18. Exiting."
        exit 1
      fi
    else
      echo "✅ Node.js v$VERSION detected. Skipping installation."
    fi
  else
    echo "❗ Node.js not found. Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
  fi

  # 3. PM2
  echo "📦 Installing PM2..."
  npm install -g pm2

  # 4. Clone repo
  if [ -d "$INSTALL_DIR" ]; then
    if [ -d "$INSTALL_DIR/.git" ]; then
      echo "📂 Repository already exists. Pulling latest changes..."
      cd "$INSTALL_DIR"
      git pull
    else
      echo "⚠️ Directory exists but is not a git repository. Removing and cloning fresh..."
      rm -rf "$INSTALL_DIR"
      git clone "$GIT_REPO" "$INSTALL_DIR"
      cd "$INSTALL_DIR"
    fi
  else
    git clone "$GIT_REPO" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi

  # 5. TypeScript
  echo "📦 Installing TypeScript..."
  npm install -g typescript

  # 6. Env vars
  echo "🔧 Configuring environment variables..."
  read -p "🔑 Cloudflare Turnstile site key: " SITE_KEY
  read -p "🔑 Cloudflare Turnstile secret key: " SECRET_KEY
  read -p "🌐 Allowed domains (comma-separated, e.g. localhost:3000,example.com): " DOMAINS
  read -p "👤 Admin username: " ADMIN_USER
  read -s -p "🔒 Admin password: " ADMIN_PASS
  echo ""
  read -s -p "🔐 Session password (min 32 characters): " SESSION_PASS
  echo ""
  while [ ${#SESSION_PASS} -lt 32 ]; do
    echo "❌ Session password must be at least 32 characters"
    read -s -p "🔐 Please enter a session password (min 32 characters): " SESSION_PASS
    echo ""
  done
  read -p "🚪 Port to serve the app on (default 3000): " APP_PORT
  APP_PORT=${APP_PORT:-3000}

  cat > .env.local <<EOF
NEXT_PUBLIC_TURNSTILE_SITE_KEY=$SITE_KEY
TURNSTILE_SECRET_KEY=$SECRET_KEY

ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASS

SESSION_PASSWORD=$SESSION_PASS

DOMAINS=$DOMAINS
PORT=$APP_PORT
EOF

  echo "✅ .env.local created"

  # 7. Project deps
  echo "📦 Installing project dependencies..."
  npm install

  # 8. Build
  echo "🏗  Building the app..."
  npm run build

  # 9. Start PM2
  echo "🚀 Starting Mailsy under PM2 on port $APP_PORT..."
  pm2 start "npm run start -- -p $APP_PORT" --name "mailsy"
  pm2 save
  pm2 startup

  echo ""
  echo "🎉 Installation complete!"
  echo "🔗 Visit: http://localhost:$APP_PORT"
  echo "🛑 To view PM2 processes: pm2 list"
  echo "📄 To see logs: pm2 logs mailsy"
}

update_mailsy() {
  echo "🔄 Updating Mailsy..."

  if [ ! -d "$INSTALL_DIR/.git" ]; then
    echo "❌ Mailsy not installed or not a git repository in $INSTALL_DIR."
    exit 1
  fi

  cd "$INSTALL_DIR"
  git pull

  echo "📦 Updating dependencies..."
  npm install

  echo "🏗  Rebuilding the app..."
  npm run build

  echo "🚀 Restarting Mailsy with PM2..."
  pm2 restart mailsy

  echo "✅ Update complete!"
  echo "🔗 Visit: http://localhost:$(grep PORT .env.local | cut -d'=' -f2)"
}

uninstall_mailsy() {
  echo "🗑️  Uninstalling Mailsy..."

  if pm2 list | grep -q mailsy; then
    pm2 stop mailsy
    pm2 delete mailsy
  fi

  if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "🧹 Removed $INSTALL_DIR"
  else
    echo "Mailsy directory not found."
  fi

  echo "❗ Note: Node.js, PM2, and other system dependencies are NOT removed."
  echo "❗ Remove them manually if desired: sudo apt remove nodejs pm2 ..."
  echo "✅ Uninstall complete!"
}

show_menu
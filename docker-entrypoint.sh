#!/bin/sh
set -e

echo "🚀 Starting Voter WhatsApp Bot..."

# Change to app directory
cd /app

# Ensure necessary directories exist and have correct permissions
echo "📁 Creating necessary directories..."
mkdir -p /app/data /app/auth_info /app/logs

# Set proper ownership (we're running as root initially)
chown -R nextjs:nodejs /app/data /app/auth_info /app/logs

# Database setup
echo "🗄️  Setting up database..."

# Check if database file exists
if [ ! -f "/app/data/sqlite.db" ]; then
    echo "📋 Database not found, creating new database..."
    
    # Run Prisma migrations
    echo "🔄 Running Prisma migrations..."
    bun run db:migrate:deploy
    
    # Seed the database
    echo "🌱 Seeding database..."
    bun run db:seed || echo "⚠️  Seeding failed or already seeded"
    
    # Set ownership of the database file
    chown nextjs:nodejs /app/data/sqlite.db 2>/dev/null || true
else
    echo "✅ Database already exists"
    
    # Run migrations to ensure schema is up to date
    echo "🔄 Checking for pending migrations..."
    bun run db:migrate:deploy || echo "⚠️  Migration failed, continuing anyway..."
fi

# Verify database
if [ -f "/app/data/sqlite.db" ]; then
    echo "✅ Database setup completed successfully"
    
    # Ensure database is readable by nextjs user
    chmod 664 /app/data/sqlite.db 2>/dev/null || true
    chown nextjs:nodejs /app/data/sqlite.db 2>/dev/null || true
else
    echo "❌ Database setup failed!"
    exit 1
fi

echo "🎯 Starting services with supervisord..."
echo "   - Next.js App (Port 3000)"
echo "   - WhatsApp Service (Port 3001)"
echo ""

# Execute the command passed to docker run
exec "$@"

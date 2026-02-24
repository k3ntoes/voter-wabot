# 🐳 Docker Deployment dengan Supervisord

Dokumentasi untuk deployment Voter WhatsApp Bot menggunakan Docker dengan Supervisord untuk menjalankan Next.js dan WhatsApp Bot Service secara bersamaan.

## 📋 Arsitektur

Aplikasi ini menggunakan:
- **Single Container**: Menjalankan Next.js dan WhatsApp Service dalam satu container
- **Supervisord**: Process manager untuk mengelola kedua service
- **Database**: SQLite dengan volume persistence
- **Auto Setup**: Database otomatis di-setup saat container pertama kali dijalankan

## 🚀 Quick Start

### 1. Setup Environment Variables

Salin file `.env.docker` ke `.env`:

```bash
cp .env.docker .env
```

Edit `.env` dan ubah `SESSION_SECRET`:

```env
SESSION_SECRET=ganti-dengan-secret-key-anda-minimal-32-karakter
```

### 2. Build dan Jalankan

```bash
# Build image
docker compose build

# Jalankan container
docker compose up -d

# Lihat logs
docker compose logs -f
```

### 3. Akses Aplikasi

- **Next.js App**: http://localhost:3000
- **WhatsApp Service**: http://localhost:3001

## 📦 Menggunakan Makefile

```bash
# Setup awal (build + up)
make init

# Build images
make build

# Jalankan containers
make up

# Stop containers
make down

# Lihat logs
make logs

# Restart containers
make restart

# Lihat semua commands
make help
```

## 🔧 Struktur File Docker

```
.
├── Dockerfile              # Multi-stage build dengan Bun
├── docker-compose.yml      # Orchestration file
├── supervisord.conf        # Konfigurasi supervisord
├── docker-entrypoint.sh    # Entrypoint script untuk setup DB
├── .dockerignore          # File yang diabaikan saat build
└── .env                   # Environment variables
```

## 📝 Detail Dockerfile

### Stage 1: Base
- Base image: `oven/bun:1.1.42-alpine`
- Install dependencies sistem (Python, make, cairo, supervisor, wget)

### Stage 2: Dependencies
- Install npm dependencies untuk main app dan whatsapp-service

### Stage 3: Builder
- Generate Prisma Client
- Build Next.js application (standalone mode)

### Stage 4: Runner (Production)
- Copy built files
- Setup user permissions
- Configure supervisord
- Setup entrypoint

## ⚙️ Supervisord Configuration

Supervisord mengelola 2 program:

1. **nextjs** (Priority 100)
   - Command: `bun run start`
   - Port: 3000
   - Auto restart: Yes

2. **whatsapp-service** (Priority 200)
   - Command: `bun run start`
   - Port: 3001
   - Auto restart: Yes

Logs tersimpan di:
- `/app/logs/nextjs-output.log`
- `/app/logs/nextjs-error.log`
- `/app/logs/whatsapp-output.log`
- `/app/logs/whatsapp-error.log`

## 🗄️ Database Setup

Entrypoint script (`docker-entrypoint.sh`) otomatis:

1. Membuat direktori `data/`, `auth_info/`, `logs/`
2. Check apakah database sudah ada
3. Jika belum ada:
   - Menjalankan `prisma migrate deploy`
   - Menjalankan `prisma db seed`
4. Set permissions yang tepat
5. Start supervisord

## 📊 Volumes

Data berikut di-persist dengan volumes:

```yaml
volumes:
  - ./data:/app/data              # SQLite database
  - ./auth_info:/app/auth_info    # WhatsApp session
  - ./logs:/app/logs              # Application logs
```

## 🔍 Monitoring

### Health Check

Container memiliki health check yang mengecek endpoint `/api/health`:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Check Status Container

```bash
# Status semua services
docker compose ps

# Logs real-time
docker compose logs -f

# Logs untuk service tertentu
docker compose logs -f app

# Check supervisord status (inside container)
docker compose exec app supervisorctl status
```

## 🛠️ Troubleshooting

### Container tidak start

```bash
# Lihat logs
docker compose logs

# Rebuild tanpa cache
docker compose build --no-cache
```

### Database error

```bash
# Masuk ke container
docker compose exec app sh

# Check database file
ls -la /app/data/

# Manual migration
bun run db:migrate:deploy
```

### Permission errors

```bash
# Fix permissions pada host
sudo chown -R 1001:1001 data/ auth_info/ logs/
```

### Restart specific service di supervisord

```bash
# Masuk ke container
docker compose exec app sh

# Gunakan supervisorctl
supervisorctl restart nextjs
supervisorctl restart whatsapp-service
supervisorctl status
```

## 🔄 Update dan Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild dan restart
docker compose down
docker compose build
docker compose up -d
```

### Backup Database

```bash
# Backup database
docker compose exec app sh -c "cp /app/data/sqlite.db /app/data/backup-$(date +%Y%m%d-%H%M%S).db"

# Copy backup ke host
docker compose cp app:/app/data/backup-*.db ./backups/
```

### View Logs

```bash
# All logs
docker compose logs

# Follow logs
docker compose logs -f

# Logs dari supervisord
docker compose exec app tail -f /app/logs/supervisord.log

# Logs Next.js
docker compose exec app tail -f /app/logs/nextjs-output.log

# Logs WhatsApp Service
docker compose exec app tail -f /app/logs/whatsapp-output.log
```

## 🌐 Environment Variables

Required environment variables di `.env`:

```env
# Database
DATABASE_URL=file:/app/data/sqlite.db

# Session Secret (WAJIB DIGANTI!)
SESSION_SECRET=your-secret-key-min-32-characters

# WhatsApp Service
WHATSAPP_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_WHATSAPP_SERVICE_URL=http://localhost:3001

# Environment
NODE_ENV=production
```

## 🔐 Security Notes

1. **Ganti SESSION_SECRET** di production!
2. Jangan commit `.env` file
3. Gunakan environment variables untuk secrets
4. Container berjalan sebagai non-root user (`nextjs:nodejs`)
5. Hanya expose port yang diperlukan

## 📈 Performance Tips

1. **Build dengan cache**: Default build menggunakan layer caching
2. **Rebuild tanpa cache**: `docker compose build --no-cache` (saat ada masalah)
3. **Resource limits**: Tambahkan di docker-compose.yml jika diperlukan

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## 🎯 Production Deployment

### Menggunakan Docker Compose di Server

```bash
# Clone repository
git clone <repo-url>
cd antigravity

# Setup environment
cp .env.docker .env
nano .env  # Edit SESSION_SECRET

# Build dan run
docker compose up -d

# Monitor
docker compose logs -f
```

### Menggunakan Docker Swarm atau Kubernetes

Untuk production scale yang lebih besar, pertimbangkan:
- Docker Swarm untuk multi-host deployment
- Kubernetes untuk orchestration yang lebih advanced
- Separate database service (PostgreSQL/MySQL)

## 📞 Support

Jika mengalami masalah:
1. Check logs: `docker compose logs`
2. Check status: `docker compose ps`
3. Restart: `docker compose restart`
4. Rebuild: `docker compose down && docker compose build && docker compose up -d`

## 📚 References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Supervisord Documentation](http://supervisord.org/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Bun Docker](https://bun.sh/docs/installation#docker)

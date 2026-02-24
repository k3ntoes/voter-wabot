# Docker Deployment Guide

## 🐳 Docker Setup

Project ini menggunakan Docker dengan arsitektur multi-container:
- **Frontend**: Next.js application (Port 3000)
- **WhatsApp Service**: Baileys WhatsApp bot (Port 3001)
- **Shared Database**: SQLite database dengan shared volume

## 📋 Prerequisites

- Docker (v20.10 atau lebih baru)
- Docker Compose (v2.0 atau lebih baru)

## 🚀 Quick Start

### Menggunakan Makefile (Recommended)

```bash
# Setup awal project (otomatis setup .env, build, up, dan database)
make init

# Lihat semua command yang tersedia
make help
```

### Manual Setup

#### 1. Setup Environment Variables

Salin file `.env.docker` ke `.env`:

```bash
cp .env.docker .env
# Atau menggunakan make
make env
```

Edit `.env` dan ubah nilai `SESSION_SECRET`:

```env
SESSION_SECRET=your-super-secret-key-change-this-in-production
```

#### 2. Build dan Jalankan Container

```bash
# Build images
docker-compose build
# Atau: make build

# Jalankan container
docker-compose up -d
# Atau: make up

# Atau build dan jalankan sekaligus
docker-compose up -d --build
```

#### 3. Setup Database (First Time Only)

Database akan di-setup otomatis saat container pertama kali dijalankan. Untuk seed database:

```bash
# Menggunakan make
make db-setup

# Atau manual
docker-compose exec frontend bunx prisma migrate deploy
docker-compose exec frontend bun /app/prisma/seed.ts
```

#### 4. Akses Aplikasi

- **Frontend**: http://localhost:3000
- **WhatsApp Service**: http://localhost:3001

## �️ Makefile Commands

Project ini dilengkapi dengan Makefile untuk mempermudah development workflow. Jalankan `make help` untuk melihat semua command yang tersedia.

### Build Commands
```bash
make build              # Build semua Docker images
make build-frontend     # Build frontend image saja
make build-whatsapp     # Build WhatsApp service image saja
make rebuild            # Rebuild dari scratch (no cache)
```

### Container Management
```bash
make up                 # Jalankan semua container
make down               # Stop dan hapus semua container
make down-volumes       # Stop container dan hapus volumes (⚠️ DATA TERHAPUS!)
make start              # Start container yang sudah ada
make stop               # Stop container tanpa menghapus
make restart            # Restart semua container
make restart-frontend   # Restart frontend saja
make restart-whatsapp   # Restart WhatsApp service saja
```

### Logs & Monitoring
```bash
make logs               # Lihat logs semua container (follow)
make logs-frontend      # Lihat logs frontend saja
make logs-whatsapp      # Lihat logs WhatsApp service saja
make ps                 # Lihat status container
make stats              # Lihat resource usage container
make health             # Check container health
```

### Database Management
```bash
make migrate            # Jalankan database migrations
make migrate-reset      # Reset database (⚠️ DATA TERHAPUS!)
make seed               # Seed database dengan data awal
make studio             # Buka Prisma Studio
make db-setup           # Setup database lengkap (migrate + seed)
```

### Backup & Restore
```bash
make backup             # Backup database dan WhatsApp auth data
make restore            # Restore database dari backup
```

### Development
```bash
make init               # Setup awal project (build + up + db-setup)
make dev                # Build dan jalankan untuk development (dengan logs)
make prod               # Build dan jalankan untuk production
make env                # Copy template .env.docker ke .env
```

### Shell Access
```bash
make exec-frontend      # Akses shell frontend container
make exec-whatsapp      # Akses shell WhatsApp service container
```

### Cleanup
```bash
make clean              # Hapus container, images, dan build cache
make clean-all          # Hapus SEMUA (⚠️ termasuk volumes dan images!)
```

## 📝 Docker Compose Commands (Manual)

```bash
# Lihat logs semua service
docker-compose logs -f

# Lihat logs frontend saja
docker-compose logs -f frontend

# Lihat logs whatsapp-service saja
docker-compose logs -f whatsapp-service

# Stop semua container
docker-compose down

# Stop dan hapus volumes (database akan terhapus!)
docker-compose down -v

# Restart service tertentu
docker-compose restart frontend
docker-compose restart whatsapp-service

# Rebuild image tertentu
docker-compose build frontend
docker-compose build whatsapp-service
```

## 🗄️ Database Management

### Jalankan Migrations

```bash
docker-compose exec frontend bunx prisma migrate deploy
```

### Reset Database

```bash
docker-compose exec frontend bunx prisma migrate reset --force
```

### Seed Database

```bash
docker-compose exec frontend bun /app/prisma/seed.ts
```

### Prisma Studio

```bash
docker-compose exec frontend bunx prisma studio
```

## 🔍 Troubleshooting

### Container tidak bisa start

```bash
# Lihat logs untuk error
docker-compose logs

# Cek status container
docker-compose ps
```

### Database permission errors

```bash
# Pastikan volume memiliki permission yang benar
docker-compose down -v
docker-compose up -d
```

### WhatsApp connection issues

```bash
# Clear WhatsApp session data
docker-compose down
docker volume rm antigravity_whatsapp-auth
docker-compose up -d
```

### Rebuild from scratch

```bash
# Hapus semua container, images, dan volumes
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 📦 Volumes

Project ini menggunakan 2 Docker volumes:

- `db-data`: Menyimpan SQLite database (shared antara frontend & whatsapp-service)
- `whatsapp-auth`: Menyimpan session data WhatsApp (Baileys)

### Backup Volumes

```bash
# Backup database
docker run --rm -v antigravity_db-data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz -C /data .

# Backup WhatsApp auth
docker run --rm -v antigravity_whatsapp-auth:/data -v $(pwd):/backup alpine tar czf /backup/wa-auth-backup.tar.gz -C /data .
```

### Restore Volumes

```bash
# Restore database
docker run --rm -v antigravity_db-data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/db-backup.tar.gz"

# Restore WhatsApp auth
docker run --rm -v antigravity_whatsapp-auth:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/wa-auth-backup.tar.gz"
```

## 🔒 Production Deployment

### Security Checklist

- [ ] Ubah `SESSION_SECRET` dengan nilai random yang kuat
- [ ] Set `SEED_DATABASE=false` di production
- [ ] Review environment variables di `.env`
- [ ] Gunakan HTTPS reverse proxy (nginx, traefik, caddy)
- [ ] Setup firewall rules
- [ ] Backup database secara berkala

### Recommended Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
│                                         │
│  ┌──────────────┐    ┌───────────────┐ │
│  │   Frontend   │    │   WhatsApp    │ │
│  │  (Next.js)   │◄──►│   Service     │ │
│  │   :3000      │    │   :3001       │ │
│  └──────┬───────┘    └───────┬───────┘ │
│         │                    │         │
│         │    ┌──────────┐    │         │
│         └───►│ Database │◄───┘         │
│              │ (SQLite) │              │
│              └──────────┘              │
│                                         │
│              ┌──────────┐              │
│              │ WA Auth  │              │
│              │  Data    │              │
│              └──────────┘              │
└─────────────────────────────────────────┘
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)

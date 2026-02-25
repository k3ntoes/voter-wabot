# WhatsApp Voter Registration System

Aplikasi sistem registrasi pemilih menggunakan WhatsApp bot dengan Next.js 16 dan Express server terpisah.

## 🏗️ Arsitektur

Sistem ini menggunakan arsitektur terpisah untuk performa dan keandalan yang lebih baik:

```
┌─────────────────────────────────────────────────┐
│                Next.js Frontend                  │
│            (http://localhost:3000)               │
│         Dashboard Admin & Web Interface          │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP API Calls
                 ▼
┌─────────────────────────────────────────────────┐
│           Express WhatsApp Server                │
│            (http://localhost:3001)               │
│  ┌─────────────────────────────────────────┐    │
│  │  WhatsApp Bot Service (Baileys)         │    │
│  │  - QR Code Generation                   │    │
│  │  - Message Handler                      │    │
│  │  - Auto Reconnect                       │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │  Queue Processor                        │    │
│  │  - Message Queue                        │    │
│  │  - Batch Processing                     │    │
│  │  - Anti-spam Delay                      │    │
│  └─────────────────────────────────────────┘    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ SQLite Database│
         │  (Prisma ORM)  │
         └───────────────┘
```

### Mengapa Arsitektur Terpisah?

✅ **Long-running Process**: WhatsApp bot memerlukan koneksi terus-menerus  
✅ **Reliable**: Express server lebih cocok untuk WebSocket connections  
✅ **Scalable**: Mudah di-scale secara terpisah  
✅ **Production Ready**: Cocok untuk deployment di VPS/server

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Database

```bash
# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed database (admin user)
bun run db:seed
```

### 3. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` sesuai kebutuhan.

### 4. Run Development

**Jalankan SEMUA dengan 1 perintah:**

```bash
bun run dev
```

Ini akan menjalankan:
- ✅ Next.js frontend di `http://localhost:3000`
- ✅ Express WhatsApp server di `http://localhost:3001`

**Atau jalankan secara terpisah:**

```bash
# Terminal 1: Next.js
bun run dev:next

# Terminal 2: WhatsApp Server
bun run dev:whatsapp
```

## 🐳 Docker Deployment

Project ini mendukung deployment dengan Docker untuk production environment.

### Quick Start dengan Docker

```bash
# Setup awal (otomatis setup .env, build, up, dan database)
make init

# Lihat semua command yang tersedia
make help
```

### Common Docker Commands

```bash
# Development
make dev                # Build dan jalankan dengan logs
make logs              # Lihat logs semua container

# Production
make build             # Build images
make up                # Jalankan container
make down              # Stop container

# Database
make db-setup          # Setup database (migrate + seed)
make backup            # Backup database
make restore           # Restore dari backup

# Monitoring
make health            # Check container health
make ps                # Lihat status container
```

📖 **Full documentation**: Lihat [DOCKER.md](DOCKER.md) untuk panduan lengkap deployment dengan Docker.

### 5. Login & Scan QR Code

1. Buka `http://localhost:3000/login`
2. Login dengan kredensial dari `.env.local` (default: admin/admin123)
3. WhatsApp bot akan auto-start saat server berjalan
4. Scan QR code yang muncul di terminal WhatsApp server

## 📁 Struktur Project

```
.
├── src/                        # Next.js app
│   ├── app/
│   │   ├── (auth)/            # Auth pages (login)
│   │   ├── (dashboard)/       # Dashboard pages
│   │   └── api/               # API routes (proxy ke Express)
│   ├── components/            # React components
│   └── lib/                   # Utilities & DAL
│
├── whatsapp-server/           # ⭐ Express WhatsApp Server
│   ├── server.ts              # Main Express app
│   ├── whatsapp-service.ts    # WhatsApp bot service
│   ├── queue-processor.ts     # Message queue processor
│   ├── queue-manager.ts       # Queue management
│   ├── auth-state.ts          # WhatsApp auth state (DB)
│   ├── voters-dal.ts          # Voters data access
│   └── db.ts                  # Prisma client
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
│
└── package.json
```

## 🔧 Available Scripts

### Development
```bash
bun run dev              # 🚀 Run both Next.js & WhatsApp server
bun run dev:next         # Run only Next.js
bun run dev:whatsapp     # Run only WhatsApp server
```

### Production
```bash
bun run build            # Build Next.js for production
bun run start            # 🚀 Run both servers in production
bun run start:next       # Run only Next.js production
bun run start:whatsapp   # Run only WhatsApp server
```

### Database
```bash
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Run database migrations
bun run db:seed          # Seed database
bun run db:studio        # Open Prisma Studio
bun run db:reset         # Reset database
```

### Code Quality
```bash
bun run lint             # Check code with Biome
bun run lint:fix         # Fix code issues
bun run format           # Format code
bun run typecheck        # Check TypeScript types
```

## 📡 API Endpoints

### Next.js API (http://localhost:3000/api)
Proxy endpoints ke WhatsApp server:
- `POST /api/bot/start` - Start WhatsApp bot
- `POST /api/bot/stop` - Stop WhatsApp bot
- `GET /api/bot/status` - Get bot status
- `GET /api/queue/stats` - Get queue statistics
- `POST /api/queue/cleanup` - Clean old messages

### WhatsApp Server Direct (http://localhost:3001/api)
- `GET /health` - Health check
- `POST /api/bot/start` - Start WhatsApp bot
- `POST /api/bot/stop` - Stop WhatsApp bot
- `GET /api/bot/status` - Get bot status & QR code
- `GET /api/queue/stats` - Get queue statistics
- `POST /api/queue/cleanup` - Clean up old messages
- `POST /api/message/send` - Send message (queue)

## 📱 WhatsApp Bot Features

### Registration Flow
1. User kirim pesan ke bot dengan format:
   ```
   Nama: John Doe
   Organisasi: PT. Example
   ```

2. Bot validasi format & cek duplikasi

3. Bot simpan ke database (status: PENDING)

4. Bot kirim konfirmasi ke user

5. Admin verifikasi dari dashboard

### Message Queue
- ✅ Auto-queue semua pesan outgoing
- ✅ Delay 2 detik antar pesan (anti-spam)
- ✅ Auto-retry gagal (max 3x)
- ✅ Batch processing (5 pesan/batch)
- ✅ Persistent di database

### Connection Monitoring
- ✅ Auto-reconnect saat disconnect
- ✅ Max 10 reconnect attempts
- ✅ Connection logs di database
- ✅ QR code auto-refresh
- ✅ Health check endpoint

## 🗄️ Database Schema

### Tables
- `Voter` - Data pemilih (phone, name, organization, status)
- `Admin` - Admin users (username, password_hash)
- `WhatsAppSession` - WhatsApp session data (key, value)
- `MessageQueue` - Outgoing message queue (phone, message, status, attempts)
- `ConnectionLog` - Connection history (status, qr_code, error)

## 🚢 Production Deployment

### Rekomendasi: VPS dengan PM2

1. **Install PM2 globally**
```bash
npm install -g pm2
```

2. **Build aplikasi**
```bash
bun run build
```

3. **Create ecosystem config**

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'nextjs-voter',
      script: 'bun',
      args: 'run start:next',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'whatsapp-bot',
      script: 'bun',
      args: 'run start:whatsapp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WHATSAPP_PORT: 3001,
      },
    },
  ],
};
```

4. **Start with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. **Monitor**
```bash
pm2 status
pm2 logs
pm2 monit
```

### Alternative: Docker

Create `Dockerfile`:

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 3000 3001
CMD ["bun", "run", "start"]
```

Run:
```bash
docker build -t voter-wabot .
docker run -p 3000:3000 -p 3001:3001 -v $(pwd)/data:/app/data voter-wabot
```

## 🔒 Security Checklist

- ✅ Session menggunakan JWT encrypted
- ✅ Password di-hash dengan bcrypt
- ✅ CORS configured
- ✅ Database credentials di environment variables
- ✅ Separate server untuk WhatsApp bot
- ⚠️ Ganti `SESSION_SECRET` di production
- ⚠️ Ganti default admin password

## 🐛 Troubleshooting

### WhatsApp tidak connect
1. Cek terminal WhatsApp server untuk QR code
2. Pastikan scan QR dengan HP yang sama
3. Cek connection logs: `GET /api/bot/status`
4. Lihat recent logs di response

### Message tidak terkirim
1. Cek queue status: `GET /api/queue/stats`
2. Cek bot status: `GET /api/bot/status` (healthy?)
3. Lihat logs di terminal WhatsApp server
4. Cek table `MessageQueue` di database

### Express server tidak jalan
1. Cek port 3001 sudah terpakai: `lsof -i :3001`
2. Cek environment variable `WHATSAPP_PORT`
3. Cek logs di terminal

### Database error
```bash
# Reset database
bun run db:reset

# Re-generate Prisma client
bun run db:generate

# Re-seed
bun run db:seed
```

### Next.js tidak connect ke Express
1. Cek `WHATSAPP_SERVER_URL` di `.env.local`
2. Pastikan Express server sudah running
3. Test directly: `curl http://localhost:3001/health`

## 📊 Monitoring

### Health Checks
```bash
# Next.js
curl http://localhost:3000/api/bot/status

# WhatsApp Server
curl http://localhost:3001/health
```

### Queue Statistics
```bash
curl http://localhost:3001/api/queue/stats
```

### Bot Status
```bash
curl http://localhost:3001/api/bot/status
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

MIT

## 👨‍💻 Developer

Built with ❤️ using:
- Next.js 16.1.6
- Express 5
- Baileys (WhatsApp Web API)
- Prisma ORM
- SQLite
- TypeScript
- Bun Runtime
- Concurrently

---

**Catatan Penting**: 
- WhatsApp bot akan auto-start saat server Express berjalan
- QR code akan muncul di terminal (tidak di dashboard lagi)
- Scan QR code dalam 60 detik
- Session tersimpan di database, tidak perlu scan ulang

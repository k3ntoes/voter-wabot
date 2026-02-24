# WhatsApp Service

Service terpisah untuk menjalankan WhatsApp bot dengan Baileys.

## Cara Menjalankan

```bash
cd whatsapp-service
bun run dev
```

## Endpoints

- `GET /health` - Health check
- `GET /api/status` - Cek status koneksi WhatsApp
- `GET /api/qr` - Dapatkan QR code untuk login
- `POST /api/start` - Mulai koneksi WhatsApp
- `POST /api/stop` - Hentikan koneksi dan logout
- `POST /api/send-message` - Kirim pesan
  ```json
  {
    "to": "628xxxxxxxxx",
    "message": "Halo!"
  }
  ```

## Environment Variables

- `WHATSAPP_SERVICE_PORT` - Port untuk service (default: 3001)

## Folder Auth

Folder `auth_info` akan dibuat otomatis untuk menyimpan sesi WhatsApp.

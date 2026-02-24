# WhatsApp Bot Implementation Guide

Implementasi WhatsApp Bot menggunakan [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) yang dipisahkan dari Next.js sebagai service terpisah.

## Arsitektur

```
[Next.js App] ←→ HTTP ←→ [WhatsApp Service (Baileys)]
   Port 3000              Port 3001
```

### Kenapa Dipisahkan?

1. **WebSocket Persisten**: Baileys membutuhkan koneksi WebSocket yang terus berjalan, sedangkan Next.js API routes bersifat stateless
2. **Kompatibilitas**: Baileys memerlukan Node.js API lengkap yang tidak tersedia di Edge Runtime
3. **Stabilitas**: Menghindari masalah dengan Hot Module Replacement di development mode

## Struktur Files

```
whatsapp-service/          # WhatsApp Service (terpisah)
├── server.ts             # Express server dengan Baileys
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md

src/
├── app/api/whatsapp/     # Next.js API proxy
│   ├── qr/route.ts       # Endpoint untuk QR code
│   ├── status/route.ts   # Endpoint untuk status
│   ├── send/route.ts     # Endpoint untuk kirim pesan
│   ├── start/route.ts    # Endpoint untuk start connection
│   └── stop/route.ts     # Endpoint untuk stop connection
└── components/
    └── WhatsAppQR.tsx    # Component untuk tampilan QR
```

## Instalasi & Setup

### 1. Install Dependencies

Dependencies sudah terinstall:
- `@whiskeysockets/baileys` - Library WhatsApp
- `qrcode` & `qrcode-terminal` - Untuk QR code
- `@hapi/boom` - Error handling
- `express` & `cors` - Web server
- `@types/express` & `@types/cors` - TypeScript types

### 2. Environment Variables

File `.env.local` sudah dikonfigurasi dengan:
```env
WHATSAPP_SERVICE_PORT=3001
WHATSAPP_SERVICE_URL=http://localhost:3001
```

## Cara Menjalankan

### Development Mode

**Terminal 1 - WhatsApp Service:**
```bash
cd whatsapp-service
bun run dev
```

**Terminal 2 - Next.js:**
```bash
bun run dev
```

### Production Mode

**WhatsApp Service:**
```bash
cd whatsapp-service
bun run start
```

**Next.js:**
```bash
bun run build
bun run start
```

## API Endpoints

### WhatsApp Service (Port 3001)

- `GET /health` - Health check
- `GET /api/status` - Status koneksi WhatsApp
- `GET /api/qr` - Dapatkan QR code untuk login
- `POST /api/start` - Mulai koneksi WhatsApp
- `POST /api/stop` - Hentikan dan logout
- `POST /api/send-message` - Kirim pesan
  ```json
  {
    "to": "628xxxxxxxxx",
    "message": "Halo dari bot!"
  }
  ```

### Next.js Proxy (Port 3000)

- `GET /api/whatsapp/status` - Proxy ke status
- `GET /api/whatsapp/qr` - Proxy ke QR
- `POST /api/whatsapp/start` - Proxy ke start
- `POST /api/whatsapp/stop` - Proxy ke stop
- `POST /api/whatsapp/send` - Proxy ke send message

## Cara Menggunakan

### 1. Login ke WhatsApp

1. Jalankan WhatsApp service: `cd whatsapp-service && bun run dev`
2. Service akan generate QR code di terminal
3. Scan QR code dengan WhatsApp di HP Anda: Menu → Perangkat Tertaut → Tautkan Perangkat
4. Setelah terkoneksi, sesi akan tersimpan di folder `auth_info`

### 2. Menggunakan di Next.js

Import component WhatsAppQR:
```tsx
import WhatsAppQR from '@/components/WhatsAppQR';

export default function Page() {
  return (
    <div>
      <WhatsAppQR />
    </div>
  );
}
```

### 3. Mengirim Pesan

Dari Next.js atau client:
```typescript
const sendMessage = async (to: string, message: string) => {
  const response = await fetch('/api/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message }),
  });
  return response.json();
};

// Contoh penggunaan
await sendMessage('6281234567890', 'Halo dari bot!');
```

## Fitur

### Auto Reconnect
Service akan otomatis reconnect jika koneksi terputus (kecuali jika logout manual)

### Auto Reply (Testing)
Service memiliki auto-reply sederhana untuk testing:
- Ketik "ping" ke bot → Bot akan reply "🏓 Pong!"

### Sesi Persisten
Sesi WhatsApp tersimpan di folder `auth_info` sehingga tidak perlu scan QR setiap restart

## Troubleshooting

### Service tidak bisa start
- Pastikan port 3001 tidak digunakan aplikasi lain
- Check log error di terminal WhatsApp service

### QR Code tidak muncul
- Refresh browser
- Restart WhatsApp service
- Hapus folder `auth_info` dan scan ulang

### Pesan tidak terkirim
- Pastikan WhatsApp terkoneksi (check `/api/whatsapp/status`)
- Pastikan format nomor benar (62xxx atau gunakan @s.whatsapp.net)

### Error di Next.js development
Next.js config sudah diupdate dengan webpack fallback untuk mencegah Baileys di-bundle ke client-side.

## Best Practices

1. **Jangan jalankan Baileys di API Route Next.js** - Selalu gunakan service terpisah
2. **Monitor koneksi** - Gunakan endpoint `/api/whatsapp/status` untuk monitoring
3. **Rate limiting** - WhatsApp bisa block jika terlalu banyak pesan dalam waktu singkat
4. **Backup auth_info** - Folder ini berisi sesi login, backup untuk recovery
5. **Production deployment** - Untuk serverless (Vercel), pertimbangkan menggunakan database untuk menyimpan sesi

## Referensi

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [DeepSeek Chat - Implementasi Guide](https://chat.deepseek.com/share/6dbb2yied3x6xfrqfi)

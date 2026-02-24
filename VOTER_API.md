# Voter API Documentation

API endpoints untuk mengelola data voter yang dapat diakses menggunakan API token.

## Autentikasi

Semua endpoint memerlukan API token untuk autentikasi. Token dapat dikirim dengan salah satu cara berikut:

1. **Authorization Header (Bearer Token)**
   ```
   Authorization: Bearer your-secret-api-token-here
   ```

2. **X-API-Token Header**
   ```
   X-API-Token: your-secret-api-token-here
   ```

### Konfigurasi API Token

Tambahkan API token ke file `.env`:
```
API_TOKEN=your-secret-api-token-here
```

## Endpoints

### 1. Find Voter (GET)

Mencari voter berdasarkan phone atau id.

**Endpoint:** `GET /api/voters/find`

**Query Parameters:**
- `phone` (string, optional): Nomor telepon voter
- `id` (number, optional): ID voter

**Catatan:** Minimal satu parameter (`phone` atau `id`) harus disertakan.

**Contoh Request:**

```bash
# Cari berdasarkan phone
curl -X GET "http://localhost:3000/api/voters/find?phone=6285925092603" \
  -H "X-API-Token: your-secret-api-token-here"

# Cari berdasarkan id
curl -X GET "http://localhost:3000/api/voters/find?id=123" \
  -H "Authorization: Bearer your-secret-api-token-here"
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone": "6285925092603",
    "name": "John Doe",
    "organization": "Organization Name",
    "status": "pending",
    "created_at": "2026-02-24T10:30:00.000Z"
  }
}
```

**Response Error (404 - Not Found):**
```json
{
  "success": false,
  "error": "Voter not found"
}
```

**Response Error (400 - Bad Request):**
```json
{
  "success": false,
  "error": "Missing required parameter: provide either 'phone' or 'id'"
}
```

**Response Error (401 - Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing API token"
}
```

---

### 2. Create Voter (POST)

Menambahkan voter baru.

**Endpoint:** `POST /api/voters/create`

**Request Body:**
```json
{
  "phone": "628123456789",
  "name": "John Doe",
  "organization": "Organization Name",
  "status": "pending"
}
```

**Field Description:**
- `phone` (string, required): Nomor telepon voter (harus unik)
- `name` (string, required): Nama voter
- `organization` (string, required): Nama organisasi
- `status` (string, optional): Status voter (default: "pending")

**Contoh Request:**

```bash
curl -X POST "http://localhost:3000/api/voters/create" \
  -H "Content-Type: application/json" \
  -H "X-API-Token: your-secret-api-token-here" \
  -d '{
    "phone": "628123456789",
    "name": "John Doe",
    "organization": "Organization Name",
    "status": "pending"
  }'
```

**Response Success (201 - Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone": "628123456789",
    "name": "John Doe",
    "organization": "Organization Name",
    "status": "pending",
    "created_at": "2026-02-24T10:30:00.000Z"
  }
}
```

**Response Error (409 - Conflict):**
```json
{
  "success": false,
  "error": "Voter with this phone number already exists",
  "data": {
    "id": 1,
    "phone": "628123456789",
    "name": "John Doe",
    "organization": "Organization Name",
    "status": "pending",
    "created_at": "2026-02-24T10:30:00.000Z"
  }
}
```

**Response Error (400 - Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: phone, name, and organization are required"
}
```

**Response Error (401 - Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing API token"
}
```

---

## Status Codes

- `200` - OK: Request berhasil
- `201` - Created: Voter berhasil dibuat
- `400` - Bad Request: Parameter atau body request tidak valid
- `401` - Unauthorized: API token tidak valid atau tidak ada
- `404` - Not Found: Voter tidak ditemukan
- `409` - Conflict: Voter dengan nomor telepon tersebut sudah ada
- `500` - Internal Server Error: Kesalahan server

## Contoh Penggunaan dengan JavaScript/TypeScript

```typescript
// Find voter
async function findVoter(phone: string) {
  const response = await fetch(`http://localhost:3000/api/voters/find?phone=${phone}`, {
    headers: {
      'X-API-Token': 'your-secret-api-token-here'
    }
  });
  return await response.json();
}

// Create voter
async function createVoter(voterData: {
  phone: string;
  name: string;
  organization: string;
  status?: string;
}) {
  const response = await fetch('http://localhost:3000/api/voters/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Token': 'your-secret-api-token-here'
    },
    body: JSON.stringify(voterData)
  });
  return await response.json();
}

// Contoh penggunaan
const voter = await findVoter('6285925092603');
console.log(voter);

const newVoter = await createVoter({
  phone: '628123456789',
  name: 'John Doe',
  organization: 'Organization Name',
  status: 'pending'
});
console.log(newVoter);
```

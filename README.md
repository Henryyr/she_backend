# Dokumentasi API - Sistem Web Salon

## 1. Autentikasi
### Login Admin
**Endpoint:**
```
POST /api/auth/login
```
**Deskripsi:** Login admin untuk mendapatkan token JWT.

**Request Body:**
```json
{
    "username": "admin",
    "password": "password123"
}
```
**Response:**
```json
{
    "message": "Login berhasil",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```

### Login User
**Endpoint:**
```
POST /api/auth/login
```
**Deskripsi:** Login user untuk mendapatkan token JWT.

**Request Body:**
```json
{
    "username": "user",
    "password": "passworduser"
}
```
**Response:**
```json
{
    "message": "Login berhasil",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```

---

## 2. Manajemen Dashboard Admin
### Mendapatkan Dashboard Admin
**Endpoint:**
```
GET /api/admin/dashboard
```
**Deskripsi:** Mendapatkan daftar pengguna untuk admin.

**Response:**
```json
{
    "message": "Dashboard Admin - Daftar Pengguna",
    "users": [
        {
            "id": 1,
            "fullname": "Admin User",
            "email": "admin@example.com",
            "phone_number": "08123456789",
            "username": "admin",
            "address": "Jl. Admin No.1",
            "role": "admin"
        }
    ]
}
```

---

## 3. Manajemen Pengguna
### Mendapatkan Semua Pengguna
**Endpoint:**
```
GET /api/users
```
**Response:**
```json
[
    {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin"
    }
]
```

### Menambahkan Pengguna
**Endpoint:**
```
POST /api/users
```
**Request Body:**
```json
{
    "fullname": "New User",
    "email": "user@example.com",
    "phone_number": "08129876543",
    "username": "newuser",
    "password": "securepass",
    "address": "Jl. User No.2",
    "role": "customer"
}
```
**Response:**
```json
{
    "message": "User berhasil ditambahkan",
    "userId": 2
}
```

### Mengedit Pengguna
**Endpoint:**
```
PUT /api/users/:id
```
**Request Body:**
```json
{
    "fullname": "Updated User",
    "email": "updated@example.com",
    "phone_number": "081234567890",
    "username": "updateduser",
    "address": "Jl. Baru No.10",
    "role": "customer"
}
```
**Response:**
```json
{
    "message": "User berhasil diperbarui"
}
```

### Menghapus Pengguna
**Endpoint:**
```
DELETE /api/users/:id
```
**Response:**
```json
{
    "message": "User berhasil dihapus"
}
```

---

## 4. Manajemen Layanan
### Mendapatkan Semua Layanan
**Endpoint:**
```
GET /api/layanan
```
**Response:**
```json
[
    {
        "id": 1,
        "name": "Haircut",
        "description": "Potong rambut premium",
        "price": 50000,
        "duration": "30 menit"
    }
]
```

### Menambahkan Layanan
**Endpoint:**
```
POST /api/layanan
```
**Request Body:**
```json
{
    "name": "Facial",
    "description": "Perawatan wajah",
    "price": 75000,
    "duration": "45 menit"
}
```
**Response:**
```json
{
    "message": "Layanan berhasil ditambahkan",
    "service": {
        "id": 2,
        "name": "Facial",
        "description": "Perawatan wajah",
        "price": 75000,
        "duration": "45 menit"
    }
}
```

---

## Autentikasi dengan Token JWT
Setiap permintaan ke endpoint kecuali `/api/auth/login` harus mengirimkan header **Authorization** dengan format:
```
Authorization: Bearer <token>
```


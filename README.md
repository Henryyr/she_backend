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

# Dokumentasi API Admin Dashboard

## **Pendahuluan**
Admin Dashboard dalam sistem web salon ini memungkinkan admin untuk mengelola pengguna. API ini mencakup fitur CRUD untuk pengguna serta autentikasi berbasis JWT.

---
## **Autentikasi**
Setiap endpoint dalam dashboard admin memerlukan autentikasi menggunakan JWT. Pastikan setiap permintaan mengirimkan header:
```
Authorization: Bearer <token>
```

---
## **1. Mendapatkan Daftar Pengguna**
### **Endpoint:**
```
GET /api/admin/dashboard
```
### **Deskripsi:**
Mengambil daftar semua pengguna dalam sistem.
### **Headers:**
- `Authorization: Bearer <token>` (Wajib, hanya admin)
### **Response:**
#### **Berhasil (200 OK)**
```json
{
    "message": "Dashboard Admin - Daftar Pengguna",
    "users": [
        {
            "id": 1,
            "fullname": "John Doe",
            "email": "john@example.com",
            "phone_number": "08123456789",
            "username": "johndoe",
            "address": "Jl. Example No. 1",
            "role": "admin"
        }
    ]
}
```

---
## **2. Menambahkan Pengguna Baru**
### **Endpoint:**
```
POST /api/admin/users
```
### **Deskripsi:**
Admin dapat menambahkan pengguna baru.
### **Headers:**
- `Authorization: Bearer <token>` (Wajib, hanya admin)
### **Body (JSON):**
```json
{
    "fullname": "Jane Doe",
    "email": "jane@example.com",
    "phone_number": "08129876543",
    "username": "janedoe",
    "password": "password123",
    "address": "Jl. Contoh No. 2",
    "role": "pelanggan"
}
```
### **Response:**
#### **Berhasil (201 Created)**
```json
{
    "message": "User berhasil ditambahkan",
    "userId": 2
}
```

---
## **3. Mengedit Data Pengguna**
### **Endpoint:**
```
PUT /api/admin/users/:id
```
### **Deskripsi:**
Admin dapat memperbarui informasi pengguna.
### **Headers:**
- `Authorization: Bearer <token>` (Wajib, hanya admin)
### **Body (JSON):**
```json
{
    "fullname": "Jane Doe Updated",
    "email": "jane_updated@example.com",
    "phone_number": "08129876543",
    "username": "janedoe",
    "address": "Jl. Contoh Baru No. 3",
    "role": "pelanggan"
}
```
### **Response:**
#### **Berhasil (200 OK)**
```json
{
    "message": "User berhasil diperbarui"
}
```

---
## **4. Menghapus Pengguna**
### **Endpoint:**
```
DELETE /api/admin/users/:id
```
### **Deskripsi:**
Admin dapat menghapus pengguna berdasarkan ID.
### **Headers:**
- `Authorization: Bearer <token>` (Wajib, hanya admin)
### **Response:**
#### **Berhasil (200 OK)**
```json
{
    "message": "User berhasil dihapus"
}
```
#### **Gagal (404 Not Found - Jika ID tidak ditemukan)**
```json
{
    "message": "User tidak ditemukan"
}
```
---

## Autentikasi dengan Token JWT
Setiap permintaan ke endpoint kecuali `/api/auth/login` harus mengirimkan header **Authorization** dengan format:
```
Authorization: Bearer <token>
```


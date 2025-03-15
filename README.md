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
# Dokumentasi API Booking & Transaksi

## Booking

### 1. **Membuat Booking Baru**
**Endpoint:** `POST /api/booking`

**Headers:**
- `Authorization: Bearer <token>`

**Body (JSON):**
```json
{
  "layanan_ids": [1, 2],
  "tanggal": "2025-03-16",
  "jam_mulai": "10:00:00"
}
```

**Response (201 - Created):**
```json
{
  "message": "Booking berhasil dibuat",
  "booking_id": 45,
  "total_harga": 150000
}
```

---

### 2. **Mendapatkan Semua Booking Pengguna**
**Endpoint:** `GET /api/booking`

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 - OK):**
```json
{
  "bookings": [
    {
      "id": 45,
      "tanggal": "2025-03-16",
      "jam_mulai": "10:00:00",
      "status": "pending",
      "total_harga": 150000,
      "layanan": ["Potong Rambut", "Cuci Rambut"]
    }
  ]
}
```

---

### 3. **Mendapatkan Detail Booking**
**Endpoint:** `GET /api/booking/:id`

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 - OK):**
```json
{
  "id": 45,
  "tanggal": "2025-03-16",
  "jam_mulai": "10:00:00",
  "status": "pending",
  "total_harga": 150000,
  "layanan": ["Potong Rambut", "Cuci Rambut"]
}
```

---

### 4. **Menghapus Booking**
**Endpoint:** `DELETE /api/booking/:id`

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 - OK):**
```json
{
  "message": "Booking berhasil dihapus"
}
```

---

## Transaksi

### 1. **Membuat Transaksi Baru**
**Endpoint:** `POST /api/transaksi`

**Headers:**
- `Authorization: Bearer <token>`

**Body (JSON):**
```json
{
  "booking_id": 45,
  "kategori_transaksi_id": 2
}
```

**Response (201 - Created):**
```json
{
  "message": "Transaksi dibuat",
  "transaksi_id": 123,
  "status": "pending",
  "snap_url": "https://midtrans.com/payment/123"
}
```

---

### 2. **Mendapatkan Semua Transaksi Pengguna**
**Endpoint:** `GET /api/transaksi`

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 - OK):**
```json
{
  "transactions": [
    {
      "id": 123,
      "booking_id": 45,
      "total_harga": 150000,
      "paid_amount": 0,
      "status": "pending",
      "metode_pembayaran": "Cashless"
    }
  ]
}
```

---

### 3. **Webhook Midtrans**
**Endpoint:** `POST /api/transaksi/webhook`

**Body (JSON - contoh dari Midtrans):**
```json
{
  "order_id": "abcd1234",
  "transaction_status": "settlement",
  "gross_amount": 150000
}
```

**Response (200 - OK):**
```json
{
  "message": "Transaksi berhasil diperbarui"
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

# **Dokumentasi API User Authentication**  
API ini digunakan untuk registrasi, login, dan pengelolaan user dalam sistem web salon.  

## **Base URL**  
```
http://localhost:3000/api/auth
```

## **Endpoints**  

### **1. Register User Baru**  
**Endpoint:**  
```
POST /register
```
**Deskripsi:**  
Mendaftarkan user baru ke dalam sistem.  

**Request Body:**  
| Parameter            | Tipe   | Wajib | Deskripsi |
|----------------------|--------|-------|-----------|
| fullname            | String | ✅     | Nama lengkap pengguna |
| email              | String | ✅     | Email pengguna |
| phone_number       | String | ❌     | Nomor telepon pengguna (opsional) |
| username           | String | ✅     | Nama pengguna untuk login |
| password           | String | ✅     | Password minimal 8 karakter, kombinasi huruf dan angka |
| confirmation_password | String | ✅     | Konfirmasi password harus sama dengan password |
| address            | String | ❌     | Alamat pengguna (opsional) |
| role               | String | ❌     | Peran pengguna dalam sistem, default: "pelanggan" |

**Contoh Request:**
```json
{
  "fullname": "John Doe",
  "email": "johndoe@example.com",
  "phone_number": "081234567890",
  "username": "johndoe",
  "password": "password123",
  "confirmation_password": "password123",
  "address": "Jl. Mawar No. 10",
  "role": "pelanggan"
}
```

**Respon Sukses:**
```json
{
  "message": "User berhasil didaftarkan",
  "id": 1
}
```

**Respon Gagal:**  
- **400 Bad Request** – Data tidak lengkap atau format password salah  
- **500 Internal Server Error** – Kesalahan saat menyimpan ke database  

---

### **2. Login User**  
**Endpoint:**  
```
POST /login
```
**Deskripsi:**  
Autentikasi user untuk mendapatkan token JWT.  

**Request Body:**  
| Parameter  | Tipe   | Wajib | Deskripsi |
|------------|--------|-------|-----------|
| username  | String | ✅     | Nama pengguna yang terdaftar |
| password  | String | ✅     | Password yang sesuai dengan akun |

**Contoh Request:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Respon Sukses:**
```json
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```
*(Token harus disertakan dalam header `Authorization` untuk akses endpoint yang memerlukan autentikasi.)*

**Respon Gagal:**  
- **400 Bad Request** – Username atau password kosong  
- **401 Unauthorized** – Username atau password salah  
- **500 Internal Server Error** – Kesalahan saat mengambil data dari database  

---

### **3. Logout User**  
**Endpoint:**  
```
POST /logout
```
**Deskripsi:**  
Logout hanya menghapus token di sisi client.  

**Respon Sukses:**
```json
{
  "message": "Logout berhasil, silakan hapus token di client"
}
```

---

### **4. Get Profile User (Protected)**  
**Endpoint:**  
```
GET /profile
```
**Deskripsi:**  
Mengambil data profil user yang sedang login.  

**Headers:**  
```
Authorization: Bearer <token>
```

**Respon Sukses:**
```json
{
  "message": "Profil user",
  "user": {
    "id": 1,
    "username": "johndoe",
    "role": "pelanggan"
  }
}
```

**Respon Gagal:**  
- **401 Unauthorized** – Token tidak valid atau tidak disertakan  
- **403 Forbidden** – User tidak memiliki akses  

---

# **Dokumentasi API Testimoni**  
API ini digunakan untuk mengelola testimoni dari pengguna terhadap layanan salon.  

## **Base URL**  
```
http://localhost:3000/api/testimoni
```

## **Endpoints**  

---

### **1. Tambah Testimoni (User Submit Testimoni)**
**Endpoint:**  
```
POST /
```
**Deskripsi:**  
User yang sudah login dapat memberikan testimoni terhadap layanan yang digunakan.  

**Headers:**  
```
Authorization: Bearer <token>
```

**Request Body:**  
| Parameter  | Tipe   | Wajib | Deskripsi |
|------------|--------|-------|-----------|
| service_id | Int   | ✅     | ID layanan yang diberi testimoni |
| rating     | Int   | ✅     | Nilai rating (1-5) |
| comment    | String | ✅    | Komentar testimoni |

**Contoh Request:**
```json
{
  "service_id": 2,
  "rating": 5,
  "comment": "Layanan sangat memuaskan!"
}
```

**Respon Sukses:**
```json
{
  "message": "Testimoni berhasil ditambahkan",
  "id": 10
}
```

**Respon Gagal:**  
- **400 Bad Request** – Jika ada field yang kosong  
- **401 Unauthorized** – Jika user belum login  
- **500 Internal Server Error** – Jika terjadi kesalahan di server  

---

### **2. Melihat Semua Testimoni**  
**Endpoint:**  
```
GET /
```
**Deskripsi:**  
Menampilkan semua testimoni yang telah dibuat oleh pengguna.  

**Respon Sukses:**
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "service_name": "Haircut",
    "rating": 5,
    "comment": "Layanan sangat memuaskan!",
    "created_at": "2025-03-11 10:30:00"
  },
  {
    "id": 2,
    "username": "janedoe",
    "service_name": "Facial",
    "rating": 4,
    "comment": "Hasilnya bagus, tapi bisa lebih baik.",
    "created_at": "2025-03-11 11:00:00"
  }
]
```

**Respon Gagal:**  
- **500 Internal Server Error** – Jika terjadi kesalahan di server  

---

### **3. Hapus Testimoni (Admin Saja)**  
**Endpoint:**  
```
DELETE /:id
```
**Deskripsi:**  
Hanya admin yang dapat menghapus testimoni.  

**Headers:**  
```
Authorization: Bearer <token>
```

**Request Params:**  
| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| id        | Int  | ✅     | ID testimoni yang akan dihapus |

**Contoh Request:**  
```
DELETE /5
```

**Respon Sukses:**
```json
{
  "message": "Testimoni berhasil dihapus"
}
```

**Respon Gagal:**  
- **403 Forbidden** – Jika user bukan admin  
- **404 Not Found** – Jika testimoni tidak ditemukan  
- **500 Internal Server Error** – Jika terjadi kesalahan di server  

---

## **Autentikasi & Keamanan**  
- **Token JWT** digunakan untuk autentikasi user setelah login.  
- Setiap request ke endpoint yang membutuhkan autentikasi harus menyertakan token dalam header:  
  ```
  Authorization: Bearer <token>
  ```
- **Password user dienkripsi** menggunakan bcrypt sebelum disimpan ke database.  

---

## Autentikasi dengan Token JWT
Setiap permintaan ke endpoint kecuali `/api/auth/login` harus mengirimkan header **Authorization** dengan format:
```
Authorization: Bearer <token>
```


# Web Salon System API Documentation

## Table of Contents
1. [Authentication](#1-authentication)
2. [User Management](#2-user-management)
3. [Admin Dashboard](#3-admin-dashboard)
4. [Services Management](#4-services-management)
5. [Booking System](#5-booking-system)
6. [Transaction Management](#6-transaction-management)
7. [Testimonials](#7-testimonials)

---

## 1. Authentication

### Register User
**Endpoint:**
```
POST /api/auth/register
```
**Description:** Register a new user in the system.

**Request Body:**
```json
{
  "fullname": "John Doe",
  "email": "johndoe@example.com",
  "phone_number": "081234567890", // Optional
  "username": "johndoe",
  "password": "password123",
  "confirmation_password": "password123",
  "address": "Jl. Mawar No. 10", // Optional
  "role": "pelanggan" // Optional, default: "pelanggan"
}
```
**Response (201 Created):**
```json
{
  "message": "User berhasil didaftarkan",
  "id": 1
}
```

### Login
**Endpoint:**
```
POST /api/auth/login
```
**Description:** Authenticate user to get JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```
**Response (200 OK):**
```json
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```

### Logout
**Endpoint:**
```
POST /api/auth/logout
```
**Description:** Logout only removes token on client side.

**Response (200 OK):**
```json
{
  "message": "Logout berhasil, silakan hapus token di client"
}
```

### Get User Profile
**Endpoint:**
```
GET /api/auth/profile
```
**Description:** Get current logged-in user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
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

---

## 2. User Management

### Get All Users
**Endpoint:**
```
GET /api/users
```
**Description:** Get a list of all users (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
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

### Add User
**Endpoint:**
```
POST /api/users
```
**Description:** Add a new user (admin only).

**Headers:**
```
Authorization: Bearer <token>
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
**Response (201 Created):**
```json
{
  "message": "User berhasil ditambahkan",
  "userId": 2
}
```

### Update User
**Endpoint:**
```
PUT /api/users/:id
```
**Description:** Update user information (admin only).

**Headers:**
```
Authorization: Bearer <token>
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
**Response (200 OK):**
```json
{
  "message": "User berhasil diperbarui"
}
```

### Delete User
**Endpoint:**
```
DELETE /api/users/:id
```
**Description:** Delete a user by ID (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "User berhasil dihapus"
}
```

---

## 3. Admin Dashboard

### Get Admin Dashboard
**Endpoint:**
```
GET /api/admin/dashboard
```
**Description:** Get user list for admin dashboard.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
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

### Add User (Admin)
**Endpoint:**
```
POST /api/admin/users
```
**Description:** Admin can add a new user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
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
**Response (201 Created):**
```json
{
  "message": "User berhasil ditambahkan",
  "userId": 2
}
```

### Update User (Admin)
**Endpoint:**
```
PUT /api/admin/users/:id
```
**Description:** Admin can update user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
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
**Response (200 OK):**
```json
{
  "message": "User berhasil diperbarui"
}
```

### Delete User (Admin)
**Endpoint:**
```
DELETE /api/admin/users/:id
```
**Description:** Admin can delete a user by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "User berhasil dihapus"
}
```

---

## 4. Services Management

### Get All Services
**Endpoint:**
```
GET /api/layanan
```
**Description:** Get a list of all salon services.

**Response (200 OK):**
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

### Add Service
**Endpoint:**
```
POST /api/layanan
```
**Description:** Add a new service (admin only).

**Headers:**
```
Authorization: Bearer <token>
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
**Response (201 Created):**
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

## 5. Booking System

### Create New Booking
**Endpoint:**
```
POST /api/booking
```
**Description:** Create a new booking appointment.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "layanan_ids": [1, 2],
  "tanggal": "2025-03-16",
  "jam_mulai": "10:00:00"
}
```
**Response (201 Created):**
```json
{
  "message": "Booking berhasil dibuat",
  "booking_id": 45,
  "total_harga": 150000
}
```

### Get User Bookings
**Endpoint:**
```
GET /api/booking
```
**Description:** Get all bookings for current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
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

### Get Booking Details
**Endpoint:**
```
GET /api/booking/:id
```
**Description:** Get details of a specific booking.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
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

### Delete Booking
**Endpoint:**
```
DELETE /api/booking/:id
```
**Description:** Delete a specific booking.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Booking berhasil dihapus"
}
```

---

## 6. Transaction Management

### Create New Transaction
**Endpoint:**
```
POST /api/transaksi
```
**Description:** Create a new transaction for a booking.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "booking_id": 45,
  "kategori_transaksi_id": 2
}
```
**Response (201 Created):**
```json
{
  "message": "Transaksi dibuat",
  "transaksi_id": 123,
  "status": "pending",
  "snap_url": "https://midtrans.com/payment/123"
}
```

### Get User Transactions
**Endpoint:**
```
GET /api/transaksi
```
**Description:** Get all transactions for current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
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

### Payment Gateway Webhook
**Endpoint:**
```
POST /api/transaksi/webhook
```
**Description:** Webhook for payment gateway callbacks (Midtrans).

**Request Body (Example from Midtrans):**
```json
{
  "order_id": "abcd1234",
  "transaction_status": "settlement",
  "gross_amount": 150000
}
```
**Response (200 OK):**
```json
{
  "message": "Transaksi berhasil diperbarui"
}
```

---

## 7. Testimonials

### Add Testimonial
**Endpoint:**
```
POST /api/testimoni
```
**Description:** User submits a testimonial for a service.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "service_id": 2,
  "rating": 5,
  "comment": "Layanan sangat memuaskan!"
}
```
**Response (201 Created):**
```json
{
  "message": "Testimoni berhasil ditambahkan",
  "id": 10
}
```

### Get All Testimonials
**Endpoint:**
```
GET /api/testimoni
```
**Description:** Get all testimonials.

**Response (200 OK):**
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

### Delete Testimonial
**Endpoint:**
```
DELETE /api/testimoni/:id
```
**Description:** Delete a testimonial (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Testimoni berhasil dihapus"
}
```

---

## Authentication & Security
- JWT token authentication is required for protected endpoints
- Include token in request header: `Authorization: Bearer <token>`
- User passwords are encrypted with bcrypt before storing in database

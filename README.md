# 💅 She Salon Backend

Backend API untuk aplikasi manajemen salon kecantikan dengan fitur booking, pembayaran, dan manajemen layanan.

## 📋 Daftar Isi

- [Prasyarat](#prasyarat)
- [Cara Instalasi](#cara-instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Database](#struktur-database)
- [API Documentation](#api-documentation)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)

## 🛠️ Prasyarat

Pastikan sistem Anda telah memiliki:

| Software | Versi | Link Download |
|----------|-------|---------------|
| **Bun** | Latest | [bun.sh](https://bun.sh) |
| **MySQL** | 8.0+ | [mysql.com](https://dev.mysql.com/downloads/) |
| **Docker** | Latest | [docker.com](https://www.docker.com/get-started) |
| **Docker Compose** | Latest | Included with Docker Desktop |

## 🚀 Cara Instalasi

### 1. Clone Repository

```bash
git clone <URL_REPOSITORI_ANDA>
cd she_backend
```

### 2. Install Dependencies

```bash
bun install
```

## ⚙️ Konfigurasi Environment

### 1. Buat File Environment

Buat file `.env` di root directory dan isi dengan konfigurasi berikut:

```env
# 🗄️ Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PORT=3307
DB_PASSWORD=henry123
DB_NAME=she_app

# 🌐 Server Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=rahasia_salon
ALLOWED_ORIGINS=http://localhost:3000

# 📸 Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_SECRET=your_api_secret_here

# 💳 Midtrans Configuration
MIDTRANS_MERCHANT_ID=your_merchant_id_here
MIDTRANS_SERVER_KEY=your_server_key_here
MIDTRANS_CLIENT_KEY=your_client_key_here

# 📧 Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# 🌍 Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 2. Setup Database dengan Docker

Jalankan database MySQL menggunakan Docker Compose:

```bash
docker-compose up -d
```

Database akan otomatis dibuat dengan konfigurasi yang sesuai di port `3307`.

### 3. Setup Email (Gmail)

Untuk menggunakan Gmail sebagai SMTP:

1. Aktifkan **2-Factor Authentication** di akun Google Anda
2. Generate **App Password** di [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Gunakan App Password sebagai nilai `EMAIL_PASS`

## 🏃‍♂️ Menjalankan Aplikasi

### Development Mode (Auto-reload)

```bash
bun run dev:bun
```

### Production Mode

```bash
bun run start:bun
```

## ✅ Verifikasi Server

Setelah berhasil dijalankan, Anda akan melihat output berikut:

```
🚀 Server berjalan di http://localhost:3000
✅ Connected to she_app database
✅ Email service is ready
```

## 📖 API Documentation

Dokumentasi lengkap API endpoint tersedia di Postman Collection:

**🔗 [She Salon API Collection](https://she-salon-api.postman.co/workspace/My-Workspace~e1515782-5d9b-472e-8315-582bd2107681/collection/44888388-78dfc5ba-6501-4830-90bc-2f07f7d53549?action=share&source=copy-link&creator=44888388)**

Collection ini mencakup:
- Semua endpoint yang tersedia
- Request & response examples
- Authentication setup
- Environment variables

## 🔧 Teknologi yang Digunakan

| Kategori | Teknologi |
|----------|-----------|
| **Runtime** | Bun.js |
| **Database** | MySQL |
| **Payment Gateway** | Midtrans |
| **Image Storage** | Cloudinary |
| **Email Service** | SMTP (Gmail) |
| **Authentication** | JWT |
| **Real-time** | Socket.IO |

## 📝 Catatan Tambahan

- File `.env` sudah termasuk dalam `.gitignore` untuk keamanan
- Database MySQL berjalan menggunakan Docker di port **3307**
- Frontend dan backend menggunakan port yang sama (**3000**)
- Pastikan semua service eksternal (Midtrans, Cloudinary) telah dikonfigurasi dengan benar
- Untuk production, gunakan environment variables yang sesuai

### 🔧 Konfigurasi yang Perlu Dilengkapi

Untuk menjalankan aplikasi secara penuh, Anda perlu mengisi nilai kosong berikut:

1. **Cloudinary**: Daftar di [cloudinary.com](https://cloudinary.com) untuk mendapatkan credentials
2. **Midtrans**: Daftar di [midtrans.com](https://midtrans.com) untuk payment gateway
3. **Email**: Setup Gmail App Password untuk fitur email

## 🤝 Kontribusi

Jika Anda ingin berkontribusi pada proyek ini:

1. Fork repository
2. Buat branch untuk fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

**© 2025 She Salon Backend**

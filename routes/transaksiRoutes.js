const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const midtransClient = require('midtrans-client');
const { v4: uuidv4 } = require('uuid'); // ✅ Gunakan UUID untuk order_id

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// ✅ Buat Transaksi Baru
router.post('/', authenticate, async (req, res) => {
    const { booking_id, kategori_transaksi_id } = req.body;
    const user_id = req.user.id;

    if (!booking_id || !kategori_transaksi_id) {
        return res.status(400).json({ error: "Booking ID dan kategori transaksi wajib diisi" });
    }

    if (![1, 2].includes(kategori_transaksi_id)) {
        return res.status(400).json({ error: "Kategori transaksi tidak valid" });
    }

    try {
        // 🔹 Cek booking dan ambil total_harga langsung dari database
        const [bookingResult] = await db.promise().query(
            `SELECT id, total_harga, status FROM booking WHERE id = ?`, [booking_id]
        );
        if (bookingResult.length === 0) return res.status(404).json({ error: "Booking tidak ditemukan" });

        const { total_harga, status } = bookingResult[0];

        // 🔹 Cegah duplikasi transaksi
        if (status === 'confirmed') {
            return res.status(400).json({ error: "Booking sudah dibayar" });
        }

        const order_id = uuidv4(); // ✅ Gunakan UUID

        if (kategori_transaksi_id === 1) { // 🔹 Pembayaran Cash
            await db.promise().beginTransaction();
            const [result] = await db.promise().query(
                `INSERT INTO transaksi (user_id, booking_id, total_harga, paid_amount, kategori_transaksi_id, status) 
                 VALUES (?, ?, ?, ?, ?, 'paid')`,
                [user_id, booking_id, total_harga, total_harga, kategori_transaksi_id]
            );
            await db.promise().query(`UPDATE booking SET status = "confirmed" WHERE id = ?`, [booking_id]);
            await db.promise().commit();
            return res.json({ message: "Transaksi berhasil", transaksi_id: result.insertId, status: "paid" });
        }

        // 🔹 Ambil detail layanan dari database
    const [layananResult] = await db.promise().query(
    `SELECT l.nama AS nama_layanan 
     FROM booking_layanan bl
     JOIN layanan l ON bl.layanan_id = l.id
     WHERE bl.booking_id = ?`, 
    [booking_id]
);

if (layananResult.length === 0) {
    return res.status(404).json({ error: "Layanan tidak ditemukan" });
}

const layanan = layananResult.map(row => row.nama_layanan).join(', '); // Gabungin kalau ada banyak layanan

        // 🔹 Transaksi via Midtrans Snap (Cashless)
        const parameter = {
            transaction_details: { 
                order_id, 
                gross_amount: total_harga 
            },
            item_details: [ // 🔹 Tambahkan detail layanan di sini
                {
                    id: booking_id,
                    price: total_harga,
                    quantity: 1,
                    name: layanan, // Nama layanan dari database
                    brand: "Salon",
                    category: "Perawatan"
                }
            ],
            customer_details: { user_id: user_id }
        };

        const snapResponse = await snap.createTransaction(parameter);
        await db.promise().beginTransaction();
        const [result] = await db.promise().query(
            `INSERT INTO transaksi (user_id, booking_id, total_harga, paid_amount, kategori_transaksi_id, status, midtrans_order_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, booking_id, total_harga, 0, kategori_transaksi_id, "pending", order_id]
        );
        
        await db.promise().commit();
        res.json({ message: "Transaksi dibuat", transaksi_id: result.insertId, status: "pending", snap_url: snapResponse.redirect_url });
    } catch (err) {
        await db.promise().rollback();
        console.error("Error creating transaction:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Webhook Midtrans
router.post('/webhook', async (req, res) => {
    try {
        const { order_id, transaction_status, gross_amount } = req.body;

        if (!order_id || !transaction_status) {
            return res.status(400).json({ error: "Data tidak lengkap" });
        }

        // 🔹 Cek transaksi berdasarkan midtrans_order_id
        const [transaksiResult] = await db.promise().query(
            `SELECT id, booking_id, total_harga FROM transaksi WHERE midtrans_order_id = ?`,
            [order_id]
        );

        if (transaksiResult.length === 0) {
            return res.status(404).json({ error: "Transaksi tidak ditemukan" });
        }

        const transaksi = transaksiResult[0];

        if (transaction_status === "settlement") {
            if (gross_amount < transaksi.total_harga) {
                return res.status(400).json({ error: "Jumlah pembayaran kurang dari total harga" });
            }

            await db.promise().beginTransaction();
            await db.promise().query(
                `UPDATE transaksi SET status = 'paid', paid_amount = ? WHERE midtrans_order_id = ?`,
                [gross_amount, order_id]
            );
            await db.promise().query(
                `UPDATE booking SET status = 'confirmed' WHERE id = ?`,
                [transaksi.booking_id]
            );
            await db.promise().commit();
            return res.json({ message: "Transaksi berhasil diperbarui" });
        }

        if (transaction_status === "expire") {
            // ✅ Jika pembayaran expired, hapus transaksi dari database
            await db.promise().beginTransaction();
            await db.promise().query(
                `DELETE FROM transaksi WHERE midtrans_order_id = ?`, 
                [order_id]
            );
            await db.promise().commit();
            return res.json({ message: "Transaksi expired dan dihapus", transaksi_id: null });
        }

        return res.json({ message: "Webhook diterima" });

    } catch (err) {
        await db.promise().rollback();
        console.error("Error in webhook:", err, req.body);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// ✅ Get Semua Transaksi User
router.get('/', authenticate, async (req, res) => {
    try {
        const [results] = await db.promise().query(`
            SELECT t.*, k.nama AS metode_pembayaran
            FROM transaksi t
            JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
        `, [req.user.id]);

        res.json({ transactions: results });
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
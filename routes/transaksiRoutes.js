const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Helper function untuk get frontend URL
const getFrontendURL = () => {
    // Prioritaskan environment variable
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
    }
    // Fallback ke localhost jika tidak ada
    return 'http://localhost:3000';
};

// ✅ Buat Transaksi Baru
router.post('/', authenticate, async (req, res) => {
    const { booking_id, kategori_transaksi_id, is_dp } = req.body; // Gunakan is_dp untuk menentukan apakah DP atau full payment
    const user_id = req.user.id;

    if (!booking_id || !kategori_transaksi_id) {
        return res.status(400).json({ error: "Booking ID dan kategori transaksi wajib diisi" });
    }

    if (![1, 2].includes(kategori_transaksi_id)) {
        return res.status(400).json({ error: "Kategori transaksi tidak valid" });
    }

    try {
        // 🔹 Cek booking dan ambil total_harga dari database
        const [bookingResult] = await db.promise().query(
            `SELECT id, total_harga, status FROM booking WHERE id = ?`, [booking_id]
        );
        if (bookingResult.length === 0) return res.status(404).json({ error: "Booking tidak ditemukan" });

        const { total_harga, status } = bookingResult[0];

        if (status === 'completed') {
            return res.status(400).json({ error: "Booking sudah dibayar" });
        }

        const order_id = `BKG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(booking_id).padStart(3, '0')}`; // Membuat order_id sesuai format
        const booking_number = `BKG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(booking_id).padStart(3, '0')}`; // Booking number format

        // 🔹 Hitung DP (30% dari total harga)
        const dp_amount = is_dp ? Math.round(total_harga * 0.3) : 0; // Jika bukan DP, set dp_amount = 0
        const amountToPay = is_dp ? dp_amount : total_harga; // Jika is_dp = true, bayar DP, jika tidak bayar full payment
        const paid_amount = 0; // Mulai dengan paid_amount = 0

        // 🔹 Transaksi via Midtrans Snap
        const parameter = {
            transaction_details: { 
                order_id, 
                gross_amount: amountToPay 
            },
            item_details: [
                {
                    id: booking_id,
                    price: amountToPay,
                    quantity: 1,
                    name: is_dp ? 'Booking Salon (DP 30%)' : 'Booking Salon (Full Payment)', // Perbaiki nama berdasarkan is_dp
                    brand: "Salon",
                    category: "Perawatan"
                }
            ],
            customer_details: { user_id: user_id },
            callbacks: {
                finish: `${getFrontendURL()}/`,
                error: `${getFrontendURL()}/`,
                pending: `${getFrontendURL()}/`
            }
        };

        const snapResponse = await snap.createTransaction(parameter);
        await db.promise().beginTransaction();
        const [result] = await db.promise().query(
            `INSERT INTO transaksi (user_id, booking_id, total_harga, paid_amount, dp_amount, kategori_transaksi_id, status, midtrans_order_id, payment_status, booking_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
            [user_id, booking_id, total_harga, paid_amount, dp_amount, kategori_transaksi_id, 'pending', order_id, 'unpaid', booking_number]
        );
        
        await db.promise().commit();
        res.json({ 
            message: "Transaksi dibuat", 
            transaksi_id: result.insertId, 
            status: 'pending', 
            snap_url: snapResponse.redirect_url,
            dp_amount: is_dp ? dp_amount : 0,
            remaining_amount: is_dp ? total_harga - dp_amount : 0
        });

    } catch (err) {
        await db.promise().rollback();
        console.error("Error creating transaction:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/webhook', async (req, res) => {
    console.log("🔔 WEBHOOK DITERIMA:", JSON.stringify(req.body));
    
    const conn = db.promise(); // simpan koneksi

    try {
        const { order_id, transaction_status, gross_amount } = req.body;

        if (!order_id || !transaction_status) {
            return res.status(400).json({ error: "Data tidak lengkap" });
        }

        await conn.beginTransaction(); // ✅ Tambahkan ini

        const [transaksiResult] = await conn.query(
            `SELECT id, booking_id, total_harga, paid_amount, dp_amount, payment_status FROM transaksi WHERE midtrans_order_id = ? OR pelunasan_order_id = ?`,
            [order_id, order_id]
        );

        if (transaksiResult.length === 0) {
            await conn.rollback(); // rollback dulu kalau gagal
            return res.status(404).json({ error: "Transaksi tidak ditemukan" });
        }

        const transaksi = transaksiResult[0];

        if (transaction_status === "settlement" || transaction_status === "capture") {
            console.log("✅ Sebelum update:");
            console.log("paid_amount sekarang:", transaksi.paid_amount);
            console.log("gross_amount dari webhook:", gross_amount);
            console.log("totalPaid:", parseFloat(transaksi.paid_amount) + parseFloat(gross_amount));

            const newPaidAmount = parseFloat(transaksi.paid_amount) + parseFloat(gross_amount);

            let paymentStatus = 'DP';
            if (newPaidAmount >= transaksi.total_harga) {
                paymentStatus = 'paid';
            }

            const newStatus = paymentStatus === 'paid' ? 'completed' : 'pending';

            await conn.query(
                `UPDATE transaksi 
                 SET paid_amount = ?, 
                     status = ?, 
                     payment_status = ?, 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE midtrans_order_id = ? OR pelunasan_order_id = ?`,
                [newPaidAmount, newStatus, paymentStatus, order_id, order_id]
            );

            if (paymentStatus === 'paid') {
                await conn.query(
                    `UPDATE booking SET status = 'confirmed' WHERE id = ?`,
                    [transaksi.booking_id]
                );
            }

            await conn.commit(); // ✅ Commit perubahan
            return res.status(200).json({ message: "Transaksi berhasil diperbarui" });
        }

        if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
            await conn.query(
                `DELETE FROM transaksi WHERE midtrans_order_id = ? OR pelunasan_order_id = ?`, 
                [order_id, order_id]
            );
            await conn.commit(); // ✅ Commit delete
            return res.status(200).json({ message: "Transaksi expired/dibatalkan dan dihapus", transaksi_id: null });
        }

        await conn.commit(); // ✅ Commit even if status unknown
        return res.status(200).json({ message: "Webhook diterima tapi status tidak dikenali" });

    } catch (err) {
        try {
            await conn.rollback(); // ✅ rollback on failure
        } catch (rollbackErr) {
            console.error("Error during rollback:", rollbackErr);
        }
        console.error("❌ Error dalam webhook:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// HANYA UNTUK DEBUGGING
router.get('/webhook', (_req, res) => {
    console.log("🔔 GET request diterima di webhook (bukan dari Midtrans)");
    res.status(200).json({ message: "Webhook endpoint active, but please use POST method" });
});

// ✅ Pelunasan Sisa Pembayaran
router.post('/lunasi', authenticate, async (req, res) => {
    const { transaksi_id } = req.body;

    if (!transaksi_id) {
        return res.status(400).json({ error: "Transaksi ID wajib diisi" });
    }

    try {
        const [transaksiResult] = await db.promise().query(
            `SELECT id, booking_id, total_harga, paid_amount, dp_amount, midtrans_order_id 
             FROM transaksi WHERE id = ? AND user_id = ?`,
            [transaksi_id, req.user.id]
        );

        if (transaksiResult.length === 0) {
            return res.status(404).json({ error: "Transaksi tidak ditemukan" });
        }

        const transaksi = transaksiResult[0];

        if (transaksi.dp_amount === 0 || parseFloat(transaksi.paid_amount) < parseFloat(transaksi.dp_amount)) {
            return res.status(400).json({ error: "DP belum dibayar, pelunasan tidak bisa dilakukan" });
        }
        

        // 🔹 Hitung sisa pembayaran dengan memperhitungkan paid_amount
        const sisaPembayaran = parseFloat(transaksi.total_harga) - parseFloat(transaksi.paid_amount);

        if (sisaPembayaran <= 0) {
            return res.status(400).json({ error: "Transaksi sudah lunas" });
        }

        // 🔹 Buat order_id baru dengan suffix PELUNASAN
        const pelunasanOrderId = `${transaksi.midtrans_order_id}-PELUNASAN`;

        const snapResponse = await snap.createTransaction({
            transaction_details: { 
                order_id: pelunasanOrderId,
                gross_amount: sisaPembayaran 
            },
            item_details: [
                {
                    id: transaksi.booking_id,
                    price: sisaPembayaran,
                    quantity: 1,
                    name: "Pelunasan Sisa Pembayaran",
                    brand: "Salon",
                    category: "Perawatan"
                }
            ],
            customer_details: { user_id: req.user.id },
            callbacks: {
                finish: `${getFrontendURL()}/payment/result`,
                error: `${getFrontendURL()}/payment/error`,
                pending: `${getFrontendURL()}/payment/pending`
            }
        });

        // Update transaksi dengan order_id pelunasan
        await db.promise().query(
            `UPDATE transaksi SET pelunasan_order_id = ? WHERE id = ?`,
            [pelunasanOrderId, transaksi_id]
        );

        res.json({ 
            message: "Silakan lanjutkan pelunasan", 
            snap_url: snapResponse.redirect_url,
            sisa_pembayaran: sisaPembayaran // 🔹 Kirim sisa pembayaran yang benar
        });
    } catch (err) {
        console.error("Error in pelunasan:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Get Semua Transaksi User
router.get('/', authenticate, async (req, res) => {
    try {
        const [results] = await db.promise().query(`
            SELECT 
                t.*, 
                k.nama AS metode_pembayaran,
                t.status AS transaction_status,
                t.payment_status,
                b.tanggal,
                b.jam_mulai,
                b.jam_selesai,
                b.status AS booking_status,
                b.created_at AS booking_created_at,
                b.booking_number,
                b.total_harga,
                GROUP_CONCAT(l.nama SEPARATOR ', ') AS layanan_nama
            FROM transaksi t
            JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
            JOIN booking b ON t.booking_id = b.id
            JOIN booking_layanan bl ON b.id = bl.booking_id
            JOIN layanan l ON bl.layanan_id = l.id
            WHERE t.user_id = ?
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `, [req.user.id]);

        res.json({ transactions: results });
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
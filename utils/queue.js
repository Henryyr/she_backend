const emailService = require('../services/user/emailService');
const transactionReceiptTemplate = require('../html/transactionReceipt');

const taskQueue = [];
let isProcessing = false;

const addToQueue = (taskType, data) => {
    console.log(`[Queue] Menambahkan tugas baru: ${taskType}`);
    taskQueue.push({ taskType, data });
    // Mulai proses jika belum berjalan
    if (!isProcessing) {
        processQueue();
    }
};

/**
 * Memproses tugas dalam antrian satu per satu.
 */
const processQueue = async () => {
    if (taskQueue.length === 0) {
        isProcessing = false;
        return;
    }

    isProcessing = true;
    const { taskType, data } = taskQueue.shift(); // Ambil tugas pertama
    console.log(`[Queue] Memproses tugas: ${taskType}`);

    try {
        switch (taskType) {
            case 'send-payment-receipt':
                await handleSendPaymentReceipt(data);
                break;
            // Tambahkan case lain untuk jenis tugas yang berbeda di masa depan
            default:
                console.warn(`[Queue] Jenis tugas tidak dikenal: ${taskType}`);
        }
    } catch (error) {
        console.error(`[Queue] Gagal memproses tugas ${taskType}:`, error);
        // Implementasikan logika untuk mencoba lagi atau mencatat kegagalan permanen
    }

    // Lanjutkan ke tugas berikutnya
    processQueue();
};

const handleSendPaymentReceipt = async ({ transaksi, webhookData }) => {
    const { order_id, gross_amount, settlement_time, transaction_time } = webhookData;
    
    // Tentukan apakah ini pembayaran DP atau pelunasan
    const isPelunasan = transaksi.pelunasan_order_id === order_id;
    const emailSubject = isPelunasan 
        ? 'Pelunasan Berhasil - Booking She Salon' 
        : 'Pembayaran DP Berhasil - Booking She Salon';

    // Hitung total yang sudah dibayar dan tentukan status pembayaran baru
    const updatedPaidAmount = (parseFloat(transaksi.paid_amount) || 0) + parseFloat(gross_amount);
    let newPaymentStatus = 'unpaid';
    if (updatedPaidAmount >= parseFloat(transaksi.total_harga)) {
        newPaymentStatus = 'paid';
    } else if (updatedPaidAmount > 0) {
        newPaymentStatus = 'DP';
    }
    
    // Buat HTML email
    const emailHtml = await transactionReceiptTemplate({
        booking_number: transaksi.booking_number,
        paymentStatus: newPaymentStatus,
        layanan_nama: transaksi.layanan_nama,
        tanggal: transaksi.tanggal,
        jam_mulai: transaksi.jam_mulai,
        jam_selesai: transaksi.jam_selesai,
        gross_amount,
        total_harga: transaksi.total_harga,
        newPaidAmount: updatedPaidAmount,
        payment_time: settlement_time || transaction_time || new Date()
    });

    // Kirim email
    await emailService.sendEmail(
        transaksi.email,
        emailSubject,
        'Pembayaran Anda telah berhasil. Berikut adalah rinciannya.',
        emailHtml
    );
    
    console.log(`[Queue] Email bukti pembayaran untuk pesanan ${order_id} berhasil dikirim.`);
};

module.exports = {
    addToQueue
};
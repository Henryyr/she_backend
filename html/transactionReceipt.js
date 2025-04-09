const QRCode = require('qrcode');

const generateQR = async (text) => {
    try {
        console.log('=================== QR CODE DEBUG ===================');
        console.log('Input text:', text);
        const qrData = await QRCode.toDataURL(text);
        console.log('QR Data length:', qrData.length);
        console.log('QR Data starts with:', qrData.substring(0, 100));
        console.log('QR Data is valid base64:', qrData.startsWith('data:image/png;base64,'));
        console.log('=================================================');
        return qrData;
    } catch (err) {
        console.error('QR Code Generation Error:', err);
        return '';
    }
};

const transactionReceiptTemplate = async (data) => {
    const { 
        booking_number, 
        paymentStatus, 
        layanan_nama, 
        tanggal, 
        jam_mulai, 
        jam_selesai, 
        gross_amount,
        total_harga,
        newPaidAmount 
    } = data;

    // Generate QR code content with more information
    const qrContent = JSON.stringify({
        booking: booking_number,
        amount: gross_amount,
        status: paymentStatus,
        date: tanggal
    });
    
    const qrCode = await generateQR(qrContent);
    const date = new Date(tanggal).toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .receipt {
                    border: 1px solid #ddd;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                }
                .details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .payment-info {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .total {
                    font-size: 18px;
                    font-weight: bold;
                    text-align: right;
                    padding: 10px 0;
                    border-top: 1px solid #ddd;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                }
                .status-paid {
                    color: #28a745;
                    font-weight: bold;
                }
                .status-dp {
                    color: #ffc107;
                    font-weight: bold;
                }
                .qr-container {
                    text-align: center;
                    margin: 20px 0;
                }
                .qr-code {
                    width: 150px;
                    height: 150px;
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <div class="logo">SALON KECANTIKAN</div>
                    <div>Jl. Contoh No. 123, Jakarta</div>
                    <div>Telp: (021) 123-4567</div>
                </div>

                <div class="details">
                    <div>
                        <p><strong>No. Booking:</strong><br>${booking_number}</p>
                        <p><strong>Tanggal:</strong><br>${date}</p>
                        <p><strong>Jam:</strong><br>${jam_mulai} - ${jam_selesai}</p>
                    </div>
                    <div>
                        <p><strong>Status:</strong><br>
                            <span class="status-${paymentStatus === 'paid' ? 'paid' : 'dp'}">
                                ${paymentStatus === 'paid' ? 'LUNAS' : 'DP'}
                            </span>
                        </p>
                        <p><strong>Layanan:</strong><br>${layanan_nama}</p>
                    </div>
                </div>

                <div class="payment-info">
                    <p><strong>Rincian Pembayaran:</strong></p>
                    <p>Total Pembayaran: Rp ${gross_amount.toLocaleString('id-ID')}</p>
                    ${paymentStatus === 'DP' ? `
                        <p>Total Harga: Rp ${total_harga.toLocaleString('id-ID')}</p>
                        <p>Sisa yang harus dibayar: Rp ${(total_harga - newPaidAmount).toLocaleString('id-ID')}</p>
                    ` : ''}
                </div>

                <div class="qr-container">
                    <img src="${qrCode}" class="qr-code" alt="QR Code" style="display: block; margin: 0 auto;"/>
                    <p><small>Scan untuk verifikasi booking: ${booking_number}</small></p>
                </div>

                <div class="footer">
                    <p>Terima kasih atas kepercayaan Anda</p>
                    <p><small>Bukti pembayaran ini sah tanpa tanda tangan</small></p>
                </div>
            </div>
        </body>
        </html>
    `;
};

module.exports = transactionReceiptTemplate;

// html/booking-information.js

// Template email booking information
const subject = '✨ She Salon - Siap Memanjakan Anda!';

const text = (bookingData) => {
  // Gabungkan dengan " + " untuk versi teks biasa agar mudah dibaca.
  const layananText = Array.isArray(bookingData.layanan)
    ? bookingData.layanan.join(' + ')
    : bookingData.layanan;

  return `
Halo ${bookingData.nama_customer || 'Pelanggan Tersayang'},

Terima kasih telah mempercayai She Salon untuk merawat kecantikan Anda! ✨

DETAIL BOOKING ANDA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Tanggal: ${bookingData.tanggal}
⏰ Jam: ${bookingData.jam_mulai}
💄 Layanan: ${layananText}
💰 Estimasi Biaya: ${bookingData.harga || 'Akan dikonfirmasi'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMASI PENTING:
• Pembatalan maksimal 30 menit sebelum jadwal

Alamat: Jl. Taman Giri Perum Griya Nugraha B13
WhatsApp: 0813-3856-3414

Sampai jumpa di She Salon!

Salam hangat,
Tim She Salon 💕
`;
};

const html = (bookingData) => {
  // Gabungkan layanan dengan tag <br> agar setiap layanan berada di baris baru.
  const layananHtml = Array.isArray(bookingData.layanan)
    ? bookingData.layanan.join('<br>')
    : bookingData.layanan;

  // Format angka sebagai mata uang Rupiah yang rapi.
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalHargaFormatted = formatCurrency(bookingData.total_harga);

  return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Booking She Salon</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <div style="background-color: #ff6b9d; background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ✨ She Salon ✨
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Your Beauty, Our Passion
            </p>
        </div>

        <div style="padding: 40px 30px;">
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">
                    Halo, ${bookingData.nama_customer || 'Pelanggan Tersayang'}! 👋
                </h2>
                <p style="color: #7f8c8d; margin: 0; font-size: 16px;">
                    Terima kasih telah mempercayai She Salon untuk merawat kecantikan Anda.
                </p>
            </div>

            <div style="background-color: #fff0f6; border-radius: 15px; padding: 25px; margin: 25px 0; border-left: 5px solid #ff6b9d;">
                <h3 style="color: #c44569; margin: 0 0 20px 0; font-size: 20px; text-align: center;">
                    📋 Detail Booking Anda
                </h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 35%; vertical-align: top;">
                            <strong style="color: #2c3e50;">📅 Tanggal:</strong>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${bookingData.tanggal}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 35%; vertical-align: top;">
                            <strong style="color: #2c3e50;">⏰ Waktu:</strong>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${bookingData.jam_mulai}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 35%; vertical-align: top;">
                            <strong style="color: #2c3e50;">💄 Layanan:</strong>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${layananHtml}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 35%; vertical-align: top;">
                            <strong style="color: #2c3e50;">💰 Total Harga:</strong>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e; font-weight: bold;">
                            ${totalHargaFormatted}
                        </td>
                    </tr>
                </table>
            </div>
            
            </div>

        <div style="background-color: #2c3e50; color: white; padding: 25px 30px; text-align: center;">
             <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                © ${new Date().getFullYear()} She Salon. All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>
`;
};

module.exports = {
  subject,
  text,
  html
};

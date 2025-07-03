const subject = '✨ Pengingat Jadwal Anda di She Salon - Sampai Jumpa Sebentar Lagi!';

const text = (bookingData) => {
    const layananText = Array.isArray(bookingData.layanan)
        ? bookingData.layanan.join(' + ')
        : bookingData.layanan;

    return `
Halo ${bookingData.nama_customer || 'Pelanggan Tersayang'},

Ini adalah pengingat ramah untuk jadwal Anda di She Salon yang akan segera dimulai. Kami sudah tidak sabar untuk menyambut Anda!

PENGINGAT DETAIL BOOKING ANDA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Tanggal: ${bookingData.tanggal}
⏰ Jam: ${bookingData.jam_mulai} (Sekitar 20 menit lagi)
💄 Layanan: ${layananText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kami siap memberikan pelayanan terbaik untuk Anda. Sampai jumpa sebentar lagi!

Alamat: Jl. Taman Giri Perum Griya Nugraha B13
WhatsApp: 0813-3856-3414

Salam hangat,
Tim She Salon 💕
`;
};

const html = (bookingData) => {
    const layananHtml = Array.isArray(bookingData.layanan)
        ? bookingData.layanan.join('<br>')
        : bookingData.layanan;

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pengingat Booking She Salon</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ✨ She Salon ✨
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Sampai Jumpa Sebentar Lagi!
            </p>
        </div>

        <div style="padding: 40px 30px;">
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">
                    Halo, ${bookingData.nama_customer || 'Pelanggan Tersayang'}! 👋
                </h2>
                <p style="color: #7f8c8d; margin: 0; font-size: 16px;">
                    Jadwal Anda akan segera dimulai. Kami sudah siap menyambut Anda!
                </p>
            </div>

            <div style="background: linear-gradient(135deg, #ffeef8 0%, #f8e8ff 100%); border-radius: 15px; padding: 25px; margin: 25px 0; border-left: 5px solid #ff6b9d;">
                <h3 style="color: #c44569; margin: 0 0 20px 0; font-size: 20px; text-align: center;">
                    📋 Pengingat Booking Anda
                </h3>
                
                <div style="display: table; width: 100%; border-collapse: collapse;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 30%;">
                            <strong style="color: #2c3e50;">📅 Tanggal:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${bookingData.tanggal}
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 30%;">
                            <strong style="color: #2c3e50;">⏰ Waktu:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e; font-weight: bold;">
                            ${bookingData.jam_mulai} (±20 menit lagi)
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; width: 30%;">
                            <strong style="color: #2c3e50;">💄 Layanan:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; color: #34495e;">
                            ${layananHtml}
                        </div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #7f8c8d; font-size: 14px;">Jika Anda memerlukan bantuan atau ingin menginformasikan sesuatu, silakan hubungi kami.</p>
                <a href="https://wa.me/6281338563414" style="display: inline-block; background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; text-decoration: none; padding: 12px 25px; border-radius: 25px; font-weight: bold; font-size: 16px; margin-top: 15px;">
                    💬 Hubungi via WhatsApp
                </a>
            </div>

        </div>

        <div style="background-color: #2c3e50; color: white; padding: 25px 30px; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                Terima kasih dan sampai jumpa di She Salon!
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
  html,
};
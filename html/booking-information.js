// Template email booking information
const subject = '✨ She Salon - Siap Memanjakan Anda!';

const text = (bookingData) => `
Halo ${bookingData.nama_customer || 'Pelanggan Tersayang'},

Terima kasih telah mempercayai She Salon untuk merawat kecantikan Anda! ✨

DETAIL BOOKING ANDA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Tanggal: ${bookingData.tanggal}
⏰ Jam: ${bookingData.jam_mulai}
💄 Layanan: ${bookingData.nama_layanan || `ID: ${bookingData.layanan_id}`}
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

const html = (bookingData) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Booking She Salon</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ✨ She Salon ✨
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Your Beauty, Our Passion
            </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            
            <!-- Greeting -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">
                    Halo, ${bookingData.nama_customer || 'Pelanggan Tersayang'}! 👋
                </h2>
                <p style="color: #7f8c8d; margin: 0; font-size: 16px;">
                    Terima kasih telah mempercayai She Salon untuk merawat kecantikan Anda
                </p>
            </div>

            <!-- Booking Details Card -->
            <div style="background: linear-gradient(135deg, #ffeef8 0%, #f8e8ff 100%); border-radius: 15px; padding: 25px; margin: 25px 0; border-left: 5px solid #ff6b9d;">
                <h3 style="color: #c44569; margin: 0 0 20px 0; font-size: 20px; text-align: center;">
                    📋 Detail Booking Anda
                </h3>
                
                <div style="display: table; width: 100%; border-collapse: collapse;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 30%; vertical-align: top;">
                            <strong style="color: #2c3e50;">📅 Tanggal:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${bookingData.tanggal}
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 30%; vertical-align: top;">
                            <strong style="color: #2c3e50;">⏰ Waktu:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${bookingData.jam_mulai}
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 30%; vertical-align: top;">
                            <strong style="color: #2c3e50;">💄 Layanan:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${bookingData.nama_layanan || `ID: ${bookingData.layanan_id}`}
                        </div>
                    </div>
                    ${bookingData.harga ? `
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; width: 30%; vertical-align: top;">
                            <strong style="color: #2c3e50;">💰 Estimasi:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; color: #27ae60; font-weight: bold;">
                            ${bookingData.harga}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Important Information -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">
                    ⚠️ Informasi Penting
                </h3>
                <ul style="color: #856404; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Pembatalan hanya dapat dilakukan <strong>maksimal 30 menit</strong> sebelum jadwal</li>
                </ul>
            </div>

            <!-- Contact Information -->
            <div style="background-color: #e8f5e8; border-radius: 10px; padding: 20px; margin: 25px 0; text-align: center;">
                <h3 style="color: #27ae60; margin: 0 0 15px 0; font-size: 18px;">
                    📍 Informasi Kontak
                </h3>
                <p style="margin: 8px 0; color: #2c3e50;">
                    <strong>Alamat:</strong> Jl. Taman Giri Perum Griya Nugraha B13
                </p>
                <p style="margin: 8px 0; color: #2c3e50;">
                    <strong>WhatsApp:</strong> 0813-3856-3414
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://wa.me/6281338563414" style="display: inline-block; background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3); transition: all 0.3s ease;">
                    💬 Hubungi Kami di WhatsApp
                </a>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #2c3e50; color: white; padding: 25px 30px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                Sampai jumpa di She Salon! 💕
            </p>
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                Terima kasih telah mempercayai kami untuk merawat kecantikan Anda
            </p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #34495e;">
                <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                   © ${new Date().getFullYear()} She Salon. All rights reserved.
                </p>
            </div>
        </div>

    </div>
</body>
</html>
`;

module.exports = {
  subject,
  text,
  html,
};
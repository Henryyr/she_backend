const QRCode = require("qrcode")

const generateQR = async (text) => {
  try {
    console.log("=================== QR CODE DEBUG ===================")
    console.log("Input text:", text)
    const qrData = await QRCode.toDataURL(text)
    console.log("QR Data length:", qrData.length)
    console.log("QR Data starts with:", qrData.substring(0, 100))
    console.log("QR Data is valid base64:", qrData.startsWith("data:image/png;base64,"))
    console.log("=================================================")
    return qrData
  } catch (err) {
    console.error("QR Code Generation Error:", err)
    return ""
  }
}

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
    newPaidAmount,
  } = data

  // Generate QR code content with more information
  const qrContent = JSON.stringify({
    booking: booking_number,
    amount: gross_amount,
    status: paymentStatus,
    date: tanggal,
  })

  const qrCode = await generateQR(qrContent)
  const date = new Date(tanggal).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const currentDateTime = new Date().toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - She Salon</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 15px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ✨ She Salon ✨
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Bukti Pembayaran
            </p>
            <div style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.8; line-height: 1.4;">
                Jl. Taman Giri Perum Griya Nugraha Blok B13<br>
                WhatsApp: 0813-3856-3414
            </div>
        </div>
        
        <!-- Receipt Number -->
        <div style="background-color: #2c3e50; color: white; padding: 15px 20px; text-align: center; font-size: 16px; font-weight: bold;">
            Receipt #${booking_number}
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 25px;">
            
            <!-- Status -->
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-block; padding: 10px 25px; border-radius: 25px; font-weight: bold; font-size: 16px; text-transform: uppercase; ${paymentStatus === "paid" ? "background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);" : "background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);"} color: white;">
                    ${paymentStatus === "paid" ? "✅ LUNAS" : "💰 DP (Down Payment)"}
                </div>
            </div>
            
            <!-- Booking Details -->
            <div style="background: linear-gradient(135deg, #ffeef8 0%, #f8e8ff 100%); border-radius: 15px; padding: 25px; margin: 20px 0; border-left: 5px solid #ff6b9d;">
                <h3 style="color: #c44569; margin: 0 0 20px 0; font-size: 18px; text-align: center;">
                    📋 Detail Booking
                </h3>
                
                <div style="display: table; width: 100%; border-collapse: collapse;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 40%; vertical-align: top;">
                            <strong style="color: #2c3e50;">📅 Tanggal Layanan:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${date}
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 40%; vertical-align: top;">
                            <strong style="color: #2c3e50;">⏰ Waktu:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${jam_mulai} - ${jam_selesai}
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; width: 40%; vertical-align: top;">
                            <strong style="color: #2c3e50;">💄 Layanan:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e8e8e8; color: #34495e;">
                            ${layanan_nama}
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 0; width: 40%; vertical-align: top;">
                            <strong style="color: #2c3e50;">🕐 Waktu Pembayaran:</strong>
                        </div>
                        <div style="display: table-cell; padding: 12px 0; color: #34495e;">
                            ${currentDateTime}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Payment Information -->
            <div style="background-color: #e8f5e8; border-radius: 15px; padding: 25px; margin: 20px 0; border-left: 5px solid #27ae60;">
                <h3 style="color: #27ae60; margin: 0 0 20px 0; font-size: 18px; text-align: center;">
                    💳 Rincian Pembayaran
                </h3>
                
                <div style="display: table; width: 100%; border-collapse: collapse;">
                    ${
                      paymentStatus === "DP"
                        ? `
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 8px 0; border-bottom: 1px solid #d5e8d5; color: #2c3e50;">
                            Total Harga Layanan:
                        </div>
                        <div style="display: table-cell; padding: 8px 0; border-bottom: 1px solid #d5e8d5; color: #27ae60; font-weight: bold; text-align: right;">
                            Rp ${total_harga.toLocaleString("id-ID")}
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 8px 0; border-bottom: 1px solid #d5e8d5; color: #2c3e50;">
                            DP yang Dibayar:
                        </div>
                        <div style="display: table-cell; padding: 8px 0; border-bottom: 1px solid #d5e8d5; color: #27ae60; font-weight: bold; text-align: right;">
                            Rp ${gross_amount.toLocaleString("id-ID")}
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 8px 0; border-bottom: 2px solid #27ae60; color: #2c3e50;">
                            Sisa Pembayaran:
                        </div>
                        <div style="display: table-cell; padding: 8px 0; border-bottom: 2px solid #27ae60; color: #e74c3c; font-weight: bold; text-align: right;">
                            Rp ${(total_harga - newPaidAmount).toLocaleString("id-ID")}
                        </div>
                    </div>
                    `
                        : `
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 8px 0; border-bottom: 2px solid #27ae60; color: #2c3e50;">
                            Total Pembayaran:
                        </div>
                        <div style="display: table-cell; padding: 8px 0; border-bottom: 2px solid #27ae60; color: #27ae60; font-weight: bold; text-align: right;">
                            Rp ${gross_amount.toLocaleString("id-ID")}
                        </div>
                    </div>
                    `
                    }
                    
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 15px 0 0 0; color: #2c3e50; font-size: 18px; font-weight: bold;">
                            💰 TOTAL DIBAYAR:
                        </div>
                        <div style="display: table-cell; padding: 15px 0 0 0; color: #27ae60; font-weight: bold; font-size: 18px; text-align: right;">
                            Rp ${gross_amount.toLocaleString("id-ID")}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- QR Code -->
            <div style="background-color: #f8f9fa; border-radius: 15px; padding: 25px; text-align: center; margin: 20px 0; border: 2px dashed #c44569;">
                <h3 style="color: #c44569; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                    🔍 QR Code Verifikasi
                </h3>
                <img src="${qrCode}" style="width: 150px; height: 150px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="QR Code Booking"/>
                <p style="color: #7f8c8d; font-size: 12px; margin: 10px 0 0 0;">
                    Scan QR code untuk verifikasi booking<br>
                    <strong>${booking_number}</strong>
                </p>
            </div>
            
        </div>
        
        <!-- Footer -->
        <div style="background-color: #2c3e50; color: white; padding: 25px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                Terima kasih atas kepercayaan Anda! 💕
            </p>
            <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.8;">
                She Salon - Your Beauty, Our Passion
            </p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #34495e; font-size: 12px; opacity: 0.7;">
                Bukti pembayaran ini sah tanpa tanda tangan<br>
                © ${new Date().getFullYear()} She Salon. All rights reserved.
            </div>
        </div>
        
    </div>
</body>
</html>
`
}

module.exports = transactionReceiptTemplate

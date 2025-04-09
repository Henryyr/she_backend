// controllers/bookingController.js
const db = require('../db');
const bookingService = require('../services/bookingService');
const emailService = require('../services/emailService');
const redis = require('redis');

// Redis client setup (kept in controller as in original code)
const client = redis.createClient();

const createBooking = async (req, res) => {
    const { layanan_id, tanggal, jam_mulai } = req.body;
    const user_id = req.user.id;

    if (!user_id) return res.status(401).json({ error: "User tidak ditemukan, pastikan sudah login" });
    if (!layanan_id || !Array.isArray(layanan_id) || layanan_id.length === 0) 
        return res.status(400).json({ error: "Harus memilih setidaknya satu layanan" });

    try {
        const result = await bookingService.createBooking(user_id, layanan_id, tanggal, jam_mulai);
        
        // Send email notification if booking created successfully
        if (result.email) {
            const layananList = result.layanan_terpilih.map(l => `🔹 ${l.nama} (Rp${l.harga})`).join("\n");
            const formattedDate = new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const subject = "Konfirmasi Booking Anda";
            
            // Format layanan untuk tampilan HTML (removed the image)
const layananHtmlList = result.layanan_terpilih.map(layanan => `
    <tr>
        <td valign="top" class="esdev-mso-td" style="padding:0;Margin:0">
            <table cellpadding="0" cellspacing="0" align="left" class="es-left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                <tr>
                    <td align="center" style="padding:0;Margin:0;width:265px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr>
                                <td align="left" style="padding:0;Margin:0">
                                    <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">
                                        <strong>${layanan.nama}</strong>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
        <td style="padding:0;Margin:0;width:20px"></td>
        <td valign="top" class="esdev-mso-td" style="padding:0;Margin:0">
            <table cellpadding="0" cellspacing="0" align="left" class="es-left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                <tr>
                    <td align="left" style="padding:0;Margin:0;width:80px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr>
                                <td align="center" style="padding:0;Margin:0">
                                    <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">1x</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
        <td style="padding:0;Margin:0;width:20px"></td>
        <td valign="top" class="esdev-mso-td" style="padding:0;Margin:0">
            <table cellpadding="0" cellspacing="0" align="right" class="es-right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                <tr>
                    <td align="left" style="padding:0;Margin:0;width:85px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr>
                                <td align="right" style="padding:0;Margin:0">
                                    <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Rp${layanan.harga}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
`).join('');

// For the total price - ensure it is right aligned
const totalPriceSection = `
<tr>
    <td align="left" style="padding:0;Margin:0;padding-right:20px;padding-left:20px;padding-top:10px">
        <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
            <tr>
                <td align="center" class="es-m-p0r" style="padding:0;Margin:0;width:560px">
                    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;border-top:2px solid #efefef;border-bottom:2px solid #efefef" role="presentation">
                        <tr>
                            <td align="right" style="padding:0;Margin:0;padding-top:10px;padding-bottom:20px">
                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">
                                    Total:&nbsp;<strong>Rp${result.total_harga}</strong>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </td>
</tr>`;

// For the booking information - ensure it stays left aligned
const bookingInfoSection = `
<tr>
    <td align="left" style="Margin:0;padding-right:20px;padding-left:20px;padding-bottom:10px;padding-top:20px">
        <table cellpadding="0" cellspacing="0" align="left" class="es-left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
            <tr>
                <td align="left" class="es-m-p0r es-m-p20b" style="padding:0;Margin:0;width:560px">
                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                            <td align="left" style="padding:0;Margin:0">
                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Email: <strong>${result.email}</strong></p>
                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Nomor Booking:&nbsp;<strong>${result.booking_number}</strong></p>
                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Tanggal:&nbsp;<strong>${formattedDate}</strong></p>
                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Jam:&nbsp;<strong>${jam_mulai}</strong></p>
                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Status:&nbsp;<strong>${result.status || 'Pending'}</strong></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </td>
</tr>`;

const htmlMessage = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>Konfirmasi Booking</title><!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;}  </style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><noscript> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript><![endif]-->
<style type="text/css">.rollover:hover .rollover-first { max-height:0px!important; display:none!important;}.rollover:hover .rollover-second { max-height:none!important; display:block!important;}.rollover span { font-size:0px;}u + .body img ~ div div { display:none;}#outlook a { padding:0;}span.MsoHyperlink,span.MsoHyperlinkFollowed { color:inherit; mso-style-priority:99;}a.es-button { mso-style-priority:100!important; text-decoration:none!important;}a[x-apple-data-detectors],#MessageViewBody a { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;}.es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}</style>
</head> 
<body class="body" style="width:100%;height:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
<div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FAFAFA">
    <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
        <tr>
            <td valign="top" style="padding:0;Margin:0">
                <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
                </table>
                <table cellpadding="0" cellspacing="0" align="center" class="es-header" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top"></table>
                <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
                    <tr>
                        <td align="center" style="padding:0;Margin:0">
                            <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                                <tr>
                                    <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-right:20px;padding-left:20px">
                                        <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr>
                                                <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                        <tr>
                                                            <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px;font-size:0px">
                                                                <img src="https://ftjlnug.stripocdn.email/content/guids/CABINET_54100624d621728c49155116bef5e07d/images/84141618400759579.png" alt="" width="100" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none" height="98">
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                                                <h1 class="es-m-txt-c" style="Margin:0;font-family:arial, 'helvetica neue', helvetica, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:46px;font-style:normal;font-weight:bold;line-height:46px;color:#333333">Konfirmasi Booking</h1>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
                    <tr>
                        <td align="center" style="padding:0;Margin:0">
                            <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                                <tr>
                                    <td align="left" style="padding:20px;Margin:0">
                                        <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr>
                                                <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                        <tr>
                                                            <td align="center" style="padding:0;Margin:0">
                                                                <h2 class="es-m-txt-c" style="Margin:0;font-family:arial, 'helvetica neue', helvetica, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:26px;font-style:normal;font-weight:bold;line-height:31.2px;color:#333333">Booking&nbsp;<a target="_blank" href="" style="mso-line-height-rule:exactly;text-decoration:underline;color:#5C68E2;font-size:26px">#${result.booking_number}</a></h2>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center" class="es-m-p0r es-m-p0l" style="Margin:0;padding-top:5px;padding-right:40px;padding-bottom:5px;padding-left:40px">
                                                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">${formattedDate}, ${jam_mulai}</p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center" class="es-m-p0r es-m-p0l" style="Margin:0;padding-top:5px;padding-right:40px;padding-left:40px;padding-bottom:15px">
                                                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Email ini adalah konfirmasi booking Anda. Kami akan mengirimkan email lain saat booking Anda dikonfirmasi.</p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center" style="padding:0;Margin:0">
                                                                <span class="es-button-border" style="border-style:solid;border-color:#5c68e2;background:#5c68e2;border-width:2px;display:inline-block;border-radius:6px;width:auto">
                                                                    <a href="" target="_blank" class="es-button" style="mso-style-priority:100 !important;text-decoration:none !important;mso-line-height-rule:exactly;color:#FFFFFF;font-size:20px;padding:10px 30px 10px 30px;display:inline-block;background:#5C68E2;border-radius:6px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:24px;width:auto;text-align:center;letter-spacing:0;mso-padding-alt:0;mso-border-alt:10px solid #5C68E2;border-left-width:30px;border-right-width:30px">LIHAT STATUS BOOKING</a>
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="left" class="esdev-adapt-off" style="Margin:0;padding-right:20px;padding-left:20px;padding-top:10px;padding-bottom:10px">
                                        <table cellpadding="0" cellspacing="0" class="esdev-mso-table" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:560px">
                                            ${layananHtmlList}
                                        </table>
                                    </td>
                                </tr>

                                ${totalPriceSection}
                                ${bookingInfoSection}

                                <tr>
                                    <td align="left" style="Margin:0;padding-top:15px;padding-right:20px;padding-left:20px;padding-bottom:10px">
                                        <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr>
                                                <td align="left" style="padding:0;Margin:0;width:560px">
                                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                        <tr>
                                                            <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Ada pertanyaan? Email kami di&nbsp;<a target="_blank" href="mailto:support@example.com" style="mso-line-height-rule:exactly;text-decoration:underline;color:#5C68E2;font-size:14px">support@example.com</a>&nbsp;atau hubungi kami di&nbsp;<a target="_blank" href="tel:+62123456789" style="mso-line-height-rule:exactly;text-decoration:underline;color:#5C68E2;font-size:14px">+62 123 456 789</a>.</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <table cellpadding="0" cellspacing="0" align="center" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
                    <tr>
                        <td align="center" style="padding:0;Margin:0">
                            <table align="center" cellpadding="0" cellspacing="0" class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:640px" role="none">
                                <tr>
                                    <td align="left" style="Margin:0;padding-right:20px;padding-left:20px;padding-bottom:20px;padding-top:20px">
                                        <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr>
                                                <td align="left" style="padding:0;Margin:0;width:600px">
                                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                        <tr>
                                                            <td align="center" style="padding:0;Margin:0;padding-bottom:35px">
                                                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;letter-spacing:0;color:#333333;font-size:12px">© 2025 Salon Kami. All Rights Reserved.</p>
                                                                <p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;letter-spacing:0;color:#333333;font-size:12px">Jl. Contoh No. 123, Jakarta, Indonesia, 12345</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>
</body>
</html>
`;

            await emailService.sendEmail(
                result.email, 
                subject, 
                `Booking baru telah dibuat!\n\nDetail Booking:\n${layananList}\nTanggal: ${tanggal}\nJam: ${jam_mulai}\nTotal: Rp${result.total_harga}\nKode Booking: ${result.booking_number}`, 
                htmlMessage
            );
        }

        res.json({ 
            message: "Booking berhasil dibuat!", 
            booking_id: result.booking_id, 
            status: "pending", 
            booking_number: result.booking_number, 
            total_harga: result.total_harga,
            email: result.email,
            layanan_terpilih: result.layanan_terpilih
        });
    } catch (err) {
        console.error("Error saat membuat booking:", err);
        res.status(500).json({ error: "Terjadi kesalahan, booking gagal dibuat." });
    }
};

const getAllBookings = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    try {
        const results = await bookingService.getAllBookings(page, limit);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getBookingById = async (req, res) => {
    const { id } = req.params;
    
    // Original Redis cache implementation kept as is
    client.get(`booking:${id}`, async (err, data) => {
        if (data) {
            return res.json(JSON.parse(data));
        } else {
            try {
                const booking = await bookingService.getBookingById(id);
                if (booking) {
                    client.setex(`booking:${id}`, 3600, JSON.stringify(booking)); // Cache for 1 hour
                    res.json(booking);
                } else {
                    res.status(404).json({ error: "Booking tidak ditemukan" });
                }
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        }
    });
};

const sendTestEmail = async (req, res) => {
    try {
        await emailService.sendEmail();
        res.send("Email sedang dikirim...");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const confirmBooking = async (req, res) => {
    const { bookingNumber } = req.params;
    
    try {
        await bookingService.updateBookingStatus(bookingNumber, 'confirmed');
        res.json({ message: 'Booking berhasil dikonfirmasi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cancelBooking = async (req, res) => {
    const { bookingNumber } = req.params;
    
    try {
        await bookingService.updateBookingStatus(bookingNumber, 'canceled');
        res.json({ message: 'Booking berhasil dibatalkan' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteBooking = async (req, res) => {
    const { id } = req.params;
    
    try {
        await bookingService.deleteBooking(id);
        res.json({ message: 'Booking berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createBooking,
    getAllBookings,
    getBookingById,
    sendTestEmail,
    confirmBooking,
    cancelBooking,
    deleteBooking
};
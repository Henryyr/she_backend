// Template email booking information
const subject = 'Informasi Penting Booking Salon Anda';

const text = (bookingData) => `
Halo,

Terima kasih telah melakukan booking di She Salon.

Informasi penting:
- Mohon datang tepat waktu sesuai jadwal.
- Pembatalan hanya dapat dilakukan maksimal 30 menit sebelum jadwal.

Detail booking Anda:
- Tanggal: ${bookingData.tanggal}
- Jam mulai: ${bookingData.jam_mulai}
- Layanan ID: ${bookingData.layanan_id}

Jika ada pertanyaan, silakan hubungi kami.

Salam,
Tim She Salon
`;

const html = (bookingData) => `
  <p>Halo,</p>
  <p>Terima kasih telah melakukan booking di <strong>She Salon</strong>.</p>
  <p><strong>Informasi penting:</strong></p>
  <ul>
    <li>Mohon datang tepat waktu sesuai jadwal.</li>
    <li>Pembatalan hanya dapat dilakukan maksimal 30 menit sebelum jadwal.</li>
  </ul>
  <p>Detail booking Anda:</p>
  <ul>
    <li>Tanggal: ${bookingData.tanggal}</li>
    <li>Jam mulai: ${bookingData.jam_mulai}</li>
    <li>Layanan ID: ${bookingData.layanan_id}</li>
  </ul>
  <p>Jika ada pertanyaan, silakan hubungi kami.</p>
  <p>Salam,<br/>Tim She Salon</p>
`;

module.exports = {
  subject,
  text,
  html,
};

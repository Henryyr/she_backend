const { getIO } = require('../socketInstance');

// Emit event saat ada booking baru
function emitNewBookingToAdmin(booking) {
    const io = getIO();
    const bookingData = {
        id: booking.booking_id || booking.id,
        customer: booking.customer || booking.customer_name || booking.user?.fullname || 'Unknown',
        date: booking.tanggal,
        start_time: booking.jam_mulai,
        end_time: booking.jam_selesai,
        services: booking.layanan || booking.services || booking.layanan_id || 'N/A',
        status: booking.status || 'pending',
        booking_number: booking.booking_number
    };
    io.to('admin-room').emit('new-booking', {
        booking: bookingData,
        message: `Booking baru dari ${bookingData.customer}`
    });
}

// Emit event saat status booking berubah
function emitBookingStatusUpdatedToAdmin(booking) {
    const io = getIO();
    io.to('admin-room').emit('booking-status-updated', {
        booking_id: booking.booking_id || booking.id,
        status: booking.status,
        message: `Status booking #${booking.booking_id || booking.id} berubah menjadi ${booking.status}`
    });
}

module.exports = { emitNewBookingToAdmin, emitBookingStatusUpdatedToAdmin };
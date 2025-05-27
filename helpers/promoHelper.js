function getRandomPromo(bookingCount, lastBookingHadPromo, total_harga) {
    let max_discount_percent = 0;
    if (bookingCount >= 8) {
        max_discount_percent = 15;
    } else if (bookingCount >= 5) {
        max_discount_percent = 10;
    } else if (bookingCount >= 3) {
        max_discount_percent = 5;
    }
    let discount_percent = 0;
    // Tidak boleh promo berturut-turut
    if (!lastBookingHadPromo && max_discount_percent > 0) {
        discount_percent = Math.floor(Math.random() * (max_discount_percent + 1)); // 0 sampai max
    }
    const discount_amount = discount_percent > 0 ? Math.round(total_harga * discount_percent / 100) : 0;
    return {
        discount_percent,
        discount_amount
    };
}

module.exports = { getRandomPromo };

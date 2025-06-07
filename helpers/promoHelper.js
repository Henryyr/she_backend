function getRandomPromo(
  bookingCount,
  lastBookingHadPromo,
  total_harga,
  layanan_ids = [],
  layananList = []
) {
  // Promo user baru: 20% hanya untuk smoothing keratin (id = 5) dan total harga smoothing keratin > 0
  const smoothingKeratinId = 5;
  const hasSmoothingKeratin = layanan_ids.includes(smoothingKeratinId);
  let smoothingKeratinHarga = 0;
  if (hasSmoothingKeratin && Array.isArray(layananList)) {
    const found = layananList.find((l) => l.id == smoothingKeratinId);
    if (found) smoothingKeratinHarga = parseFloat(found.harga);
  }
  if (bookingCount === 0 && hasSmoothingKeratin && smoothingKeratinHarga > 0) {
    return {
      discount_percent: 20,
      discount_amount: Math.round(smoothingKeratinHarga * 0.2),
      is_new_user: true,
      promo_target_layanan_id: smoothingKeratinId,
      promo_target_layanan_harga: smoothingKeratinHarga,
    };
  }

  let max_discount_percent = 5; // Adjust maximum discount to 5%
  let discount_percent = 0;

  // Tidak boleh promo berturut-turut
  if (!lastBookingHadPromo && max_discount_percent > 0) {
    discount_percent = Math.floor(Math.random() * (max_discount_percent + 1)); // 0 sampai max
  }

  const discount_amount =
    discount_percent > 0
      ? Math.round((total_harga * discount_percent) / 100)
      : 0;
  return {
    discount_percent,
    discount_amount,
    is_new_user: false,
  };
}

module.exports = { getRandomPromo };

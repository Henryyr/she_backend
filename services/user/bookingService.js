const { pool } = require("../../db");
const bookingValidationHelper = require("../../helpers/bookingValidationHelper");
const stockService = require("./stockService");
const { RATE_LIMIT } = require("../../config/rateLimit");
const bookingHelper = require("../../helpers/bookingHelper");
const voucherService = require("../../services/user/voucherService"); // Add voucherService


const getProductDetails = (connection, { hair_color, smoothing_product, keratin_product }) => {
    const queries = [];

    if (hair_color) {
        queries.push(
            connection.query(
                `SELECT 'hair_color' as type, hc.*, hp.harga_dasar, pb.nama as brand_nama FROM hair_colors hc JOIN hair_products hp ON hc.product_id = hp.id JOIN product_brands pb ON hp.brand_id = pb.id WHERE hc.id = ?`,
                [hair_color.color_id]
            )
        );
    }
    if (smoothing_product) {
        queries.push(
            connection.query(
                `SELECT 'smoothing' as type, sp.*, pb.nama as brand_nama FROM smoothing_products sp JOIN product_brands pb ON sp.brand_id = pb.id WHERE sp.id = ?`,
                [smoothing_product.product_id]
            )
        );
    }
    if (keratin_product) {
        queries.push(
            connection.query(
                `SELECT 'keratin' as type, kp.*, pb.nama as brand_nama FROM keratin_products kp JOIN product_brands pb ON kp.brand_id = pb.id WHERE kp.id = ?`,
                [keratin_product.product_id]
            )
        );
    }

    return Promise.all(queries);
};

const createBooking = async (data) => {
  const { user_id, layanan_id, tanggal, jam_mulai, hair_color, smoothing_product, keratin_product, voucher_code } = data;
  const layanan_ids = Array.isArray(layanan_id) ? layanan_id : [layanan_id];
  const connection = await pool.getConnection();

  try {
    // =================================================================
    // TAHAP 1: VALIDASI & PENGAMBILAN DATA (SECARA PARALEL)
    // Semua query SELECT dijalankan di luar transaksi untuk efisiensi
    // =================================================================
    const [
        [rateLimitResult],
        [existingBookings],
        [layananWithCategory],
        productQueryResults,
        voucherResult // Bisa undefined jika tidak ada voucher_code
    ] = await Promise.all([
        connection.query(`SELECT COUNT(*) as count FROM booking WHERE user_id = ? AND created_at > NOW() - INTERVAL ? MINUTE`, [user_id, process.env.NODE_ENV === "production" ? 60 : 5]),
        connection.query("SELECT id FROM booking WHERE user_id = ? AND tanggal = ? AND status NOT IN ('cancelled', 'completed')", [user_id, tanggal]),
        connection.query(`SELECT l.*, lk.nama as kategori_nama FROM layanan l JOIN kategori_layanan lk ON l.kategori_id = lk.id WHERE l.id IN (?)`, [layanan_ids]),
        getProductDetails(connection, { hair_color, smoothing_product, keratin_product }),
        voucher_code ? voucherService.validateVoucher(voucher_code, user_id, 0) : Promise.resolve(null)
    ]);
    
    // --- Lakukan semua validasi di sini ---
    if (rateLimitResult[0].count >= RATE_LIMIT.DATABASE.MAX_REQUESTS) {
        throw new Error(`Rate limit terlampaui. Silakan coba lagi nanti.`);
    }
    if (existingBookings.length > 0) {
        throw new Error("Anda sudah memiliki booking pada hari ini.");
    }
    if (layananWithCategory.length !== layanan_ids.length) {
        throw new Error("Beberapa layanan tidak valid.");
    }

    const categories = layananWithCategory.map((l) => l.kategori_nama);
    bookingValidationHelper.isProductUnnecessary(categories, hair_color, smoothing_product, keratin_product);
    if (bookingValidationHelper.isIncompatibleCombo(categories) || bookingValidationHelper.hasDuplicateCategory(categories)) {
        throw new Error("Kombinasi layanan atau duplikasi kategori tidak diperbolehkan.");
    }
    if (categories.includes("Cat Rambut") && !hair_color) {
        throw new Error("Layanan Cat Rambut membutuhkan pemilihan warna.");
    }

    // Olah hasil query produk
    const productResults = productQueryResults.flat().map(res => res[0]);
    let total_harga = layananWithCategory.reduce((sum, l) => sum + parseFloat(l.harga), 0);
    let product_detail = {};

    productResults.forEach((result) => {
        if (!result) throw new Error("Salah satu produk yang dipilih tidak ditemukan.");
        switch (result.type) {
            case "hair_color":
                total_harga += parseFloat(result.harga_dasar) + parseFloat(result.tambahan_harga);
                product_detail.hair_color = result;
                break;
            case "smoothing":
                total_harga += parseFloat(result.harga);
                product_detail.smoothing = result;
                break;
            case "keratin":
                total_harga += parseFloat(result.harga);
                product_detail.keratin = result;
                break;
        }
    });

    // Validasi ulang voucher dengan total harga yang benar
    let final_price = total_harga;
    let discount = 0;
    let voucher_id = null;
    let voucher = { id: null, discount: 0, message: "Tidak ada voucher yang diterapkan." };
    if (voucher_code) {
        try {
            const finalVoucherResult = await voucherService.validateVoucher(voucher_code, user_id, total_harga);
            voucher_id = finalVoucherResult.voucherId ? parseInt(finalVoucherResult.voucherId) : null;
            if (!voucher_id) throw new Error("Voucher ID tidak valid.");
            
            if (finalVoucherResult.discount_type === 'percentage') {
                discount = (total_harga * finalVoucherResult.discount_value) / 100;
            } else {
                discount = finalVoucherResult.discount_value;
            }
            final_price = Math.max(0, total_harga - discount);
            voucher = { id: voucher_id, discount: Math.round(discount), message: `Voucher "${voucher_code}" berhasil diterapkan.` };
        } catch (voucherError) {
            voucher.message = `Voucher "${voucher_code}" tidak valid: ${voucherError.message}.`;
        }
    }
    final_price = Math.round(final_price);

    // =================================================================
    // TAHAP 2: TRANSAKSI DATABASE (HANYA OPERASI TULIS)
    // Transaksi menjadi lebih singkat dan cepat.
    // =================================================================
    await connection.beginTransaction();
    try {
        const bookingNumber = await bookingHelper.generateBookingNumber();
        const total_estimasi = layananWithCategory.reduce((sum, l) => sum + l.estimasi_waktu, 0);
        const jam_selesai = new Date(`${tanggal} ${jam_mulai}`);
        jam_selesai.setMinutes(jam_selesai.getMinutes() + total_estimasi);
        const jam_selesai_string = jam_selesai.toTimeString().split(" ")[0];

        const [insertResult] = await connection.query(
            `INSERT INTO booking (user_id, tanggal, jam_mulai, jam_selesai, status, booking_number, total_harga, special_request, voucher_id, discount, final_price) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
            [user_id, tanggal, jam_mulai, jam_selesai_string, bookingNumber, total_harga, data.special_request || null, voucher_id, discount, final_price]
        );
        const booking_id = insertResult.insertId;

        const bookingLayananValues = layanan_ids.map(id => [booking_id, id]);
        await connection.query(`INSERT INTO booking_layanan (booking_id, layanan_id) VALUES ?`, [bookingLayananValues]);

        if (hair_color) {
            await connection.query(`INSERT INTO booking_colors (booking_id, color_id, brand_id, harga_saat_booking) VALUES (?, ?, ?, ?)`, [booking_id, hair_color.color_id, hair_color.brand_id, product_detail.hair_color.tambahan_harga]);
            await stockService.reduceHairColorStock(hair_color.color_id, 1, connection);
        }
        if (smoothing_product) {
            await stockService.reduceSmoothingStock(smoothing_product.product_id, smoothing_product.brand_id, 1, connection);
        }
        if (keratin_product) {
            await stockService.reduceKeratinStock(keratin_product.product_id, keratin_product.brand_id, 1, connection);
        }

        await connection.commit();

        // Siapkan data respons
        const cancel_timer = Math.max(0, Math.floor((new Date(`${tanggal}T${jam_mulai}:00+08:00`).getTime() + 30 * 60000 - Date.now()) / 1000));
        delete product_detail?.hair_color?.stok;
        delete product_detail?.smoothing?.stok;
        delete product_detail?.keratin?.stok;
        
        return {
            booking_id,
            booking_number: bookingNumber,
            layanan_id: layanan_ids,
            total_harga: final_price,
            status: "pending",
            layanan: layananWithCategory.map((l) => l.nama),
            tanggal,
            jam_mulai,
            jam_selesai: jam_selesai_string,
            product_detail,
            special_request: data.special_request || null,
            voucher,
            cancel_timer,
        };

    } catch (err) {
        await connection.rollback();
        throw err; // Lemparkan error agar ditangani di blok catch luar
    }
  } catch (err) {
    // Tidak perlu rollback di sini karena sudah ditangani di dalam blok try-catch transaksi
    throw err;
  } finally {
    connection.release();
  }
};
const getAllBookings = async (page = 1, limit = 10, user_id) => {
  const connection = await pool.getConnection();
  try {
    const offset = (page - 1) * limit;
    const [bookings] = await connection.query(
      `
            SELECT /*+ INDEX(b idx_booking_created) */ b.*,
                GROUP_CONCAT(l.nama ORDER BY l.id) as layanan_names,
                GROUP_CONCAT(l.id) as layanan_ids
            FROM booking b
            LEFT JOIN booking_layanan bl ON b.id = bl.booking_id
            LEFT JOIN layanan l ON bl.layanan_id = l.id
            WHERE b.user_id = ?
            GROUP BY b.id
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `,
      [user_id, limit, offset]
    );

    const [totalCount] = await connection.query(
      "SELECT COUNT(*) as total FROM booking WHERE user_id = ?",
      [user_id]
    );

    // Tambahkan layanan_id array ke setiap booking, hapus layanan_ids property
    const bookingsWithLayananId = bookings.map((b) => {
      const { layanan_ids, ...rest } = b;
      return {
        ...rest,
        layanan_id: layanan_ids
          ? layanan_ids.split(",").map((x) => Number(x))
          : [],
      };
    });

    return {
      bookings: bookingsWithLayananId,
      pagination: {
        total: totalCount[0].total,
        page,
        limit,
        totalPages: Math.ceil(totalCount[0].total / limit),
      },
    };
  } finally {
    connection.release();
  }
};

const getBookingById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [booking] = await connection.query(
      `SELECT 
                b.*, 
                GROUP_CONCAT(l.nama) as layanan_names,
                GROUP_CONCAT(l.id) as layanan_ids
             FROM booking b
             LEFT JOIN booking_layanan bl ON b.id = bl.booking_id
             LEFT JOIN layanan l ON bl.layanan_id = l.id
             WHERE b.id = ?
             GROUP BY b.id`,
      [id]
    );

    if (!booking[0]) {
      throw new Error("Booking tidak ditemukan");
    }

    let cancel_timer = null;
    try {
      const now = new Date();
      let tanggalStr = booking[0].tanggal;
      if (typeof tanggalStr === "string" && tanggalStr.includes("T")) {
        tanggalStr = tanggalStr.split("T")[0];
      } else if (tanggalStr instanceof Date) {
        tanggalStr = tanggalStr.toISOString().split("T")[0];
      }
      let jamStr = booking[0].jam_mulai;
      if (typeof jamStr === "string" && jamStr.length > 5) {
        jamStr = jamStr.slice(0, 5);
      }
      const nowWITA = new Date(
        now.getTime() +
          (8 - now.getTimezoneOffset() / 60) * 60 * 60 * 1000 -
          now.getTimezoneOffset() * 60 * 1000
      );
      const startDateTime = new Date(`${tanggalStr}T${jamStr}:00+08:00`);
      const batasCancel = new Date(startDateTime.getTime() + 30 * 60000);
      cancel_timer = Math.max(
        0,
        Math.floor((batasCancel.getTime() - nowWITA.getTime()) / 1000)
      );
    } catch (e) {
      cancel_timer = null;
    }

    // Parse layanan_ids ke array number dan hapus layanan_ids dari response
    let layanan_id = [];
    if (booking[0].layanan_ids) {
      layanan_id = booking[0].layanan_ids.split(",").map((x) => Number(x));
    }
    const { layanan_ids, ...rest } = booking[0];

    return {
      ...rest,
      layanan_id,
      cancel_timer,
    };
  } catch (error) {
    throw new Error(`Error getting booking: ${error.message}`);
  } finally {
    connection.release();
  }
};

const cancelBooking = async (id, user_id) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // FIX: First get the booking to check if it exists and get voucher_id
        const [existingBooking] = await connection.query(
            "SELECT id, voucher_id, user_id FROM booking WHERE id = ?",
            [id]
        );

        if (existingBooking.length === 0) {
            throw new Error("Booking tidak ditemukan");
        }

        // Verify user ownership
        if (existingBooking[0].user_id !== user_id) {
            throw new Error("Akses ditolak - bukan pemilik booking");
        }

        // Update status booking
        const [result] = await connection.query(
            "UPDATE booking SET status = ? WHERE id = ?",
            ["cancelled", id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Gagal mengupdate status booking");
        }

        // FIX: Delete voucher usage if exists, using connection (not pool) for transaction
        if (existingBooking[0].voucher_id) {
            await connection.query(
                `DELETE FROM voucher_usages WHERE user_id = ? AND voucher_id = ?`,
                [user_id, existingBooking[0].voucher_id]
            );
        }

        await connection.commit();
        return { message: "Booking berhasil dibatalkan", booking_id: id };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const postAvailableSlots = async (tanggal, estimasi_waktu = 60) => {
  const operatingHours = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
  ];

  const [bookings] = await pool.query(
    `SELECT jam_mulai, jam_selesai FROM booking 
         WHERE tanggal = ? AND status NOT IN ('canceled', 'completed')`,
    [tanggal]
  );

  function toMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  }

  bookings.sort((a, b) => toMinutes(a.jam_mulai) - toMinutes(b.jam_mulai));

  const availableSlots = [];
  const bookedSlots = [];

  for (const time of operatingHours) {
    const startMinutes = toMinutes(time);
    const endMinutes = startMinutes + estimasi_waktu;

    // Cari booking berikutnya setelah slot ini
    const nextBooking = bookings.find(
      (b) => toMinutes(b.jam_mulai) > startMinutes
    );

    // Slot available jika TIDAK overlap dengan booking manapun
    let canBook = true;
    for (const b of bookings) {
      const bStart = toMinutes(
        b.jam_mulai.length === 5 ? b.jam_mulai : b.jam_mulai.slice(0, 5)
      );
      const bEnd = toMinutes(
        b.jam_selesai.length === 5 ? b.jam_selesai : b.jam_selesai.slice(0, 5)
      );
      if (startMinutes < bEnd && endMinutes > bStart) {
        canBook = false;
        break;
      }
    }

    // Jika ada booking berikutnya, layanan tidak boleh melewati jam booking berikutnya
    if (canBook && nextBooking) {
      const nextStart = toMinutes(
        nextBooking.jam_mulai.length === 5
          ? nextBooking.jam_mulai
          : nextBooking.jam_mulai.slice(0, 5)
      );
      if (endMinutes > nextStart) {
        canBook = false;
      }
    }

    if (canBook) {
      availableSlots.push(time);
    } else {
      bookedSlots.push(time);
    }
  }

  return {
    tanggal,
    estimasi_waktu,
    available_slots: availableSlots,
    booked_slots: bookedSlots,
    total_available: availableSlots.length,
  };
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  cancelBooking,
  postAvailableSlots,
};
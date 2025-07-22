-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 22, 2025 at 06:35 AM
-- Server version: 11.8.2-MariaDB
-- PHP Version: 8.4.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `she_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `blacklisted_tokens`
--

CREATE TABLE `blacklisted_tokens` (
  `token_id` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `booking_number` varchar(20) DEFAULT NULL,
  `total_harga` decimal(10,2) NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `special_request` text DEFAULT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `final_price` decimal(10,2) DEFAULT 0.00,
  `reminder_sent` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_colors`
--

CREATE TABLE `booking_colors` (
  `booking_id` int(11) DEFAULT NULL,
  `color_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `harga_saat_booking` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_keratin`
--

CREATE TABLE `booking_keratin` (
  `booking_id` int(11) DEFAULT NULL,
  `keratin_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `harga_saat_booking` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_layanan`
--

CREATE TABLE `booking_layanan` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `layanan_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_smoothing`
--

CREATE TABLE `booking_smoothing` (
  `booking_id` int(11) DEFAULT NULL,
  `smoothing_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `harga_saat_booking` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hair_colors`
--

CREATE TABLE `hair_colors` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `kategori` varchar(50) DEFAULT NULL,
  `level` varchar(20) DEFAULT NULL,
  `stok` int(11) NOT NULL DEFAULT 0,
  `tambahan_harga` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hair_colors`
--

INSERT INTO `hair_colors` (`id`, `product_id`, `nama`, `kategori`, `level`, `stok`, `tambahan_harga`) VALUES
(1, 1, 'Dark Brown', 'Natural', '3', 0, 0.00),
(2, 1, 'Medium Brown', 'Natural', '4', 15, 0.00),
(3, 1, 'Light Brown', 'Natural', '5', 15, 0.00),
(4, 1, 'Dark Blonde', 'Natural', '6', 15, 0.00),
(5, 1, 'Medium Blonde', 'Natural', '7', 15, 20000.00),
(6, 1, 'Light Ash Brown', 'Ash', '5', 10, 20000.00),
(7, 1, 'Dark Ash Blonde', 'Ash', '6', 10, 20000.00),
(8, 1, 'Medium Ash Blonde', 'Ash', '7', 10, 30000.00),
(9, 1, 'Medium Brown Red Violet', 'Fashion', '4', 8, 50000.00),
(10, 1, 'Light Brown Intense Red', 'Fashion', '5', 8, 50000.00),
(11, 1, 'Medium Blonde Purple', 'Fashion', '7', 8, 75000.00),
(12, 3, 'Golden Brown', 'Warm', '4', 2, 30000.00),
(13, 3, 'Light Mahogany Brown', 'Warm', '5', 9, 30000.00),
(14, 3, 'Dark Ash Blonde', 'Cool', '6', 10, 30000.00),
(15, 3, 'Intense Copper Blonde', 'Copper', '7', 8, 50000.00),
(16, 3, 'Light Iridescent Ash Blonde', 'Pearl', '8', 8, 75000.00),
(17, 4, 'Light Brown', 'Natural', '5', 10, 20000.00),
(18, 4, 'Dark Ash Blonde', 'Ash', '6', 10, 20000.00),
(19, 4, 'Medium Red Gold Blonde', 'Fashion', '7', 8, 50000.00),
(20, 4, 'Light Cendre Violet Blonde', 'Fashion', '8', 8, 75000.00),
(21, 4, 'Lightest Pearl Cendre Blonde', 'Pearl', '10', 5, 100000.00);

-- --------------------------------------------------------

--
-- Table structure for table `hair_products`
--

CREATE TABLE `hair_products` (
  `id` int(11) NOT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `harga_dasar` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hair_products`
--

INSERT INTO `hair_products` (`id`, `brand_id`, `nama`, `jenis`, `deskripsi`, `harga_dasar`) VALUES
(1, 1, 'Matrix SoColor', 'Permanent Color', 'Pewarna rambut permanen dengan formula ultra coverage', 200000.00),
(2, 1, 'Matrix Wonder Color', 'Demi-Permanent', 'Pewarna semi permanen tanpa amonia', 180000.00),
(3, 2, 'L\'Oreal Majirel', 'Permanent Color', 'Pewarna premium dengan teknologi Ionène G', 250000.00),
(4, 3, 'Wella Koleston', 'Permanent Color', 'Pewarna profesional dengan pure balance technology', 230000.00);

-- --------------------------------------------------------

--
-- Table structure for table `kategori_layanan`
--

CREATE TABLE `kategori_layanan` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kategori_layanan`
--

INSERT INTO `kategori_layanan` (`id`, `nama`) VALUES
(1, 'Gaya Rambut'),
(2, 'Cat Rambut'),
(3, 'Smoothing'),
(4, 'Keratin'),
(5, 'Make Up'),
(6, 'Facial');

-- --------------------------------------------------------

--
-- Table structure for table `kategori_transaksi`
--

CREATE TABLE `kategori_transaksi` (
  `id` int(11) NOT NULL,
  `nama` varchar(50) NOT NULL COMMENT 'Cash, QRIS, Transfer Bank, dll.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kategori_transaksi`
--

INSERT INTO `kategori_transaksi` (`id`, `nama`) VALUES
(1, 'Cash'),
(2, 'Cashless');

-- --------------------------------------------------------

--
-- Table structure for table `keratin_products`
--

CREATE TABLE `keratin_products` (
  `id` int(11) NOT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis` varchar(100) NOT NULL,
  `harga` decimal(10,2) NOT NULL,
  `stok` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `keratin_products`
--

INSERT INTO `keratin_products` (`id`, `brand_id`, `nama`, `jenis`, `harga`, `stok`) VALUES
(1, 1, 'Matrix Keratin Regular', 'Treatment', 450000.00, 0),
(2, 1, 'Matrix Keratin Premium', 'Treatment', 650000.00, 6),
(3, 2, 'Loreal Keratin Gold', 'Treatment', 850000.00, 0);

-- --------------------------------------------------------

--
-- Table structure for table `layanan`
--

CREATE TABLE `layanan` (
  `id` int(11) NOT NULL,
  `kategori_id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `harga` decimal(10,2) NOT NULL,
  `estimasi_waktu` int(11) NOT NULL COMMENT 'Estimasi waktu dalam menit'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `layanan`
--

INSERT INTO `layanan` (`id`, `kategori_id`, `nama`, `harga`, `estimasi_waktu`) VALUES
(1, 1, 'Potong Pendek', 50000.00, 30),
(2, 1, 'Potong Panjang', 70000.00, 45),
(3, 2, 'Highlight', 150000.00, 60),
(4, 2, 'Full Color', 200000.00, 90),
(5, 3, 'Smoothing Keratin', 250000.00, 120),
(6, 3, 'Smoothing Collagen', 270000.00, 120),
(7, 3, 'Smoothing Blow', 300000.00, 130),
(8, 4, 'Keratin Treatment', 300000.00, 90),
(9, 5, 'Make Up Wisuda', 350000.00, 60),
(10, 5, 'Make Up Pesta', 400000.00, 75),
(11, 6, 'Facial Basic', 150000.00, 45),
(12, 6, 'Facial Premium', 250000.00, 60);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_brands`
--

CREATE TABLE `product_brands` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_brands`
--

INSERT INTO `product_brands` (`id`, `nama`) VALUES
(4, 'Goldwell'),
(2, 'L\'Oreal'),
(1, 'Matrix'),
(3, 'Wella');

-- --------------------------------------------------------

--
-- Table structure for table `smoothing_products`
--

CREATE TABLE `smoothing_products` (
  `id` int(11) NOT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis` varchar(100) NOT NULL,
  `harga` decimal(10,2) NOT NULL,
  `stok` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `smoothing_products`
--

INSERT INTO `smoothing_products` (`id`, `brand_id`, `nama`, `jenis`, `harga`, `stok`) VALUES
(1, 1, 'Matrix Opti Normal', 'Cream Smoothing', 500000.00, 2),
(2, 1, 'Matrix Opti Resistant', 'Cream Smoothing', 600000.00, 8),
(3, 2, 'Loreal X-Tenso Normal', 'Cream Smoothing', 700000.00, 5);

-- --------------------------------------------------------

--
-- Table structure for table `testimoni`
--

CREATE TABLE `testimoni` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `comment` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','rejected') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `testimoni_layanan`
--

CREATE TABLE `testimoni_layanan` (
  `testimoni_id` int(11) NOT NULL,
  `layanan_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `kategori_transaksi_id` int(11) NOT NULL,
  `total_harga` decimal(10,2) NOT NULL,
  `status` enum('Pending','Completed') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `midtrans_order_id` varchar(50) DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL,
  `dp_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('Unpaid','DP','Paid') NOT NULL DEFAULT 'Unpaid',
  `pelunasan_order_id` varchar(255) DEFAULT NULL,
  `booking_number` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `role` enum('admin','pelanggan') NOT NULL DEFAULT 'pelanggan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fullname`, `email`, `phone_number`, `username`, `password`, `address`, `created_at`, `role`) VALUES
(7, 'admin 1', 'admin123@gmail.com', '0812344231', 'admin123', '$2b$10$bQWqaXJhZPICZScj5bG5e.6a0MlwWU1ydBybcqbJKFGEXHqSmTd9a', 'Jl. Taman Giri', '2025-02-27 14:07:44', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `vouchers`
--

CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) DEFAULT 0,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voucher_usages`
--

CREATE TABLE `voucher_usages` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `voucher_id` int(11) NOT NULL,
  `used_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blacklisted_tokens`
--
ALTER TABLE `blacklisted_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_user_tanggal` (`user_id`,`tanggal`),
  ADD KEY `idx_booking_created` (`created_at`),
  ADD KEY `idx_created_status` (`created_at`,`status`),
  ADD KEY `booking_ibfk_2` (`voucher_id`);

--
-- Indexes for table `booking_colors`
--
ALTER TABLE `booking_colors`
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `color_id` (`color_id`),
  ADD KEY `brand_id` (`brand_id`);

--
-- Indexes for table `booking_keratin`
--
ALTER TABLE `booking_keratin`
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `keratin_id` (`keratin_id`),
  ADD KEY `brand_id` (`brand_id`);

--
-- Indexes for table `booking_layanan`
--
ALTER TABLE `booking_layanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `layanan_id` (`layanan_id`),
  ADD KEY `booking_id_idx` (`booking_id`),
  ADD KEY `idx_booking_id` (`booking_id`);

--
-- Indexes for table `booking_smoothing`
--
ALTER TABLE `booking_smoothing`
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `smoothing_id` (`smoothing_id`),
  ADD KEY `brand_id` (`brand_id`);

--
-- Indexes for table `hair_colors`
--
ALTER TABLE `hair_colors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hc_product_id` (`product_id`),
  ADD KEY `idx_hc_stok` (`stok`),
  ADD KEY `idx_hc_kategori` (`kategori`);

--
-- Indexes for table `hair_products`
--
ALTER TABLE `hair_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_brand_id` (`brand_id`),
  ADD KEY `idx_hp_brand_id` (`brand_id`);

--
-- Indexes for table `kategori_layanan`
--
ALTER TABLE `kategori_layanan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kategori_transaksi`
--
ALTER TABLE `kategori_transaksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

--
-- Indexes for table `keratin_products`
--
ALTER TABLE `keratin_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_kp_brand_id` (`brand_id`),
  ADD KEY `idx_kp_stok` (`stok`);

--
-- Indexes for table `layanan`
--
ALTER TABLE `layanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kategori_id` (`kategori_id`),
  ADD KEY `idx_layanan_id` (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `token` (`token`);

--
-- Indexes for table `product_brands`
--
ALTER TABLE `product_brands`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pb_nama` (`nama`);

--
-- Indexes for table `smoothing_products`
--
ALTER TABLE `smoothing_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sp_brand_id` (`brand_id`),
  ADD KEY `idx_sp_stok` (`stok`);

--
-- Indexes for table `testimoni`
--
ALTER TABLE `testimoni`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `testimoni_layanan`
--
ALTER TABLE `testimoni_layanan`
  ADD PRIMARY KEY (`testimoni_id`,`layanan_id`),
  ADD KEY `layanan_id` (`layanan_id`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `midtrans_order_id` (`midtrans_order_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `kategori_transaksi_id` (`kategori_transaksi_id`),
  ADD KEY `idx_user_status` (`user_id`,`status`),
  ADD KEY `idx_created_status` (`created_at`,`status`),
  ADD KEY `idx_user_booking` (`user_id`,`booking_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_transaksi_booking_id` (`booking_id`),
  ADD KEY `idx_transaksi_midtrans_order_id` (`midtrans_order_id`),
  ADD KEY `idx_transaksi_pelunasan_order_id` (`pelunasan_order_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_role_created` (`role`,`created_at` DESC);

--
-- Indexes for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `voucher_usages`
--
ALTER TABLE `voucher_usages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_voucher` (`user_id`,`voucher_id`),
  ADD KEY `voucher_usages_ibfk_2` (`voucher_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `booking`
--
ALTER TABLE `booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=337;

--
-- AUTO_INCREMENT for table `booking_layanan`
--
ALTER TABLE `booking_layanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=482;

--
-- AUTO_INCREMENT for table `hair_colors`
--
ALTER TABLE `hair_colors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `hair_products`
--
ALTER TABLE `hair_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `kategori_layanan`
--
ALTER TABLE `kategori_layanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `kategori_transaksi`
--
ALTER TABLE `kategori_transaksi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `keratin_products`
--
ALTER TABLE `keratin_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `layanan`
--
ALTER TABLE `layanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `product_brands`
--
ALTER TABLE `product_brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `smoothing_products`
--
ALTER TABLE `smoothing_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `testimoni`
--
ALTER TABLE `testimoni`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `voucher_usages`
--
ALTER TABLE `voucher_usages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_colors`
--
ALTER TABLE `booking_colors`
  ADD CONSTRAINT `booking_colors_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_colors_ibfk_2` FOREIGN KEY (`color_id`) REFERENCES `hair_colors` (`id`),
  ADD CONSTRAINT `booking_colors_ibfk_3` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`);

--
-- Constraints for table `booking_keratin`
--
ALTER TABLE `booking_keratin`
  ADD CONSTRAINT `booking_keratin_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`),
  ADD CONSTRAINT `booking_keratin_ibfk_2` FOREIGN KEY (`keratin_id`) REFERENCES `keratin_products` (`id`),
  ADD CONSTRAINT `booking_keratin_ibfk_3` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`);

--
-- Constraints for table `booking_layanan`
--
ALTER TABLE `booking_layanan`
  ADD CONSTRAINT `booking_layanan_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_layanan_ibfk_2` FOREIGN KEY (`layanan_id`) REFERENCES `layanan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_smoothing`
--
ALTER TABLE `booking_smoothing`
  ADD CONSTRAINT `booking_smoothing_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`),
  ADD CONSTRAINT `booking_smoothing_ibfk_2` FOREIGN KEY (`smoothing_id`) REFERENCES `smoothing_products` (`id`),
  ADD CONSTRAINT `booking_smoothing_ibfk_3` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`);

--
-- Constraints for table `hair_colors`
--
ALTER TABLE `hair_colors`
  ADD CONSTRAINT `hair_colors_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `hair_products` (`id`);

--
-- Constraints for table `hair_products`
--
ALTER TABLE `hair_products`
  ADD CONSTRAINT `hair_products_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`);

--
-- Constraints for table `keratin_products`
--
ALTER TABLE `keratin_products`
  ADD CONSTRAINT `keratin_products_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`);

--
-- Constraints for table `layanan`
--
ALTER TABLE `layanan`
  ADD CONSTRAINT `layanan_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_layanan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `smoothing_products`
--
ALTER TABLE `smoothing_products`
  ADD CONSTRAINT `smoothing_products_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`);

--
-- Constraints for table `testimoni`
--
ALTER TABLE `testimoni`
  ADD CONSTRAINT `testimoni_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `testimoni_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`);

--
-- Constraints for table `testimoni_layanan`
--
ALTER TABLE `testimoni_layanan`
  ADD CONSTRAINT `testimoni_layanan_ibfk_1` FOREIGN KEY (`testimoni_id`) REFERENCES `testimoni` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `testimoni_layanan_ibfk_2` FOREIGN KEY (`layanan_id`) REFERENCES `layanan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaksi_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaksi_ibfk_3` FOREIGN KEY (`kategori_transaksi_id`) REFERENCES `kategori_transaksi` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `voucher_usages`
--
ALTER TABLE `voucher_usages`
  ADD CONSTRAINT `voucher_usages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `voucher_usages_ibfk_2` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `cleanup_old_tokens` ON SCHEDULE EVERY 12 HOUR STARTS '2025-04-19 17:52:43' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    DELETE FROM blacklisted_tokens WHERE expires_at < NOW() - INTERVAL 48 HOUR;
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

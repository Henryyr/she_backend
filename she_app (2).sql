-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 19, 2025 at 07:50 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.16

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
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `booking_number` varchar(20) DEFAULT NULL,
  `total_harga` decimal(10,2) NOT NULL,
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`id`, `user_id`, `tanggal`, `jam_mulai`, `jam_selesai`, `status`, `created_at`, `booking_number`, `total_harga`, `completed_at`) VALUES
(127, 9, '2024-02-20', '10:00:00', '10:30:00', 'pending', '2025-04-12 16:48:57', 'BKG-20250412-001', 50000.00, NULL),
(128, 9, '2024-02-21', '10:00:00', '13:30:00', 'pending', '2025-04-12 16:58:08', 'BKG-20250412-002', 1150000.00, NULL),
(129, 9, '2024-02-25', '10:00:00', '13:30:00', 'pending', '2025-04-12 17:03:15', 'BKG-20250412-003', 1600000.00, NULL),
(130, 9, '2024-02-27', '10:00:00', '13:30:00', 'pending', '2025-04-12 17:09:36', 'BKG-20250412-004', 1600000.00, NULL),
(131, 9, '2024-01-20', '10:00:00', '12:30:00', 'pending', '2025-04-12 18:53:26', 'BKG-20250412-005', 1300000.00, NULL),
(132, 9, '2024-01-22', '10:00:00', '11:30:00', 'pending', '2025-04-12 18:55:44', 'BKG-20250412-006', 200000.00, NULL),
(133, 9, '2024-01-23', '10:00:00', '12:00:00', 'pending', '2025-04-12 18:58:40', 'BKG-20250412-007', 450000.00, NULL),
(134, 9, '2024-01-24', '10:00:00', '12:00:00', 'pending', '2025-04-12 18:59:09', 'BKG-20250412-008', 450000.00, NULL),
(135, 9, '2024-01-26', '10:00:00', '11:30:00', 'pending', '2025-04-12 19:05:48', 'BKG-20250412-009', 750000.00, NULL),
(136, 9, '2024-01-28', '10:00:00', '10:30:00', 'pending', '2025-04-12 19:06:27', 'BKG-20250412-010', 50000.00, NULL),
(137, 9, '2024-01-29', '10:00:00', '10:30:00', 'pending', '2025-04-12 19:10:14', 'BKG-20250412-011', 50000.00, NULL),
(138, 9, '2024-01-30', '10:00:00', '10:30:00', 'pending', '2025-04-12 19:48:31', 'BKG-20250412-012', 50000.00, NULL),
(139, 9, '2024-02-29', '10:00:00', '12:30:00', 'pending', '2025-04-12 19:50:16', 'BKG-20250412-013', 800000.00, NULL),
(140, 9, '2024-04-20', '10:00:00', '10:30:00', 'pending', '2025-04-14 12:44:00', 'BKG-20250414-001', 50000.00, NULL),
(141, 22, '2024-01-20', '13:00:00', '13:30:00', 'pending', '2025-04-14 12:44:23', 'BKG-20250414-002', 50000.00, NULL),
(142, 9, '2024-04-21', '10:00:00', '11:30:00', 'pending', '2025-04-14 12:44:59', 'BKG-20250414-003', 400000.00, NULL),
(143, 9, '2024-04-22', '10:00:00', '11:30:00', 'pending', '2025-04-14 12:47:03', 'BKG-20250414-004', 400000.00, NULL),
(144, 22, '2025-04-29', '10:00:00', '10:30:00', 'confirmed', '2025-04-14 13:33:30', 'BKG-20250414-005', 50000.00, NULL),
(145, 22, '2025-04-23', '13:00:00', '13:30:00', 'confirmed', '2025-04-14 14:19:25', 'BKG-20250414-006', 50000.00, NULL),
(146, 22, '2025-05-01', '10:00:00', '10:30:00', 'confirmed', '2025-04-15 04:14:52', 'BKG-20250415-001', 50000.00, NULL),
(147, 9, '2024-04-23', '10:00:00', '11:30:00', 'pending', '2025-04-15 05:06:07', 'BKG-20250415-002', 400000.00, NULL),
(148, 9, '2024-04-25', '10:00:00', '11:30:00', 'pending', '2025-04-15 05:11:26', 'BKG-20250415-003', 400000.00, NULL),
(149, 22, '2024-04-22', '10:00:00', '10:30:00', 'pending', '2025-04-15 05:24:24', 'BKG-20250415-004', 50000.00, NULL),
(150, 22, '2024-04-23', '10:00:00', '12:00:00', 'pending', '2025-04-15 05:25:40', 'BKG-20250415-005', 750000.00, NULL),
(151, 22, '2024-04-24', '10:00:00', '12:00:00', 'pending', '2025-04-15 05:25:51', 'BKG-20250415-006', 770000.00, NULL),
(152, 9, '2024-04-26', '10:00:00', '11:30:00', 'pending', '2025-04-15 05:27:41', 'BKG-20250415-007', 400000.00, NULL),
(153, 22, '2024-04-25', '10:00:00', '11:30:00', 'pending', '2025-04-15 05:29:49', 'BKG-20250415-008', 400000.00, NULL),
(154, 22, '2024-04-27', '10:00:00', '11:30:00', 'pending', '2025-04-15 05:29:56', 'BKG-20250415-009', 400000.00, NULL),
(155, 22, '2025-05-05', '11:00:00', '12:30:00', 'pending', '2025-04-15 05:45:22', 'BKG-20250415-010', 420000.00, NULL),
(156, 22, '2025-05-06', '12:00:00', '13:30:00', 'pending', '2025-04-15 05:49:50', 'BKG-20250415-011', 400000.00, NULL),
(157, 22, '2025-05-07', '12:00:00', '13:30:00', 'pending', '2025-04-15 05:52:22', 'BKG-20250415-012', 480000.00, NULL),
(158, 22, '2025-05-08', '13:00:00', '14:45:00', 'pending', '2025-04-15 05:54:25', 'BKG-20250415-013', 500000.00, NULL),
(159, 22, '2025-05-10', '11:00:00', '12:30:00', 'pending', '2025-04-15 06:04:26', 'BKG-20250415-014', 480000.00, NULL),
(160, 22, '2025-05-11', '11:00:00', '13:00:00', 'pending', '2025-04-15 06:09:32', 'BKG-20250415-015', 530000.00, NULL),
(161, 22, '2025-05-14', '12:00:00', '14:00:00', 'pending', '2025-04-15 06:12:02', 'BKG-20250415-016', 530000.00, NULL),
(162, 22, '2025-05-17', '11:00:00', '13:15:00', 'pending', '2025-04-15 06:16:39', 'BKG-20250415-017', 550000.00, NULL),
(163, 22, '2025-05-23', '13:00:00', '15:00:00', 'pending', '2025-04-15 06:22:52', 'BKG-20250415-018', 530000.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `booking_colors`
--

CREATE TABLE `booking_colors` (
  `booking_id` int DEFAULT NULL,
  `color_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `harga_saat_booking` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `booking_colors`
--

INSERT INTO `booking_colors` (`booking_id`, `color_id`, `brand_id`, `harga_saat_booking`) VALUES
(128, 1, 1, NULL),
(129, 1, 1, NULL),
(130, 1, 1, NULL),
(133, 1, 1, 150000.00),
(134, 1, 1, NULL),
(142, 1, 1, NULL),
(143, 1, 1, NULL),
(147, 1, 1, NULL),
(148, 1, 1, NULL),
(152, 1, 1, NULL),
(153, 1, 1, NULL),
(154, 1, 1, NULL),
(155, 7, 1, NULL),
(156, 2, 1, NULL),
(157, 19, 3, NULL),
(158, 14, 2, NULL),
(159, 14, 2, NULL),
(160, 14, 2, NULL),
(161, 14, 2, NULL),
(162, 14, 2, NULL),
(163, 14, 2, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `booking_keratin`
--

CREATE TABLE `booking_keratin` (
  `booking_id` int DEFAULT NULL,
  `keratin_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `harga_saat_booking` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_layanan`
--

CREATE TABLE `booking_layanan` (
  `id` int NOT NULL,
  `booking_id` int DEFAULT NULL,
  `layanan_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `booking_layanan`
--

INSERT INTO `booking_layanan` (`id`, `booking_id`, `layanan_id`) VALUES
(198, 127, 1),
(199, 128, 4),
(200, 128, 5),
(201, 129, 4),
(202, 129, 5),
(203, 130, 4),
(204, 130, 5),
(205, 131, 1),
(206, 131, 5),
(207, 132, 4),
(208, 133, 1),
(209, 133, 4),
(210, 134, 1),
(211, 134, 4),
(212, 135, 8),
(213, 136, 1),
(214, 137, 1),
(215, 138, 1),
(216, 139, 1),
(217, 139, 5),
(218, 140, 1),
(219, 141, 1),
(220, 142, 4),
(221, 143, 4),
(222, 144, 1),
(223, 145, 1),
(224, 146, 1),
(225, 147, 4),
(226, 148, 4),
(227, 149, 1),
(228, 150, 5),
(229, 151, 6),
(230, 152, 4),
(231, 153, 4),
(232, 154, 4),
(233, 155, 4),
(234, 156, 4),
(235, 157, 4),
(236, 158, 3),
(237, 158, 2),
(238, 159, 1),
(239, 159, 3),
(240, 160, 1),
(241, 160, 4),
(242, 161, 1),
(243, 161, 4),
(244, 162, 2),
(245, 162, 4),
(246, 163, 1),
(247, 163, 4);

-- --------------------------------------------------------

--
-- Table structure for table `booking_smoothing`
--

CREATE TABLE `booking_smoothing` (
  `booking_id` int DEFAULT NULL,
  `smoothing_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `harga_saat_booking` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hair_colors`
--

CREATE TABLE `hair_colors` (
  `id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `kategori` varchar(50) DEFAULT NULL,
  `level` varchar(20) DEFAULT NULL,
  `stok` int NOT NULL DEFAULT '0',
  `tambahan_harga` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hair_colors`
--

INSERT INTO `hair_colors` (`id`, `product_id`, `nama`, `kategori`, `level`, `stok`, `tambahan_harga`) VALUES
(1, 1, 'Dark Brown', 'Natural', '3', 10, 0.00),
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
(12, 3, 'Golden Brown', 'Warm', '4', 10, 30000.00),
(13, 3, 'Light Mahogany Brown', 'Warm', '5', 10, 30000.00),
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
  `id` int NOT NULL,
  `brand_id` int DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis` varchar(100) NOT NULL,
  `deskripsi` text,
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
  `id` int NOT NULL,
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
  `id` int NOT NULL,
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
  `id` int NOT NULL,
  `brand_id` int DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis` varchar(100) NOT NULL,
  `harga` decimal(10,2) NOT NULL,
  `stok` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `keratin_products`
--

INSERT INTO `keratin_products` (`id`, `brand_id`, `nama`, `jenis`, `harga`, `stok`) VALUES
(1, 1, 'Matrix Keratin Regular', 'Treatment', 450000.00, 7),
(2, 1, 'Matrix Keratin Premium', 'Treatment', 650000.00, 8),
(3, 2, 'Loreal Keratin Gold', 'Treatment', 850000.00, 5);

-- --------------------------------------------------------

--
-- Table structure for table `layanan`
--

CREATE TABLE `layanan` (
  `id` int NOT NULL,
  `kategori_id` int NOT NULL,
  `nama` varchar(100) NOT NULL,
  `harga` decimal(10,2) NOT NULL,
  `estimasi_waktu` int NOT NULL COMMENT 'Estimasi waktu dalam menit'
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
-- Table structure for table `product_brands`
--

CREATE TABLE `product_brands` (
  `id` int NOT NULL,
  `nama` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_brands`
--

INSERT INTO `product_brands` (`id`, `nama`) VALUES
(1, 'Matrix'),
(2, 'L\'Oreal'),
(3, 'Wella'),
(4, 'Goldwell');

-- --------------------------------------------------------

--
-- Table structure for table `smoothing_products`
--

CREATE TABLE `smoothing_products` (
  `id` int NOT NULL,
  `brand_id` int DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis` varchar(100) NOT NULL,
  `harga` decimal(10,2) NOT NULL,
  `stok` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `smoothing_products`
--

INSERT INTO `smoothing_products` (`id`, `brand_id`, `nama`, `jenis`, `harga`, `stok`) VALUES
(1, 1, 'Matrix Opti Normal', 'Cream Smoothing', 500000.00, 6),
(2, 1, 'Matrix Opti Resistant', 'Cream Smoothing', 600000.00, 8),
(3, 2, 'Loreal X-Tenso Normal', 'Cream Smoothing', 700000.00, 5);

-- --------------------------------------------------------

--
-- Table structure for table `testimoni`
--

CREATE TABLE `testimoni` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `layanan_id` int NOT NULL,
  `booking_id` int NOT NULL,
  `rating` int DEFAULT NULL,
  `comment` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected') DEFAULT 'pending'
) ;

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `id` int NOT NULL,
  `booking_id` int NOT NULL,
  `user_id` int NOT NULL,
  `kategori_transaksi_id` int NOT NULL,
  `total_harga` decimal(10,2) NOT NULL,
  `status` enum('Pending','Completed') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `midtrans_order_id` varchar(50) DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL,
  `dp_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('Unpaid','DP','Paid') NOT NULL DEFAULT 'Unpaid',
  `pelunasan_order_id` varchar(255) DEFAULT NULL,
  `booking_number` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transaksi`
--

INSERT INTO `transaksi` (`id`, `booking_id`, `user_id`, `kategori_transaksi_id`, `total_harga`, `status`, `created_at`, `updated_at`, `midtrans_order_id`, `paid_amount`, `dp_amount`, `payment_status`, `pelunasan_order_id`, `booking_number`) VALUES
(77, 127, 9, 2, 50000.00, 'Pending', '2025-04-12 16:49:48', '2025-04-12 16:49:48', 'BKG-20250412-127-mclks', 0.00, 0.00, 'Unpaid', NULL, 'BKG-20250412-127-mclks'),
(78, 128, 9, 1, 1150000.00, 'Pending', '2025-04-12 16:59:18', '2025-04-12 16:59:18', 'BKG-20250412-128-kjbtz', 0.00, 0.00, 'Unpaid', NULL, 'BKG-20250412-128-kjbtz'),
(79, 129, 9, 1, 1600000.00, 'Pending', '2025-04-12 17:03:51', '2025-04-12 17:03:51', 'BKG-20250412-129-esxxp', 0.00, 0.00, 'Unpaid', NULL, 'BKG-20250412-129-esxxp'),
(80, 130, 9, 1, 1600000.00, 'Pending', '2025-04-12 17:09:52', '2025-04-12 17:09:52', 'BKG-20250412-130-q2elq', 0.00, 480000.00, 'Unpaid', NULL, 'BKG-20250412-130-q2elq'),
(81, 144, 22, 2, 50000.00, 'Completed', '2025-04-14 13:33:32', '2025-04-14 13:34:35', 'BKG-20250414-144-3pena', 50000.00, 15000.00, 'Paid', NULL, 'BKG-20250414-144-3pena'),
(82, 145, 22, 2, 50000.00, 'Completed', '2025-04-14 14:19:29', '2025-04-14 14:20:04', 'BKG-20250414-145-oo4qs', 50000.00, 15000.00, 'Paid', NULL, 'BKG-20250414-145-oo4qs'),
(83, 146, 22, 2, 50000.00, 'Completed', '2025-04-15 04:14:53', '2025-04-15 04:20:59', 'BKG-20250415-146-95saj', 50000.00, 15000.00, 'Paid', NULL, 'BKG-20250415-146-95saj'),
(84, 155, 22, 2, 420000.00, 'Pending', '2025-04-15 05:45:23', '2025-04-15 05:45:23', 'BKG-20250415-155-nluio', 0.00, 126000.00, 'Unpaid', NULL, 'BKG-20250415-155-nluio'),
(85, 156, 22, 2, 400000.00, 'Pending', '2025-04-15 05:49:50', '2025-04-15 05:49:50', 'BKG-20250415-156-8s379', 0.00, 120000.00, 'Unpaid', NULL, 'BKG-20250415-156-8s379'),
(86, 157, 22, 2, 480000.00, 'Pending', '2025-04-15 05:52:23', '2025-04-15 05:52:23', 'BKG-20250415-157-vmsri', 0.00, 144000.00, 'Unpaid', NULL, 'BKG-20250415-157-vmsri'),
(87, 158, 22, 2, 500000.00, 'Pending', '2025-04-15 05:54:26', '2025-04-15 05:54:26', 'BKG-20250415-158-cf38f', 0.00, 150000.00, 'Unpaid', NULL, 'BKG-20250415-158-cf38f'),
(88, 159, 22, 2, 480000.00, 'Pending', '2025-04-15 06:04:27', '2025-04-15 06:04:27', 'BKG-20250415-159-9o8yf', 0.00, 144000.00, 'Unpaid', NULL, 'BKG-20250415-159-9o8yf'),
(89, 160, 22, 2, 530000.00, 'Pending', '2025-04-15 06:09:33', '2025-04-15 06:09:33', 'BKG-20250415-160-fx6h4', 0.00, 159000.00, 'Unpaid', NULL, 'BKG-20250415-160-fx6h4'),
(90, 161, 22, 2, 530000.00, 'Pending', '2025-04-15 06:12:03', '2025-04-15 06:12:03', 'BKG-20250415-161-2sr5p', 0.00, 159000.00, 'Unpaid', NULL, 'BKG-20250415-161-2sr5p'),
(91, 162, 22, 2, 550000.00, 'Pending', '2025-04-15 06:16:40', '2025-04-15 06:16:40', 'BKG-20250415-162-y4378', 0.00, 165000.00, 'Unpaid', NULL, 'BKG-20250415-162-y4378'),
(92, 163, 22, 2, 530000.00, 'Pending', '2025-04-15 06:22:52', '2025-04-15 06:22:52', 'BKG-20250415-163-llrnd', 0.00, 159000.00, 'Unpaid', NULL, 'BKG-20250415-163-llrnd');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` enum('admin','pelanggan') NOT NULL DEFAULT 'pelanggan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fullname`, `email`, `phone_number`, `username`, `password`, `address`, `created_at`, `role`) VALUES
(7, 'admin 1', 'admin123@gmail.com', '0812344231', 'admin123', '$2b$10$bQWqaXJhZPICZScj5bG5e.6a0MlwWU1ydBybcqbJKFGEXHqSmTd9a', 'Jl. Taman Giri', '2025-02-27 14:07:44', 'admin'),
(8, 'ayu sri', 'ayu123@gmail.com', '08123445312', 'ayu123', '$2b$10$j4rI18zx5BPt.vpR6YCFtOeMHzzZBDbpaqXXjZ0qNXMKLH2FHBlLS', 'Jl. Taman apa kaden', '2025-02-27 14:09:09', 'pelanggan'),
(9, 'budi', 'budi@gmail.com', '0897723633', 'duar', '$2b$10$JprGFCOW0faZiGv.kR0tF.xx0MeTDE8qMBiy/k81HSMOoYGF4Mcju', 'poltek', '2025-03-06 15:09:55', 'pelanggan'),
(10, 'John Doe', 'johndoe@example.com', '6289675694072', 'johndoe', '$2b$10$uTUfReJq.zSmqt/24A/umuuSl4LncqSlctv9HHDRXcJn73Ux26OOC', 'Jalan Raya No. 123', '2025-03-08 21:49:24', 'pelanggan'),
(14, 'henrycool', 'henry@example.com', '6281234567890', 'yahaha', '$2b$10$xXATzVqadKurkYwACCfS.ui3iX1wFxlB/q5GtE8V1xc3ifvavn9ZS', 'Jl. Mawar No.10', '2025-03-11 14:15:20', 'pelanggan'),
(18, 'yuki', 'yuki@gmail.com', '0893639362', 'yuki', '$2b$10$RAUJpeiP4gkCEyYYWupoPOXlltwi5qeodHp7T/2PhtlRvDlH6u7Cu', 'denpasar', '2025-03-11 14:19:45', 'pelanggan'),
(19, 'jumping', 'jumping@gmail.com', '0897353832', 'jumping', '$2b$10$oyAHnkuH0abjx6ZhlJOT3.5ADn.9VAjAJuROPHV.zsCERQsfJpgZe', 'denpasar', '2025-03-11 14:25:22', 'pelanggan'),
(20, 'caca kocak', 'caca@gmail.com', '08973538362', 'caca', '$2b$10$IepCSVopNYUmM3QkJ7cE1.PddT4cprdPfIWmqDSZQsx2nhlKGzJwq', 'bukit', '2025-03-11 14:29:14', 'pelanggan'),
(21, 'mikihaha', 'mikiyjw@gmail.com', '081234567890', 'mikiblok', '$2b$10$3E6zJxNhmcpm0JGLFAzAaepVQLWqdCMhgAfBN6T8KmMDH2q88dVD6', 'Jl. Mawar No. 10', '2025-03-21 15:20:13', 'pelanggan'),
(22, 'dwinata wiguna', 'mikiykiddy@gmail.com', '9728373262', 'dwinata', '$2b$10$nyNX8qbOwxPY1pYsCA/P1uyIASMApD8W5swtSlsoVbbkWJN9ABDaK', 'apas', '2025-04-08 19:08:29', 'pelanggan');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

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
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `layanan_id` (`layanan_id`);

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
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `hair_products`
--
ALTER TABLE `hair_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `brand_id` (`brand_id`);

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
  ADD KEY `brand_id` (`brand_id`);

--
-- Indexes for table `layanan`
--
ALTER TABLE `layanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kategori_id` (`kategori_id`);

--
-- Indexes for table `product_brands`
--
ALTER TABLE `product_brands`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `smoothing_products`
--
ALTER TABLE `smoothing_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `brand_id` (`brand_id`);

--
-- Indexes for table `testimoni`
--
ALTER TABLE `testimoni`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `layanan_id` (`layanan_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `midtrans_order_id` (`midtrans_order_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `kategori_transaksi_id` (`kategori_transaksi_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `booking`
--
ALTER TABLE `booking`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=164;

--
-- AUTO_INCREMENT for table `booking_layanan`
--
ALTER TABLE `booking_layanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=248;

--
-- AUTO_INCREMENT for table `hair_colors`
--
ALTER TABLE `hair_colors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `hair_products`
--
ALTER TABLE `hair_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `kategori_layanan`
--
ALTER TABLE `kategori_layanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `kategori_transaksi`
--
ALTER TABLE `kategori_transaksi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `keratin_products`
--
ALTER TABLE `keratin_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `layanan`
--
ALTER TABLE `layanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `product_brands`
--
ALTER TABLE `product_brands`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `smoothing_products`
--
ALTER TABLE `smoothing_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `testimoni`
--
ALTER TABLE `testimoni`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_colors`
--
ALTER TABLE `booking_colors`
  ADD CONSTRAINT `booking_colors_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`),
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
-- Constraints for table `smoothing_products`
--
ALTER TABLE `smoothing_products`
  ADD CONSTRAINT `smoothing_products_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`);

--
-- Constraints for table `testimoni`
--
ALTER TABLE `testimoni`
  ADD CONSTRAINT `testimoni_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `testimoni_ibfk_2` FOREIGN KEY (`layanan_id`) REFERENCES `layanan` (`id`),
  ADD CONSTRAINT `testimoni_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`);

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaksi_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaksi_ibfk_3` FOREIGN KEY (`kategori_transaksi_id`) REFERENCES `kategori_transaksi` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

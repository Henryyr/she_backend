-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 17, 2025 at 05:49 AM
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
  `total_harga` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`id`, `user_id`, `tanggal`, `jam_mulai`, `jam_selesai`, `status`, `created_at`, `booking_number`, `total_harga`) VALUES
(8, 7, '2025-03-01', '12:00:00', '12:45:00', 'confirmed', '2025-03-01 17:09:29', 'BKG-20250301-003', 70000.00),
(9, 7, '2025-03-01', '12:00:00', '12:45:00', 'confirmed', '2025-03-03 13:42:25', 'BKG-20250303-001', 70000.00),
(10, 7, '2025-03-01', '12:00:00', '14:00:00', 'pending', '2025-03-03 14:01:59', 'BKG-20250303-002', 250000.00),
(11, 7, '2025-03-01', '12:00:00', '12:45:00', 'confirmed', '2025-03-03 14:31:39', 'BKG-20250303-003', 70000.00),
(12, 10, '2025-03-10', '14:00:00', '14:45:00', 'pending', '2025-03-08 21:54:14', 'BKG-20250308-001', 70000.00),
(13, 10, '2025-03-10', '14:00:00', '15:00:00', 'pending', '2025-03-08 21:59:50', 'BKG-20250308-002', 150000.00),
(14, 10, '2025-03-10', '15:00:00', '16:00:00', 'confirmed', '2025-03-08 22:03:38', 'BKG-20250308-003', 150000.00),
(15, 10, '2025-03-10', '15:00:00', '16:00:00', 'pending', '2025-03-08 22:07:14', 'BKG-20250308-004', 150000.00),
(16, 10, '2025-03-10', '16:00:00', '17:00:00', 'pending', '2025-03-08 22:11:13', 'BKG-20250308-005', 150000.00),
(17, 10, '2025-03-10', '16:00:00', '17:00:00', 'pending', '2025-03-08 22:13:00', 'BKG-20250308-006', 150000.00),
(18, 10, '2025-03-10', '16:00:00', '17:30:00', 'pending', '2025-03-08 22:17:42', 'BKG-20250308-007', 200000.00),
(19, 9, '2025-03-20', '14:00:00', '15:00:00', 'pending', '2025-03-14 16:56:25', 'BKG-20250314-001', 150000.00),
(20, 9, '2025-03-20', '14:00:00', '16:00:00', 'confirmed', '2025-03-14 17:17:20', 'BKG-20250314-002', 250000.00),
(21, 9, '2025-03-15', '10:00:00', '11:30:00', 'pending', '2025-03-15 09:27:30', 'BKG-20250315-001', 200000.00),
(22, 9, '2025-03-15', '10:00:00', '11:30:00', 'pending', '2025-03-15 09:30:15', 'BKG-20250315-002', 200000.00),
(23, 9, '2025-03-15', '10:00:00', '13:30:00', 'pending', '2025-03-15 09:30:26', 'BKG-20250315-003', 450000.00),
(24, 9, '2025-03-15', '10:00:00', '13:30:00', 'pending', '2025-03-15 09:30:34', 'BKG-20250315-004', 450000.00),
(25, 9, '2025-03-15', '10:00:00', '12:30:00', 'pending', '2025-03-15 09:30:52', 'BKG-20250315-005', 300000.00),
(26, 9, '2025-03-15', '10:00:00', '12:30:00', 'pending', '2025-03-15 09:31:05', 'BKG-20250315-006', 300000.00),
(27, 9, '2025-03-16', '10:00:00', '11:15:00', 'pending', '2025-03-15 10:05:14', 'BKG-20250315-007', 120000.00),
(28, 9, '2025-03-17', '11:00:00', '12:15:00', 'pending', '2025-03-15 10:06:35', 'BKG-20250315-008', 120000.00);

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
(1, 21, 1),
(2, 21, 3),
(3, 22, 1),
(4, 22, 3),
(5, 23, 1),
(6, 23, 3),
(7, 23, 5),
(8, 24, 1),
(9, 24, 3),
(10, 24, 5),
(11, 25, 1),
(12, 25, 5),
(13, 26, 1),
(14, 26, 5),
(15, 27, 1),
(16, 27, 2),
(17, 28, 1),
(18, 28, 2);

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
-- Table structure for table `testimoni`
--

CREATE TABLE `testimoni` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int DEFAULT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
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
  `status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `midtrans_order_id` varchar(50) DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transaksi`
--

INSERT INTO `transaksi` (`id`, `booking_id`, `user_id`, `kategori_transaksi_id`, `total_harga`, `status`, `created_at`, `updated_at`, `midtrans_order_id`, `paid_amount`) VALUES
(14, 13, 9, 2, 150000.00, 'pending', '2025-03-15 08:52:04', '2025-03-15 08:52:04', 'fee8bfff-1c4b-47e8-9cf7-e4519573ea48', 0.00),
(15, 19, 9, 2, 150000.00, 'pending', '2025-03-15 08:58:47', '2025-03-15 08:58:47', 'faa93b8f-bbfc-4874-a7f6-77640b6ca5a3', 0.00),
(16, 19, 9, 2, 150000.00, 'pending', '2025-03-15 09:09:58', '2025-03-15 09:09:58', '61193dfb-1ce8-468d-a6ea-89f66eea6bc4', 0.00),
(17, 26, 9, 2, 300000.00, 'pending', '2025-03-15 09:40:01', '2025-03-15 09:40:01', '453d9bc6-ae6d-493a-9f82-e089323f8fab', 0.00);

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
(20, 'caca kocak', 'caca@gmail.com', '08973538362', 'caca', '$2b$10$IepCSVopNYUmM3QkJ7cE1.PddT4cprdPfIWmqDSZQsx2nhlKGzJwq', 'bukit', '2025-03-11 14:29:14', 'pelanggan');

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
-- Indexes for table `booking_layanan`
--
ALTER TABLE `booking_layanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `layanan_id` (`layanan_id`);

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
-- Indexes for table `layanan`
--
ALTER TABLE `layanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kategori_id` (`kategori_id`);

--
-- Indexes for table `testimoni`
--
ALTER TABLE `testimoni`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `booking_layanan`
--
ALTER TABLE `booking_layanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

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
-- AUTO_INCREMENT for table `layanan`
--
ALTER TABLE `layanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `testimoni`
--
ALTER TABLE `testimoni`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_layanan`
--
ALTER TABLE `booking_layanan`
  ADD CONSTRAINT `booking_layanan_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_layanan_ibfk_2` FOREIGN KEY (`layanan_id`) REFERENCES `layanan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `layanan`
--
ALTER TABLE `layanan`
  ADD CONSTRAINT `layanan_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_layanan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `testimoni`
--
ALTER TABLE `testimoni`
  ADD CONSTRAINT `testimoni_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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

-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jan 31, 2026 at 09:38 AM
-- Server version: 12.1.2-MariaDB
-- PHP Version: 8.5.2
 
SET FOREIGN_KEY_CHECKS = 0;


SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";




/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `prospine`
--

-- --------------------------------------------------------

--
-- Table structure for table `api_tokens`
--

CREATE TABLE `api_tokens` (
  `token_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `is_revoked` tinyint(1) DEFAULT 0,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ;

--
-- Dumping data for table `api_tokens`
--

INSERT INTO `api_tokens` (`token_id`, `employee_id`, `token`, `created_at`, `expires_at`, `last_used_at`, `is_revoked`, `user_agent`, `ip_address`) VALUES
(3, 2, 'eb45b6b94d33506f6ac6c846c165d0ec47d05df39839ae57c84fadc9f26821c8', '2025-12-28 16:22:28', '2025-12-29 16:22:28', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(4, 2, '70e18b1fd260b3244c5a7ab784148f84d93af9db27144f5722e3822a60281e95', '2025-12-28 17:29:49', '2025-12-29 17:29:49', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(5, 2, 'afe3f91e2c0d731cad99a71610dbb3a13f43c80cd0d3719403351dc65345c7b3', '2025-12-29 11:54:56', '2025-12-30 11:54:56', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(6, 2, 'd1c378b93f48fb8963ee15df4f975c6483d943a80725e7b9fba9d64443b82040', '2025-12-29 13:07:42', '2025-12-30 13:07:42', NULL, 0, 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36', '127.0.0.1'),
(7, 2, 'f9695cc895a3cdec4ef24c28356974d85e8fcfe63c9a84505c9d0049411a0a69', '2025-12-30 19:40:17', '2025-12-31 19:40:17', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(8, 2, '1cee7b2630898fd5eb3ad4cc26051240f5ac2ff6d0f27f4ce870a4a33875ada0', '2026-01-01 19:12:17', '2026-01-02 19:12:17', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(9, 2, '6d9caace4d2865039da31209aa6d10e93dc85bb5ea9cb88d937ea44ecdeeb395', '2026-01-02 09:43:31', '2026-01-03 09:43:31', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(10, 2, '05fdc0ba1fc3a6cff7d6b46e62c97bb57bdb92c7795624e8e6a1b0e047a923df', '2026-01-02 10:44:34', '2026-01-03 10:44:34', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(11, 2, '5abf2f17d94823b9bc98e0a4fc5405fa06fc38886a0606e9f75adb861f760879', '2026-01-05 11:39:52', '2026-01-06 11:39:52', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(12, 2, '6aadf34989991d2b7a35b77f673c65ec7d82a96b78d73b4ec181381a9acadddc', '2026-01-06 18:34:14', '2026-01-07 18:34:14', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(13, 14, '9ad1ea32acf270c557bdf134517c1ccb29e4356778c41ea7ae054bb240d4169c', '2026-01-06 20:50:46', '2026-01-07 20:50:46', '2026-01-06 20:52:29', 0, 'curl/8.17.0', '::1'),
(14, 14, 'b5d7a6a91931d6df923e454bc0ee2108889b4b244f9bae6ea709843da0c5d597', '2026-01-06 20:56:45', '2026-01-07 20:56:45', '2026-01-06 20:58:02', 0, 'curl/8.17.0', '::1'),
(15, 14, '4e513761b549430e47813dc90052e086b235e744161ed784554bebe73e4c373a', '2026-01-06 21:11:20', '2026-01-07 21:11:20', '2026-01-06 21:11:25', 0, 'curl/8.17.0', '::1'),
(16, 14, '5feeafd2f070cbf9e2d33fcd318a7bd164cc1770be1232d68a1dbcc6d7e5890e', '2026-01-06 21:15:48', '2026-01-07 21:15:48', '2026-01-06 21:15:53', 0, 'curl/8.17.0', '::1'),
(17, 2, '026dd16e1c6a9089ea29ab44e07f26c490c7794ff7d7672f7d27b69e8b2d7125', '2026-01-06 22:00:52', '2026-01-07 22:00:52', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(18, 2, '0bfa14704a2fb1cdaad4bf5e1d01a9eb3cbf982e48ab225442678da49b340ceb', '2026-01-06 22:55:14', '2026-01-07 22:55:14', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(19, 2, '78e318035d3c2452ea6a16b2f8f5460d1396602b40597fc43b7df58e49875d92', '2026-01-06 22:55:43', '2026-01-07 22:55:43', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(20, 2, 'b426ac7c487f92823035ac056f62538ba8494d12e382e4beb43bc6010728a2db', '2026-01-07 00:49:04', '2026-01-08 00:49:04', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(21, 2, '193b87b5f99bb0a85785691977ac7c46bf9c139d0c9e932b397f59ca8353723f', '2026-01-07 02:57:23', '2026-01-08 02:57:23', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(22, 2, '318f1286f382f7b510b6a10b96acaecaa7a31cc2169a4b0c788350dfdc283191', '2026-01-07 03:13:53', '2026-01-08 03:13:53', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(23, 2, '991fd792d983bfaad757b242f5d919dc94958f9f639270263eaa637a09c4736d', '2026-01-08 16:26:59', '2026-01-09 16:26:59', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(24, 2, '13315de2600c822f102b94d292a03ea030664c2017c8ff723f812689d376111f', '2026-01-12 13:04:50', '2026-01-13 13:04:50', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(25, 2, '80e73b8b8fa8ee53beabd4773697badb1ce4b8d16f67b4fa3919f48226288d2d', '2026-01-16 13:53:58', '2026-01-17 13:53:58', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(26, 2, 'b41cdb1b1beb8353f743c154b94cfd638f87fdb0b16d4b37fc2fa960c2ca526f', '2026-01-22 21:38:32', '2026-01-23 21:38:32', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(27, 1, '1b67a70f3b34027fb5d757bc0fdfe1da08b06de659b53c08db2a274742c78a08', '2026-01-23 02:42:48', '2026-01-24 02:42:48', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(28, 1, '5b938b23e98b2bae8cd1b54f52f2a2b6f7e790f6e39442c54d7765bf1ccc1cbe', '2026-01-23 02:57:50', '2026-01-24 02:57:50', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(29, 2, '69dc2975b76af81edc73ad6d0e1e367d0c1de2879205b8e5430040538d90200f', '2026-01-23 03:05:46', '2026-01-24 03:05:46', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(30, 2, '16518bdb065bfa26d10aa4930f725bf834783d7cda5dc1aef8ac203074ebad28', '2026-01-23 04:16:51', '2026-01-24 04:16:51', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(31, 2, 'fb7a767e7ecfd6128ff2b83c79f029cee85493d5a6abc4f3ef57a0181e05e523', '2026-01-23 19:58:46', '2026-01-24 19:58:46', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(32, 1, '36e7f40a20582ea527597683bde9381659dc86a9829e7b190f91fdf25172fa5e', '2026-01-23 20:01:31', '2026-01-24 20:01:31', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1'),
(33, 2, 'c2962a98f9b60de937f0439829c17e32c2d2296d18c31cc72771331172fa16c5', '2026-01-24 18:56:16', '2026-01-25 18:56:16', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(34, 2, '06679e7ab32e61f00dd2f6c559eb54caee1be1731a085d1ad7e92ed05422ffa5', '2026-01-24 19:06:11', '2026-01-25 19:06:11', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(35, 2, 'a62c1869695c446a97634b35dd9e677a79c1fa354f8a5fa44914ef3646b0eb7f', '2026-01-26 13:33:40', '2026-01-27 13:33:40', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0', '127.0.0.1'),
(36, 2, '917a4298b7edcc35321ef566df22c7a2eae4daa1740e40973bd83d2ae2b218b5', '2026-01-27 08:25:09', '2026-01-28 08:25:09', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(37, 1, '53703078d2ebdf12bf439c2daace598fb002fcbcd522166968c8ec69a92fe591', '2026-01-27 10:42:56', '2026-01-28 10:42:56', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(38, 2, 'fa90d7f029f45a4a178b09a0d9a3f3e463dee9e95f3a314112000753c72cb5dc', '2026-01-27 10:45:37', '2026-01-28 10:45:37', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(39, 1, '7a623407e0917516baa4d5e5fe14b249290128f391424f70895c2d860c4019f1', '2026-01-27 17:50:31', '2026-01-28 17:50:31', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(40, 2, 'bd2809148ef534fbddebc102a2dab1410b288d87090f4cef6cfe4bb8393d7fd4', '2026-01-28 07:13:32', '2026-01-29 07:13:32', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(41, 2, '6c4d9ae32edb2dacfe6fb17429178941f1f1e83efadf87a7592a912af45a28f8', '2026-01-28 07:14:22', '2026-01-29 07:14:22', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(42, 2, 'd5dedb6edc2d2d390afe559e889a4edc52a820c30729bacf75782b5892c9e43d', '2026-01-28 07:15:11', '2026-01-29 07:15:11', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(43, 2, '4cdad7cd0bb8830da2697c4682531a036222486da224e816acb949ac5da9f909', '2026-01-28 08:38:45', '2026-01-29 08:38:45', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(44, 2, '614424e2fee99499cadf4a96b8b0ba3cfc66f49f9d83e92e5a83f755373697d6', '2026-01-28 10:40:10', '2026-01-29 10:40:10', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(45, 1, '80446230d55c4e4639b97a1c55d70f864b89067fe184e6d62a9e26f3c21c3da7', '2026-01-28 11:07:02', '2026-01-29 11:07:02', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(46, 2, '1e570d1c5fe69ded2548c4819ca9f21fd6246ffe1be583c1c8544649074c7ef5', '2026-01-28 11:08:04', '2026-01-29 11:08:04', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '127.0.0.1'),
(47, 2, 'f5a402d889aea1d9e513e30d22bd6ddfc0915f37446a291a7528e7c82040242f', '2026-01-30 06:18:43', '2026-01-31 00:48:43', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(48, 2, 'b7c857d94ac8d8bbef53d44520dc850b5492dac001131f20faf1d83a65f8054f', '2026-01-30 06:18:58', '2026-01-31 00:48:58', '2026-01-30 08:00:01', 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(49, 2, 'c3f911c23670bac14e9628d557b5a593ff44dde2c0f9663e786ef52ff8764d74', '2026-01-30 06:52:44', '2026-01-31 01:22:44', '2026-01-30 10:42:58', 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(50, 1, 'e2d9f7c8ca61183352f9cfff758f7a906fd6215e7dba7ba751666073255c288a', '2026-01-30 08:00:08', '2026-01-31 02:30:08', '2026-01-30 09:54:03', 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(51, 2, '5fe85a1da77130aa4bb6d115f72dcc852a68e8010b08ca7487cb0973cdfce005', '2026-01-30 10:43:13', '2026-01-31 05:13:13', '2026-01-30 12:35:39', 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(52, 2, '08c5f4357f8bf8f5f2e63ee713820ab2c40bc0f5ea1fe929504232308907e83d', '2026-01-30 12:41:44', '2026-01-31 07:11:44', '2026-01-30 12:51:56', 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(53, 2, '5e57f55c0150952cc22399b061defda39c21670d47b4465f4ee7b1b214c6e91b', '2026-01-30 14:12:46', '2026-01-31 08:42:46', '2026-01-30 16:29:53', 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(54, 2, 'b8871a86705287f84bb8629627be2b0d2cc05c423ea71c5cc9b2602221d1b6ab', '2026-01-31 04:24:31', '2026-01-31 22:54:31', '2026-01-31 08:26:38', 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(55, 1, 'e1514de6d29af379997558fd9f88c59e1cd7cb0cfd323efb1558d1b3328e22d0', '2026-01-31 06:30:07', '2026-02-01 01:00:07', NULL, 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1'),
(56, 2, '8bc0bfc20ac94aa700ee20f76ee82aeb5d3d1e983fffa563db5b45eff2c1b20f', '2026-01-31 08:35:58', '2026-02-01 03:05:58', '2026-01-31 09:09:15', 0, 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', '::ffff:127.0.0.1');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `branch_id` int(11) NOT NULL DEFAULT 1,
  `consultationType` enum('virtual','clinic','home') NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `age` varchar(50) DEFAULT NULL,
  `occupation` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `medical_condition` text DEFAULT NULL,
  `conditionType` enum('neck_pain','back_pain','low_back_pain','radiating_pain','other') DEFAULT 'other',
  `referralSource` enum('doctor_referral','web_search','social_media','returning_patient','local_event','advertisement','employee','family','self','other') DEFAULT 'self',
  `contactMethod` enum('Phone','Email','Text') DEFAULT 'Phone',
  `location` enum('bhagalpur_branch','siliguri_branch') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `payment_amount` decimal(10,2) DEFAULT NULL,
  `payment_method` enum('cash','card','upi','online') DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_requests`
--

CREATE TABLE `appointment_requests` (
  `id` int(11) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `location` enum('bhagalpur_branch','siliguri_branch') NOT NULL,
  `branch_id` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `status` enum('new','contacted','converted','discarded') DEFAULT 'new'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `marked_by_employee_id` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `remarks` text DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('present','pending','rejected') DEFAULT 'present',
  `approval_request_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `patient_id`, `marked_by_employee_id`, `attendance_date`, `remarks`, `payment_id`, `created_at`, `status`, `approval_request_at`, `approved_at`, `approved_by`) VALUES
(1, 4, 2, '2025-12-02', 'Auto: Used advance payment', NULL, '2025-12-02 12:25:29', 'present', NULL, NULL, NULL),
(2, 5, 2, '2025-12-02', 'Auto: Used advance payment', NULL, '2025-12-02 12:25:34', 'present', NULL, NULL, NULL),
(3, 6, 2, '2025-12-02', 'Auto: Daily attendance', 8, '2025-12-02 12:25:45', 'present', NULL, NULL, NULL),
(4, 7, 2, '2025-12-02', 'Auto: Used advance payment', NULL, '2025-12-02 12:25:49', 'present', NULL, NULL, NULL),
(5, 1, 2, '2025-12-02', 'Auto: Used advance payment', NULL, '2025-12-02 12:25:53', 'present', NULL, NULL, NULL),
(6, 2, 2, '2025-12-02', 'Auto: Used advance payment', NULL, '2025-12-02 12:25:54', 'present', NULL, NULL, NULL),
(7, 3, 2, '2025-12-02', 'Auto: Used advance payment', NULL, '2025-12-02 12:25:57', 'present', NULL, NULL, NULL),
(8, 8, 2, '2025-12-02', 'Auto: Daily attendance', 10, '2025-12-02 12:29:05', 'present', NULL, NULL, NULL),
(9, 6, 2, '2025-12-03', 'Auto: Used advance payment', NULL, '2025-12-03 15:32:13', 'present', NULL, NULL, NULL),
(10, 9, 2, '2025-12-06', 'Auto: Used advance payment', NULL, '2025-12-06 10:07:15', 'present', NULL, NULL, NULL),
(11, 6, 2, '2025-12-06', 'Auto: Used advance payment', NULL, '2025-12-06 11:17:55', 'present', NULL, NULL, NULL),
(12, 10, 2, '2025-12-07', 'Auto: Used advance payment', NULL, '2025-12-06 19:47:42', 'present', NULL, NULL, NULL),
(13, 10, 2, '2025-12-10', 'Auto: Used advance payment', NULL, '2025-12-10 11:36:59', 'present', NULL, NULL, NULL),
(14, 1, 2, '2025-12-10', 'Marked as Due - Patient will pay later', NULL, '2025-12-10 12:45:12', 'present', NULL, NULL, NULL),
(18, 8, 2, '2025-12-10', 'Marked as Due - Patient will pay later', NULL, '2025-12-10 15:46:27', 'present', NULL, NULL, NULL),
(19, 9, 2, '2025-12-10', 'Auto: Used advance payment', NULL, '2025-12-10 15:46:33', 'present', NULL, NULL, NULL),
(20, 12, 2, '2025-12-10', 'Auto: Used advance payment', NULL, '2025-12-10 17:35:04', 'present', NULL, NULL, NULL),
(21, 10, 2, '2025-12-11', 'Auto: Used advance payment', NULL, '2025-12-10 19:16:04', 'present', NULL, NULL, NULL),
(22, 7, 2, '2025-12-11', 'Marked as Due - Patient will pay later', NULL, '2025-12-10 19:17:22', 'present', NULL, NULL, NULL),
(23, 13, 2, '2025-12-11', 'Auto: Used advance payment', NULL, '2025-12-10 19:24:37', 'present', NULL, NULL, NULL),
(24, 9, 2, '2025-12-11', 'Auto: Used advance payment', NULL, '2025-12-10 19:25:17', 'present', NULL, NULL, NULL),
(25, 8, 2, '2025-12-11', 'Marked as Due - Patient will pay later', NULL, '2025-12-10 19:26:13', 'present', NULL, NULL, NULL),
(26, 12, 2, '2025-12-13', 'Auto: Used advance payment', NULL, '2025-12-12 20:30:56', 'present', NULL, NULL, NULL),
(27, 14, 2, '2025-12-15', 'Marked as Due - Patient will pay later', NULL, '2025-12-15 09:14:33', 'present', NULL, NULL, NULL),
(28, 13, 2, '2025-12-15', 'Auto: Daily attendance', 17, '2025-12-15 09:14:47', 'present', NULL, NULL, NULL),
(29, 15, 2, '2025-12-16', 'Marked as Due - Patient will pay later', NULL, '2025-12-15 19:17:20', 'present', NULL, NULL, NULL),
(30, 15, 2, '2025-12-17', 'Auto: Used advance payment', NULL, '2025-12-16 20:28:24', 'present', NULL, NULL, NULL),
(47, 14, 2, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 21:20:01', 'present', '2025-12-16 21:20:01', '2025-12-16 21:33:47', 1),
(48, 13, 2, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 21:20:24', 'rejected', '2025-12-16 21:20:24', NULL, NULL),
(49, 12, 1, '2025-12-17', 'Auto: Used advance payment', NULL, '2025-12-16 21:23:39', 'present', NULL, NULL, NULL),
(50, 11, 1, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 21:23:44', 'present', '2025-12-16 21:23:44', '2025-12-16 21:25:29', 1),
(51, 8, 1, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 21:34:29', 'rejected', '2025-12-16 21:34:29', NULL, NULL),
(52, 3, 1, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 21:44:13', 'rejected', '2025-12-16 21:44:13', NULL, NULL),
(53, 2, 1, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 21:49:18', 'present', '2025-12-16 21:49:18', '2025-12-16 21:55:08', 1),
(54, 3, 1, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 21:56:15', 'present', '2025-12-16 21:56:15', '2025-12-16 21:56:58', 1),
(55, 10, 1, '2025-12-17', 'Auto: Used advance payment', NULL, '2025-12-16 22:06:36', 'present', NULL, NULL, NULL),
(56, 9, 1, '2025-12-17', 'Auto: Used advance payment', NULL, '2025-12-16 22:06:37', 'present', NULL, NULL, NULL),
(57, 6, 1, '2025-12-17', 'Auto: Used advance payment', NULL, '2025-12-16 22:13:59', 'present', NULL, NULL, NULL),
(58, 8, 1, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 22:20:43', 'present', '2025-12-16 22:20:43', '2025-12-16 22:21:03', 1),
(59, 7, 1, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 22:25:20', 'present', '2025-12-16 22:25:20', '2025-12-16 22:35:27', 1),
(60, 5, 1, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 22:26:11', 'present', '2025-12-16 22:26:11', '2025-12-16 22:32:34', 1),
(61, 13, 2, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 22:38:04', 'present', '2025-12-16 22:38:04', '2025-12-16 22:43:38', 1),
(62, 4, 2, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 22:38:11', 'rejected', '2025-12-16 22:38:11', NULL, NULL),
(63, 1, 2, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-16 22:38:19', 'present', '2025-12-16 22:38:19', '2025-12-16 22:41:37', 1),
(64, 16, 2, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-17 09:07:08', 'present', '2025-12-17 09:07:08', '2025-12-17 09:07:26', 1),
(65, 4, 2, '2025-12-17', 'Marked as Due - Patient will pay later', NULL, '2025-12-17 15:43:29', 'present', '2025-12-17 15:43:29', '2025-12-17 15:44:21', 1),
(66, 16, 2, '2025-12-18', 'Marked as Due - Patient will pay later', NULL, '2025-12-18 18:03:15', 'present', '2025-12-18 18:03:15', '2025-12-18 18:04:35', 1),
(67, 15, 2, '2025-12-19', 'Auto: Used advance payment', NULL, '2025-12-18 18:52:48', 'present', NULL, NULL, NULL),
(68, 14, 2, '2025-12-19', 'Marked as Due - Patient will pay later', NULL, '2025-12-18 18:52:54', 'rejected', '2025-12-18 18:52:54', NULL, NULL),
(69, 13, 2, '2025-12-19', 'Daily attendance marked', 19, '2025-12-18 20:21:25', 'present', NULL, NULL, NULL),
(70, 10, 2, '2025-12-19', 'Auto: Used advance payment', NULL, '2025-12-18 20:22:59', 'present', NULL, NULL, NULL),
(71, 9, 2, '2025-12-19', 'Auto: Used advance payment', NULL, '2025-12-18 20:24:00', 'present', NULL, NULL, NULL),
(72, 16, 2, '2025-12-19', 'Daily attendance marked', 20, '2025-12-18 20:33:38', 'present', NULL, NULL, NULL),
(73, 16, 2, '2025-12-20', 'Marked as Due - Patient will pay later', NULL, '2025-12-19 18:55:15', 'present', '2025-12-19 18:55:15', '2025-12-19 18:55:46', 1),
(74, 11, 2, '2025-12-20', 'Package attendance marked', 21, '2025-12-19 22:27:38', 'present', NULL, NULL, NULL),
(75, 15, 2, '2025-12-20', 'Auto: Used advance payment', NULL, '2025-12-19 22:28:00', 'present', NULL, NULL, NULL),
(76, 13, 2, '2025-12-25', 'Daily attendance marked', 22, '2025-12-25 09:32:59', 'present', NULL, NULL, NULL),
(77, 16, 2, '2025-12-26', 'Daily attendance marked', 23, '2025-12-25 19:49:03', 'present', NULL, NULL, NULL),
(78, 16, 1, '2025-12-28', 'Daily attendance marked', 24, '2025-12-27 23:23:47', 'present', NULL, NULL, NULL),
(79, 15, 1, '2025-12-28', 'Auto: Used advance payment', NULL, '2025-12-27 23:23:51', 'present', NULL, NULL, NULL),
(80, 14, 1, '2025-12-28', 'Package attendance marked', 25, '2025-12-27 23:23:57', 'present', NULL, NULL, NULL),
(81, 13, NULL, '2025-12-28', NULL, NULL, '2025-12-28 16:54:16', 'present', NULL, NULL, NULL),
(82, 9, NULL, '2025-12-28', NULL, NULL, '2025-12-28 16:54:22', 'present', NULL, NULL, NULL),
(83, 16, 1, '2026-01-04', 'Daily attendance marked', 26, '2026-01-04 16:35:58', 'present', NULL, NULL, NULL),
(84, 17, 2, '2026-01-05', 'Auto: Used advance payment', NULL, '2026-01-05 17:55:20', 'present', NULL, NULL, NULL),
(85, 19, NULL, '2026-01-09', 'Backdated by Admin', NULL, '2026-01-11 16:28:11', 'present', NULL, '2026-01-11 16:28:11', 1),
(86, 19, NULL, '2026-01-10', 'Backdated by Admin', NULL, '2026-01-11 16:34:04', 'present', NULL, '2026-01-11 16:34:04', 1),
(87, 15, NULL, '2026-01-10', 'Backdated by Admin', NULL, '2026-01-11 16:34:04', 'present', NULL, '2026-01-11 16:34:04', 1),
(88, 10, NULL, '2026-01-10', 'Backdated by Admin', NULL, '2026-01-11 16:34:04', 'present', NULL, '2026-01-11 16:34:04', 1),
(89, 19, NULL, '2026-01-04', 'Backdated by Admin', NULL, '2026-01-11 16:38:23', 'present', NULL, '2026-01-11 16:38:23', 1),
(90, 19, NULL, '2026-01-05', 'Backdated by Admin', NULL, '2026-01-11 16:38:23', 'present', NULL, '2026-01-11 16:38:23', 1),
(91, 19, NULL, '2026-01-06', 'Backdated by Admin', NULL, '2026-01-11 16:38:23', 'present', NULL, '2026-01-11 16:38:23', 1),
(92, 19, NULL, '2026-01-07', 'Backdated by Admin', NULL, '2026-01-11 16:38:23', 'present', NULL, '2026-01-11 16:38:23', 1),
(93, 19, NULL, '2026-01-08', 'Backdated by Admin', NULL, '2026-01-11 16:38:23', 'present', NULL, '2026-01-11 16:38:23', 1),
(94, 19, NULL, '2026-01-11', 'Backdated by Admin', NULL, '2026-01-11 16:38:23', 'present', NULL, '2026-01-11 16:38:23', 1),
(95, 17, 1, '2026-01-11', 'Daily attendance marked', 29, '2026-01-11 16:42:52', 'present', NULL, NULL, NULL),
(96, 9, 2, '2026-01-14', 'Auto: Used advance payment', NULL, '2026-01-14 12:40:19', 'present', NULL, NULL, NULL),
(97, 10, 2, '2026-01-18', 'Marked as Due - Patient will pay later', NULL, '2026-01-18 07:35:07', 'pending', '2026-01-18 07:35:07', NULL, NULL),
(98, 8, 2, '2026-01-18', 'Marked as Due - Patient will pay later', NULL, '2026-01-18 07:38:21', 'pending', '2026-01-18 07:38:21', NULL, NULL),
(100, 19, 2, '2026-01-20', 'Marked as Due - Patient will pay later', NULL, '2026-01-20 00:00:08', 'pending', '2026-01-20 00:00:08', NULL, NULL),
(101, 17, 2, '2026-01-20', 'Marked as Due - Patient will pay later', NULL, '2026-01-20 00:00:56', 'present', '2026-01-20 00:00:56', '2026-01-20 00:11:23', 1),
(104, 21, NULL, '2026-01-30', 'Auto: Debited from Balance', NULL, '2026-01-30 10:41:04', 'present', NULL, NULL, NULL),
(105, 20, NULL, '2026-01-30', 'Auto: Debited from Balance', NULL, '2026-01-30 10:44:08', 'present', NULL, NULL, NULL),
(106, 12, NULL, '2026-01-30', 'Auto: Debited from Balance', NULL, '2026-01-30 11:21:47', 'present', NULL, NULL, NULL),
(107, 19, 2, '2026-01-30', 'Advance attendance marked', 32, '2026-01-30 14:45:16', 'present', NULL, NULL, NULL),
(108, 17, 2, '2026-01-30', 'Daily attendance marked', 33, '2026-01-30 14:45:45', 'present', NULL, NULL, NULL),
(109, 6, NULL, '2026-01-30', 'Auto: Debited from Balance', NULL, '2026-01-30 14:48:44', 'present', NULL, NULL, NULL),
(110, 16, 2, '2026-01-30', 'Auto: Daily attendance', 34, '2026-01-30 14:56:15', 'present', NULL, NULL, NULL),
(111, 5, 2, '2026-01-30', 'Advance attendance marked', 35, '2026-01-30 14:57:22', 'present', NULL, NULL, NULL),
(112, 4, 2, '2026-01-30', 'Marked as Due - Patient will pay later', NULL, '2026-01-30 14:59:39', 'pending', '2026-01-30 14:59:39', NULL, NULL),
(113, 15, 2, '2026-01-30', 'Auto: Debited from Balance', NULL, '2026-01-30 15:30:26', 'present', NULL, NULL, NULL),
(118, 14, 2, '2026-01-30', '', NULL, '2026-01-30 15:42:42', 'present', NULL, NULL, NULL),
(119, 13, 2, '2026-01-30', 'Marked as Due - Patient will pay later', NULL, '2026-01-30 15:43:13', 'pending', '2026-01-30 15:43:13', NULL, NULL),
(120, 11, 2, '2026-01-30', '', NULL, '2026-01-30 15:50:41', 'present', NULL, NULL, NULL),
(121, 23, 2, '2026-01-31', '', NULL, '2026-01-31 07:43:33', 'present', NULL, NULL, NULL),
(122, 20, 2, '2026-01-31', 'Auto: Debited from Balance', NULL, '2026-01-31 07:43:59', 'present', NULL, NULL, NULL),
(123, 19, 2, '2026-01-31', '', NULL, '2026-01-31 07:44:08', 'present', NULL, NULL, NULL),
(124, 17, 2, '2026-01-31', '', NULL, '2026-01-31 07:44:20', 'present', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `log_id` bigint(20) UNSIGNED NOT NULL,
  `log_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `action_type` enum('CREATE','UPDATE','DELETE','LOGIN_SUCCESS','LOGIN_FAIL','LOGOUT','webapp_login_success','webapp_login_failed','mobile_login_success','mobile_login_failed') NOT NULL,
  `target_table` varchar(50) DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `details_before` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details_before`)),
  `details_after` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details_after`)),
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`log_id`, `log_timestamp`, `user_id`, `employee_id`, `username`, `branch_id`, `action_type`, `target_table`, `target_id`, `details_before`, `details_after`, `ip_address`) VALUES
(1, '2025-12-02 03:51:13', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '2409:40d2:4f:d3:e363:7300:531f:8274'),
(2, '2025-12-02 10:51:05', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 1, NULL, '{\"patient_name\":\"Kumar gopal krishna\",\"phone_number\":\"7766905366\",\"new_patient_uid\":\"2512021\",\"master_patient_id\":\"1\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(3, '2025-12-02 10:52:12', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 2, NULL, '{\"patient_name\":\"Ponam kumari\",\"phone_number\":\"9473037876\",\"new_patient_uid\":\"2512022\",\"master_patient_id\":\"2\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(4, '2025-12-02 10:53:33', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 3, NULL, '{\"patient_name\":\"Bandhana singh\",\"phone_number\":\"9801121814\",\"new_patient_uid\":\"2512023\",\"master_patient_id\":\"3\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(5, '2025-12-02 10:54:27', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 4, NULL, '{\"patient_name\":\"Gauri shankar singh\",\"phone_number\":\"9801121814\",\"new_patient_uid\":\"2512024\",\"master_patient_id\":3,\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(6, '2025-12-02 10:55:47', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 5, NULL, '{\"patient_name\":\"Bhavya singh\",\"phone_number\":\"9931289759\",\"new_patient_uid\":\"2512025\",\"master_patient_id\":\"4\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(7, '2025-12-02 10:57:19', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 6, NULL, '{\"patient_name\":\"Sangita singhaniya\",\"phone_number\":\"7781095941\",\"new_patient_uid\":\"2512026\",\"master_patient_id\":\"5\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(8, '2025-12-02 10:58:36', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 7, NULL, '{\"patient_name\":\"Sweety kumari\",\"phone_number\":\"9508006378\",\"new_patient_uid\":\"2512027\",\"master_patient_id\":\"6\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(9, '2025-12-02 11:02:07', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 8, NULL, '{\"patient_name\":\"Kamini sukhla\",\"phone_number\":\"9801734004\",\"new_patient_uid\":\"2512028\",\"master_patient_id\":\"7\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(10, '2025-12-02 11:09:47', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 9, NULL, '{\"patient_name\":\"Sandeep suman\",\"phone_number\":\"8797568590\",\"new_patient_uid\":\"2512029\",\"master_patient_id\":\"8\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(11, '2025-12-02 11:11:16', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 10, NULL, '{\"patient_name\":\"Kiran devi\",\"phone_number\":\"8102635424\",\"new_patient_uid\":\"25120210\",\"master_patient_id\":\"9\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(12, '2025-12-02 11:13:42', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 11, NULL, '{\"patient_name\":\"Aryan kumar\",\"phone_number\":\"8877875165\",\"new_patient_uid\":\"25120211\",\"master_patient_id\":\"10\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(13, '2025-12-02 11:16:15', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 12, NULL, '{\"patient_name\":\"Mahi noor\",\"phone_number\":\"926221615\",\"new_patient_uid\":\"25120212\",\"master_patient_id\":\"11\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(14, '2025-12-02 11:17:28', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 13, NULL, '{\"patient_name\":\"Anchal kumari\",\"phone_number\":\"7645864984\",\"new_patient_uid\":\"25120213\",\"master_patient_id\":\"12\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(15, '2025-12-02 11:18:59', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 14, NULL, '{\"patient_name\":\"Satyam kumar\",\"phone_number\":\"9199596520\",\"new_patient_uid\":\"25120214\",\"master_patient_id\":\"13\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(16, '2025-12-02 11:21:38', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 15, NULL, '{\"patient_name\":\"Riyansh Raj\",\"phone_number\":\"9572950061\",\"new_patient_uid\":\"25120215\",\"master_patient_id\":\"14\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(17, '2025-12-02 11:23:06', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 16, NULL, '{\"patient_name\":\"D N Singh\",\"phone_number\":\"8292802562\",\"new_patient_uid\":\"25120216\",\"master_patient_id\":\"15\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(18, '2025-12-02 11:24:17', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 17, NULL, '{\"patient_name\":\"Pushpa singh\",\"phone_number\":\"9608021243\",\"new_patient_uid\":\"25120217\",\"master_patient_id\":\"16\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(19, '2025-12-02 11:25:47', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 18, NULL, '{\"patient_name\":\"Ekra khatun\",\"phone_number\":\"8218014201\",\"new_patient_uid\":\"25120218\",\"master_patient_id\":\"17\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(20, '2025-12-02 11:32:57', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 19, NULL, '{\"patient_name\":\"Sana Akhtar\",\"phone_number\":\"6202539853\",\"new_patient_uid\":\"25120219\",\"master_patient_id\":\"18\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(21, '2025-12-02 11:34:09', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 20, NULL, '{\"patient_name\":\"Dimple bharti\",\"phone_number\":\"9304024182\",\"new_patient_uid\":\"25120220\",\"master_patient_id\":\"19\",\"consultation_amount\":0}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(22, '2025-12-02 11:47:40', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '2409:40d2:5b:563d:ee33:374f:5b1b:4253'),
(23, '2025-12-02 11:48:37', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 1, NULL, '{\"patient_name\":\"Aryan kumar\",\"test_uid\":\"25120201\",\"test_name\":\"eeg\",\"assigned_test_date\":\"2025-12-02\",\"total_amount\":2000,\"payment_status\":\"paid\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(24, '2025-12-02 11:49:54', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 2, NULL, '{\"patient_name\":\"Suraj kumar\",\"test_uid\":\"25120202\",\"test_name\":\"eeg\",\"assigned_test_date\":\"2025-12-02\",\"total_amount\":2000,\"payment_status\":\"paid\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(25, '2025-12-02 11:52:08', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 3, NULL, '{\"patient_name\":\"Aakash mishra\",\"test_uid\":\"25120203\",\"test_name\":\"ncv\",\"assigned_test_date\":\"2025-12-02\",\"total_amount\":3000,\"payment_status\":\"paid\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(26, '2025-12-02 11:54:34', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 4, NULL, '{\"patient_name\":\"Sri raj\",\"test_uid\":\"25120204\",\"test_name\":\"eeg\",\"assigned_test_date\":\"2025-12-02\",\"total_amount\":2000,\"payment_status\":\"paid\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(27, '2025-12-02 11:56:19', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 5, NULL, '{\"patient_name\":\"Binod Prasad singh\",\"test_uid\":\"25120205\",\"test_name\":\"eeg\",\"assigned_test_date\":\"2025-12-02\",\"total_amount\":2000,\"payment_status\":\"paid\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(28, '2025-12-02 11:57:42', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 6, NULL, '{\"patient_name\":\"Ankita kumari\",\"test_uid\":\"25120206\",\"test_name\":\"eeg\",\"assigned_test_date\":\"2025-12-02\",\"total_amount\":2000,\"payment_status\":\"paid\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(29, '2025-12-02 11:58:48', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 7, NULL, '{\"patient_name\":\"Rajnesh kumar\",\"test_uid\":\"25120207\",\"test_name\":\"eeg\",\"assigned_test_date\":\"2025-12-02\",\"total_amount\":2000,\"payment_status\":\"paid\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(30, '2025-12-02 12:00:15', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 14, NULL, '{\"registration_id\":\"14\",\"patient_name\":\"Satyam kumar\",\"phone_number\":\"9199596520\",\"email\":\"\",\"age\":\"1\",\"gender\":\"Male\",\"chief_complain\":\"other\",\"consultation_type\":\"in-clinic\",\"referralSource\":\"doctor_referral\",\"reffered_by\":\"Dr R K Sinha MD (Ped)\",\"consultation_amount\":\"6000\",\"payment_method\":\"other\",\"address\":\"Rajoun\",\"doctor_notes\":\"\",\"prescription\":\"\",\"follow_up_date\":\"\",\"remarks\":\"\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(31, '2025-12-02 12:00:49', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 14, NULL, '{\"registration_id\":\"14\",\"patient_name\":\"Satyam kumar\",\"phone_number\":\"9199596520\",\"email\":\"\",\"age\":\"1\",\"gender\":\"Male\",\"chief_complain\":\"other\",\"consultation_type\":\"in-clinic\",\"referralSource\":\"doctor_referral\",\"reffered_by\":\"Dr R K Sinha MD (Ped)\",\"consultation_amount\":\"600.00\",\"payment_method\":\"other\",\"address\":\"Rajoun\",\"doctor_notes\":\"\",\"prescription\":\"\",\"follow_up_date\":\"\",\"remarks\":\"\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(32, '2025-12-02 12:01:16', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 1, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(33, '2025-12-02 12:01:24', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 2, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(34, '2025-12-02 12:16:57', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 13, NULL, '{\"registration_id\":\"13\",\"patient_name\":\"Anchal kumari\",\"phone_number\":\"7645864984\",\"email\":\"\",\"age\":\"29\",\"gender\":\"Female\",\"chief_complain\":\"neck_pain\",\"consultation_type\":\"in-clinic\",\"referralSource\":\"self\",\"reffered_by\":\"Self\",\"consultation_amount\":\"600\",\"payment_method\":\"other\",\"address\":\"Kathalbari\",\"doctor_notes\":\"\",\"prescription\":\"\",\"follow_up_date\":\"\",\"remarks\":\"\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(36, '2025-12-02 12:17:40', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 12, NULL, '{\"registration_id\":\"12\",\"patient_name\":\"Mahi noor\",\"phone_number\":\"926221615\",\"email\":\"\",\"age\":\"2\",\"gender\":\"Female\",\"chief_complain\":\"other\",\"consultation_type\":\"in-clinic\",\"referralSource\":\"doctor_referral\",\"reffered_by\":\"Dr Md khalil Ahemad MD (Ped)\",\"consultation_amount\":\"600\",\"payment_method\":\"other\",\"address\":\"Sanoula\",\"doctor_notes\":\"\",\"prescription\":\"\",\"follow_up_date\":\"\",\"remarks\":\"\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(37, '2025-12-02 12:19:35', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '2409:40d2:5b:563d:ee33:374f:5b1b:4253'),
(38, '2025-12-02 12:54:56', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 3, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(39, '2025-12-02 12:55:04', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 4, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(40, '2025-12-02 12:55:12', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 5, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(41, '2025-12-02 12:55:20', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 6, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(42, '2025-12-02 12:55:32', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 7, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '2405:201:a41b:f034:a417:49b9:e880:ed8a'),
(49, '2025-12-02 19:47:42', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 14, NULL, '{\"patient_name\":\"Test\",\"test_uid\":\"25120301\",\"test_name\":\"eeg\",\"assigned_test_date\":\"2025-12-03\",\"total_amount\":2000,\"payment_status\":\"paid\"}', '127.0.0.1'),
(50, '2025-12-02 19:47:42', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 15, NULL, '{\"patient_name\":\"Test\",\"test_uid\":\"25120302\",\"test_name\":\"ncv\",\"assigned_test_date\":\"2025-12-03\",\"total_amount\":2000,\"payment_status\":\"paid\"}', '127.0.0.1'),
(51, '2025-12-02 19:47:42', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 16, NULL, '{\"patient_name\":\"Test\",\"test_uid\":\"25120303\",\"test_name\":\"bera\",\"assigned_test_date\":\"2025-12-03\",\"total_amount\":2500,\"payment_status\":\"paid\"}', '127.0.0.1'),
(52, '2025-12-02 19:47:42', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 17, NULL, '{\"patient_name\":\"Test\",\"test_uid\":\"25120304\",\"test_name\":\"ECG\",\"assigned_test_date\":\"2025-12-03\",\"total_amount\":2000,\"payment_status\":\"partial\"}', '127.0.0.1'),
(53, '2025-12-02 20:01:40', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 18, NULL, '{\"patient_name\":\"Test2\",\"test_uid\":\"25120305\",\"test_names\":[\"eeg\",\"ncv\",\"emg\",\"EGG\"],\"total_amount\":9000,\"payment_status\":\"partial\"}', '127.0.0.1'),
(54, '2025-12-02 20:24:26', NULL, 2, 'Saniya', 1, 'CREATE', 'test_items', 5, NULL, '{\"test_id\":18,\"test_name\":\"ncv\"}', '127.0.0.1'),
(55, '2025-12-02 20:30:26', NULL, 2, 'Saniya', 1, 'CREATE', 'test_items', 6, NULL, '{\"test_id\":18,\"test_name\":\"bera\"}', '127.0.0.1'),
(56, '2025-12-03 09:34:47', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 19, NULL, '{\"patient_id\":4,\"test_name\":\"emg\"}', '127.0.0.1'),
(57, '2025-12-03 18:18:52', NULL, 2, 'Saniya', 1, 'CREATE', 'patient_appointments', 66, NULL, '{\"patient_id\":8,\"date\":\"2025-12-04\",\"time\":\"10:30\",\"service\":\"physio\"}', '127.0.0.1'),
(58, '2025-12-05 10:47:02', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 1, NULL, '{\"rescheduled_to\":\"2025-12-05 09:00\"}', '127.0.0.1'),
(59, '2025-12-05 10:47:07', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 2, NULL, '{\"rescheduled_to\":\"2025-12-05 09:30\"}', '127.0.0.1'),
(60, '2025-12-05 10:57:06', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 21, NULL, '{\"patient_name\":\"Sumit\",\"phone_number\":\"7729281910\",\"new_patient_uid\":\"2512051\",\"master_patient_id\":\"20\",\"consultation_amount\":600}', '127.0.0.1'),
(61, '2025-12-05 11:01:30', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 20, NULL, '{\"patient_name\":\"Sumit\",\"test_uid\":\"25120501\",\"test_names\":[\"eeg\",\"ncv\",\"ECG\"],\"total_amount\":5500,\"payment_status\":\"partial\"}', '127.0.0.1'),
(62, '2025-12-05 11:01:51', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 20, NULL, '{\"test_id\":20,\"patient_name\":\"Sumit\",\"phone_number\":\"7739208312\",\"alternate_phone_no\":\"\",\"gender\":\"Male\",\"age\":\"22\",\"dob\":\"\",\"parents\":\"\",\"relation\":\"\"}', '127.0.0.1'),
(63, '2025-12-05 18:05:48', NULL, 2, 'Saniya', 1, 'CREATE', 'patients', 9, NULL, '{\"service_type\":\"speech_therapy\",\"total_amount\":4750}', '127.0.0.1'),
(64, '2025-12-06 07:14:38', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 22, NULL, '{\"patient_name\":\"Sumit\",\"phone_number\":\"7739182939\",\"new_patient_uid\":\"2512061\",\"master_patient_id\":\"21\",\"consultation_amount\":600}', '127.0.0.1'),
(65, '2025-12-06 10:02:22', NULL, 2, 'Saniya', 1, 'CREATE', 'patient_appointments', 77, NULL, '{\"patient_id\":9,\"date\":\"2025-12-06\",\"time\":\"10:30:00\",\"service\":\"physio\"}', '127.0.0.1'),
(66, '2025-12-06 12:02:06', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 7, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(67, '2025-12-06 12:03:43', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 9, '{\"paid\":500}', '{\"new_due\":0,\"payment_status\":\"paid\"}', '127.0.0.1'),
(68, '2025-12-06 12:03:55', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 9, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(69, '2025-12-06 12:04:04', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 8, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(70, '2025-12-06 12:21:00', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 19, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(71, '2025-12-06 12:21:24', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 19, '{\"paid\":200}', '{\"new_due\":0,\"payment_status\":\"paid\"}', '127.0.0.1'),
(72, '2025-12-06 12:45:58', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 19, '{\"test_status\":\"previous\"}', '{\"test_status\":\"pending\"}', '127.0.0.1'),
(73, '2025-12-06 14:13:54', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 7, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"pending\"}', '127.0.0.1'),
(74, '2025-12-06 14:14:24', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 7, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"paid\"}', '127.0.0.1'),
(75, '2025-12-06 14:14:37', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 1, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"pending\"}', '127.0.0.1'),
(76, '2025-12-06 14:14:45', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 1, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"partial\"}', '127.0.0.1'),
(77, '2025-12-06 14:14:48', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 1, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"paid\"}', '127.0.0.1'),
(78, '2025-12-06 14:15:08', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 1, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"pending\"}', '127.0.0.1'),
(79, '2025-12-06 14:15:09', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 1, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"partial\"}', '127.0.0.1'),
(80, '2025-12-06 14:15:16', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 17, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"pending\"}', '127.0.0.1'),
(81, '2025-12-06 17:37:57', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(82, '2025-12-06 19:41:29', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 23, NULL, '{\"patient_name\":\"Test\",\"phone_number\":\"7789928393\",\"new_patient_uid\":\"2512071\",\"master_patient_id\":\"22\",\"consultation_amount\":600}', '127.0.0.1'),
(83, '2025-12-06 19:41:54', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 23, NULL, '{\"rescheduled_to\":\"2025-12-07 09:00\"}', '127.0.0.1'),
(84, '2025-12-06 19:43:22', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 21, NULL, '{\"patient_name\":\"Another Test\",\"test_uid\":\"25120701\",\"test_names\":[\"eeg\",\"ncv\",\"emg\",\"rns\",\"bera\",\"vep\",\"EGG\"],\"total_amount\":15500,\"payment_status\":\"partial\"}', '127.0.0.1'),
(85, '2025-12-06 19:43:47', NULL, 2, 'Saniya', 1, 'CREATE', 'quick_inquiry', 1, NULL, '{\"name\":\"Test\",\"age\":\"22\",\"phone_number\":\"7389928393\",\"referralSource\":\"doctor_referral\",\"inquiry_type\":\"physio\",\"communication_type\":\"by_visit\"}', '127.0.0.1'),
(86, '2025-12-06 19:44:07', NULL, 2, 'Saniya', 1, 'CREATE', 'test_inquiry', 1, NULL, '{\"name\":\"ANother test\",\"testname\":\"vep\",\"mobile_number\":\"7933493493\",\"reffered_by\":\"Me\"}', '127.0.0.1'),
(87, '2025-12-06 19:46:15', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 21, NULL, '{\"test_id\":21,\"patient_name\":\"Another Test\",\"age\":\"22\",\"gender\":\"Male\",\"phone_number\":\"\",\"alternate_phone_no\":\"\",\"dob\":\"2002-12-28\",\"parents\":\"SK\",\"relation\":\"Father\"}', '127.0.0.1'),
(88, '2025-12-06 19:47:26', NULL, 2, 'Saniya', 1, 'CREATE', 'patients', 10, NULL, '{\"service_type\":\"physio\",\"total_amount\":4500}', '127.0.0.1'),
(89, '2025-12-06 19:49:14', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 10, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(90, '2025-12-06 19:49:22', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 11, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(91, '2025-12-06 19:49:26', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 12, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(92, '2025-12-06 19:49:30', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 13, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(93, '2025-12-06 19:49:39', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 14, '{\"paid\":1200}', '{\"new_due\":126,\"payment_status\":\"partial\"}', '127.0.0.1'),
(94, '2025-12-06 19:49:46', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 15, '{\"paid\":1000}', '{\"new_due\":500,\"payment_status\":\"partial\"}', '127.0.0.1'),
(95, '2025-12-06 19:49:53', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 16, '{\"paid\":1500}', '{\"new_due\":500,\"payment_status\":\"partial\"}', '127.0.0.1'),
(96, '2025-12-06 19:50:07', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 16, '{\"paid\":500}', '{\"new_due\":0,\"payment_status\":\"paid\"}', '127.0.0.1'),
(97, '2025-12-06 19:50:14', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 16, '{\"payment_status\":\"previous\"}', '{\"payment_status\":\"paid\"}', '127.0.0.1'),
(98, '2025-12-06 19:50:22', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 15, '{\"paid\":500}', '{\"new_due\":0,\"payment_status\":\"paid\"}', '127.0.0.1'),
(99, '2025-12-06 19:50:27', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 14, '{\"paid\":126}', '{\"new_due\":0,\"payment_status\":\"paid\"}', '127.0.0.1'),
(100, '2025-12-06 19:50:35', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 14, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(101, '2025-12-06 19:50:39', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 15, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(102, '2025-12-06 19:50:41', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 16, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(103, '2025-12-10 17:16:46', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 24, NULL, '{\"patient_name\":\"Sumit Sinha\",\"phone_number\":\"7739208200\",\"new_patient_uid\":\"2512101\",\"master_patient_id\":\"23\",\"consultation_amount\":600}', '127.0.0.1'),
(104, '2025-12-10 17:21:01', NULL, 2, 'Saniya', 1, 'CREATE', 'patients', 11, NULL, '{\"service_type\":\"physio\",\"total_amount\":28500}', '127.0.0.1'),
(105, '2025-12-10 17:26:32', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 24, '{\"patient_photo_path\":\"old\"}', '{\"patient_photo_path\":\"uploads\\/patient_photos\\/reg_24_1765387592.jpeg\"}', '127.0.0.1'),
(106, '2025-12-10 17:28:04', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 25, NULL, '{\"patient_name\":\"Test\",\"phone_number\":\"4656524465\",\"new_patient_uid\":\"2512102\",\"master_patient_id\":\"24\",\"consultation_amount\":600}', '127.0.0.1'),
(107, '2025-12-10 17:33:35', NULL, 2, 'Saniya', 1, 'CREATE', 'patients', 12, NULL, '{\"service_type\":\"physio\",\"total_amount\":30000}', '127.0.0.1'),
(108, '2025-12-10 19:23:10', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 26, NULL, '{\"patient_name\":\"Priyanshu\",\"phone_number\":\"7394394339\",\"new_patient_uid\":\"2512111\",\"master_patient_id\":\"25\",\"consultation_amount\":600}', '127.0.0.1'),
(109, '2025-12-10 19:24:11', NULL, 2, 'Saniya', 1, 'CREATE', 'patients', 13, NULL, '{\"service_type\":\"physio\",\"total_amount\":600}', '127.0.0.1'),
(110, '2025-12-10 19:28:48', NULL, 2, 'Saniya', 1, 'CREATE', 'patient_appointments', 126, NULL, '{\"patient_id\":13,\"date\":\"2025-12-11\",\"time\":\"12:00:00\",\"service\":\"physio\"}', '127.0.0.1'),
(111, '2025-12-10 19:33:47', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 26, NULL, '{\"rescheduled_to\":\"2025-12-11 13:30\"}', '127.0.0.1'),
(112, '2025-12-10 19:34:08', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 26, NULL, '{\"rescheduled_to\":\"2025-12-11 09:00\"}', '127.0.0.1'),
(113, '2025-12-10 19:34:20', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 26, NULL, '{\"rescheduled_to\":\"2025-12-12 10:00\"}', '127.0.0.1'),
(114, '2025-12-10 19:36:23', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 1, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(115, '2025-12-10 19:36:35', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 7, '{\"test_status\":\"previous\"}', '{\"test_status\":\"pending\"}', '127.0.0.1'),
(116, '2025-12-10 19:36:58', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 2, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(117, '2025-12-10 19:37:15', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 3, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(118, '2025-12-10 19:37:20', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 4, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(119, '2025-12-10 19:37:23', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 5, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(120, '2025-12-10 19:37:26', NULL, 2, 'Saniya', 1, 'UPDATE', 'test_items', 6, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(121, '2025-12-10 19:42:14', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 26, NULL, '{\"rescheduled_to\":\"2025-12-11 09:00\"}', '127.0.0.1'),
(122, '2025-12-12 18:54:09', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 1, NULL, '{\"token_uid\":\"T251213-01\",\"patient_id\":13}', '127.0.0.1'),
(123, '2025-12-12 20:51:06', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 27, NULL, '{\"patient_name\":\"Test\",\"phone_number\":\"7338784737\",\"new_patient_uid\":\"2512131\",\"master_patient_id\":\"26\",\"consultation_amount\":600}', '127.0.0.1'),
(124, '2025-12-12 20:51:33', NULL, 2, 'Saniya', 1, 'CREATE', 'patients', 14, NULL, '{\"service_type\":\"physio\",\"total_amount\":30000}', '127.0.0.1'),
(125, '2025-12-13 17:39:47', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 26, NULL, '{\"rescheduled_to\":\"2025-12-13 09:30\"}', '127.0.0.1'),
(126, '2025-12-13 17:39:55', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 24, NULL, '{\"rescheduled_to\":\"2025-12-13 10:00\"}', '127.0.0.1'),
(127, '2025-12-13 17:40:02', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 25, NULL, '{\"rescheduled_to\":\"2025-12-13 10:30\"}', '127.0.0.1'),
(128, '2025-12-13 17:40:16', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 23, NULL, '{\"rescheduled_to\":\"2025-12-13 11:00\"}', '127.0.0.1'),
(129, '2025-12-13 17:40:27', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 22, NULL, '{\"rescheduled_to\":\"2025-12-13 11:30\"}', '127.0.0.1'),
(130, '2025-12-13 17:40:35', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 1, NULL, '{\"rescheduled_to\":\"2025-12-13 12:00\"}', '127.0.0.1'),
(131, '2025-12-13 17:40:41', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 2, NULL, '{\"rescheduled_to\":\"2025-12-13 12:30\"}', '127.0.0.1'),
(132, '2025-12-13 17:41:37', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 27, NULL, '{\"registration_id\":\"27\",\"patient_name\":\"John Doe\",\"age\":\"22\",\"gender\":\"Male\",\"phone_number\":\"7338784737\",\"email\":\"\",\"address\":\"\",\"chief_complain\":\"neck_pain\",\"consultation_type\":\"in-clinic\",\"reffered_by\":\"Dr A K Bhagat MD (Phych)\",\"consultation_amount\":\"600.00\",\"payment_method\":\"upi-boi\",\"doctor_notes\":\"\",\"prescription\":\"\",\"follow_up_date\":\"\"}', '127.0.0.1'),
(133, '2025-12-13 17:41:51', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 25, NULL, '{\"registration_id\":\"25\",\"patient_name\":\"Sonu\",\"age\":\"22\",\"gender\":\"Male\",\"phone_number\":\"4656524465\",\"email\":\"\",\"address\":\"\",\"chief_complain\":\"neck_pain\",\"consultation_type\":\"in-clinic\",\"reffered_by\":\"Self\",\"consultation_amount\":\"600.00\",\"payment_method\":\"card\",\"doctor_notes\":\"\",\"prescription\":\"\",\"follow_up_date\":\"\"}', '127.0.0.1'),
(134, '2025-12-13 17:42:23', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 23, NULL, '{\"rescheduled_to\":\"2025-12-12 09:00\"}', '127.0.0.1'),
(135, '2025-12-13 19:11:41', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 26, NULL, '{\"rescheduled_to\":\"2025-12-14 09:00\"}', '127.0.0.1'),
(136, '2025-12-13 19:11:47', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 24, NULL, '{\"rescheduled_to\":\"2025-12-14 09:30\"}', '127.0.0.1'),
(137, '2025-12-13 19:11:52', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 25, NULL, '{\"rescheduled_to\":\"2025-12-14 10:00\"}', '127.0.0.1'),
(138, '2025-12-13 19:11:57', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 22, NULL, '{\"rescheduled_to\":\"2025-12-14 10:30\"}', '127.0.0.1'),
(139, '2025-12-13 19:12:02', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 1, NULL, '{\"rescheduled_to\":\"2025-12-14 11:00\"}', '127.0.0.1'),
(140, '2025-12-13 19:12:06', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 2, NULL, '{\"rescheduled_to\":\"2025-12-14 11:30\"}', '127.0.0.1'),
(141, '2025-12-13 19:18:08', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 24, NULL, '{\"rescheduled_to\":\"2025-12-15 09:00\"}', '127.0.0.1'),
(142, '2025-12-13 19:18:16', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 25, NULL, '{\"rescheduled_to\":\"2025-12-15 09:30\"}', '127.0.0.1'),
(143, '2025-12-13 19:18:29', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 2, NULL, '{\"rescheduled_to\":\"2025-12-16 09:00\"}', '127.0.0.1'),
(144, '2025-12-13 19:18:41', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 22, NULL, '{\"rescheduled_to\":\"2025-12-16 09:30\"}', '127.0.0.1'),
(145, '2025-12-13 19:18:51', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 3, NULL, '{\"rescheduled_to\":\"2025-12-15 10:00\"}', '127.0.0.1'),
(146, '2025-12-13 19:18:59', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 4, NULL, '{\"rescheduled_to\":\"2025-12-14 09:30\"}', '127.0.0.1'),
(147, '2025-12-13 19:19:04', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 5, NULL, '{\"rescheduled_to\":\"2025-12-16 10:00\"}', '127.0.0.1'),
(148, '2025-12-13 19:19:09', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 6, NULL, '{\"rescheduled_to\":\"2025-12-17 09:00\"}', '127.0.0.1'),
(149, '2025-12-13 19:19:17', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 7, NULL, '{\"rescheduled_to\":\"2025-12-14 10:00\"}', '127.0.0.1'),
(150, '2025-12-13 19:19:25', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 8, NULL, '{\"rescheduled_to\":\"2025-12-18 09:00\"}', '127.0.0.1'),
(151, '2025-12-13 19:19:30', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 12, NULL, '{\"rescheduled_to\":\"2025-12-14 10:30\"}', '127.0.0.1'),
(152, '2025-12-13 19:19:34', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 11, NULL, '{\"rescheduled_to\":\"2025-12-15 10:30\"}', '127.0.0.1'),
(153, '2025-12-13 19:19:39', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 9, NULL, '{\"rescheduled_to\":\"2025-12-19 09:00\"}', '127.0.0.1'),
(154, '2025-12-13 19:19:44', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 13, NULL, '{\"rescheduled_to\":\"2025-12-15 11:00\"}', '127.0.0.1'),
(155, '2025-12-13 19:19:55', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 18, NULL, '{\"rescheduled_to\":\"2025-12-16 10:30\"}', '127.0.0.1'),
(156, '2025-12-13 19:20:00', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 20, NULL, '{\"rescheduled_to\":\"2025-12-14 11:30\"}', '127.0.0.1'),
(157, '2025-12-13 19:20:06', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 17, NULL, '{\"rescheduled_to\":\"2025-12-18 09:30\"}', '127.0.0.1'),
(158, '2025-12-13 19:20:12', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 16, NULL, '{\"rescheduled_to\":\"2025-12-15 11:30\"}', '127.0.0.1'),
(159, '2025-12-13 19:20:17', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 15, NULL, '{\"rescheduled_to\":\"2025-12-17 09:30\"}', '127.0.0.1'),
(160, '2025-12-13 19:20:23', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 19, NULL, '{\"rescheduled_to\":\"2025-12-18 10:00\"}', '127.0.0.1'),
(161, '2025-12-14 13:48:10', NULL, 2, 'Saniya', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(162, '2025-12-15 08:49:03', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(163, '2025-12-15 08:52:05', NULL, 2, 'Saniya', 1, 'UPDATE', 'patient_appointments', 130, NULL, '{\"appointment_id\":130,\"new_date\":\"2025-12-15\",\"new_time\":\"09:00:00\"}', '127.0.0.1'),
(164, '2025-12-15 08:52:12', NULL, 2, 'Saniya', 1, 'UPDATE', 'patient_appointments', 130, NULL, '{\"appointment_id\":130,\"new_date\":\"2025-12-15\",\"new_time\":\"09:00:00\"}', '127.0.0.1'),
(165, '2025-12-15 08:52:45', NULL, 2, 'Saniya', 1, 'UPDATE', 'patient_appointments', 109, NULL, '{\"appointment_id\":109,\"new_date\":\"2025-12-15\",\"new_time\":\"09:00:00\"}', '127.0.0.1'),
(166, '2025-12-15 08:52:59', NULL, 2, 'Saniya', 1, 'UPDATE', 'patient_appointments', 130, NULL, '{\"appointment_id\":130,\"new_date\":\"2025-12-15\",\"new_time\":\"12:00:00\"}', '127.0.0.1'),
(167, '2025-12-15 08:53:08', NULL, 2, 'Saniya', 1, 'UPDATE', 'patient_appointments', 109, NULL, '{\"appointment_id\":109,\"new_date\":\"2025-12-15\",\"new_time\":\"15:00:00\"}', '127.0.0.1'),
(168, '2025-12-15 09:48:07', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 28, NULL, '{\"patient_name\":\"Test\",\"phone_number\":\"7939489384\",\"new_patient_uid\":\"2512151\",\"master_patient_id\":\"27\",\"consultation_amount\":600}', '127.0.0.1'),
(169, '2025-12-15 12:00:34', NULL, 2, 'Saniya', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(170, '2025-12-15 12:24:41', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 3, '{\"expense_id\":3,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-20251207013058\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test3\",\"expense_done_by\":\"test3\",\"expense_for\":\"test3\",\"description\":\"\",\"amount\":\"1200.00\",\"amount_in_words\":\"One Thousand Two Hundred Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:30:58\",\"updated_at\":\"2025-12-07 01:30:58\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '{\"expense_id\":3,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-20251207013058\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test3\",\"expense_done_by\":\"test3\",\"expense_for\":\"test3\",\"description\":\"\",\"amount\":\"1200.00\",\"amount_in_words\":\"One Thousand Two Hundred Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-15 17:54:41\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:30:58\",\"updated_at\":\"2025-12-15 17:54:41\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '127.0.0.1'),
(171, '2025-12-15 12:24:43', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 2, '{\"expense_id\":2,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-1765051182-6068\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test2\",\"expense_done_by\":\"test2\",\"expense_for\":\"test2\",\"description\":\"\",\"amount\":\"2000.00\",\"amount_in_words\":\"Two Thousand Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:29:42\",\"updated_at\":\"2025-12-07 01:29:42\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '{\"expense_id\":2,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-1765051182-6068\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test2\",\"expense_done_by\":\"test2\",\"expense_for\":\"test2\",\"description\":\"\",\"amount\":\"2000.00\",\"amount_in_words\":\"Two Thousand Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-15 17:54:43\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:29:42\",\"updated_at\":\"2025-12-15 17:54:43\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '127.0.0.1'),
(172, '2025-12-15 12:24:46', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 1, '{\"expense_id\":1,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test\",\"expense_done_by\":\"test\",\"expense_for\":\"test\",\"description\":\"\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:25:02\",\"updated_at\":\"2025-12-07 01:25:02\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '{\"expense_id\":1,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test\",\"expense_done_by\":\"test\",\"expense_for\":\"test\",\"description\":\"\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-15 17:54:46\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:25:02\",\"updated_at\":\"2025-12-15 17:54:46\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '127.0.0.1'),
(177, '2025-12-15 14:36:14', NULL, 1, 'Pranav', 1, 'CREATE', 'employees', 9, NULL, '{\":first_name\":\"Test5\",\":last_name\":\"te\",\":phone_number\":\"7889218292\",\":address\":\"noida\",\":date_of_joining\":\"2025-12-15\",\":email\":\"test5@prospine.in\",\":role_id\":2,\":branch_id\":1,\":is_active\":1}', '127.0.0.1'),
(178, '2025-12-15 15:39:14', NULL, 1, 'Pranav', 1, 'UPDATE', 'employees', 5, NULL, '{\":first_name\":\"Test2\",\":last_name\":\"tee\",\":phone_number\":\"1234567890\",\":address\":\"Noida\",\":date_of_joining\":\"2025-12-15\",\":is_active\":1,\":email\":\"test2@prospine.in\",\":role_id\":2,\":branch_id\":1,\":employee_id\":5}', '127.0.0.1'),
(179, '2025-12-15 15:41:35', NULL, 1, 'Pranav', 1, 'UPDATE', 'employees', 9, NULL, '{\":first_name\":\"Test5\",\":last_name\":\"te\",\":phone_number\":\"7889218292\",\":address\":\"noida\",\":date_of_joining\":\"2025-12-15\",\":is_active\":0,\":email\":\"test5@prospine.in\",\":role_id\":2,\":branch_id\":1,\":employee_id\":9}', '127.0.0.1'),
(180, '2025-12-15 15:41:39', NULL, 1, 'Pranav', 1, 'UPDATE', 'employees', 7, NULL, '{\":first_name\":\"Test4\",\":last_name\":\"te\",\":phone_number\":\"7889218292\",\":address\":\"noida\",\":date_of_joining\":\"2025-12-15\",\":is_active\":0,\":email\":\"test4@prospine.in\",\":role_id\":2,\":branch_id\":1,\":employee_id\":7}', '127.0.0.1'),
(181, '2025-12-15 15:41:46', NULL, 1, 'Pranav', 1, 'UPDATE', 'employees', 6, NULL, '{\":first_name\":\"Test3\",\":last_name\":\"teee\",\":phone_number\":\"12345678\",\":address\":\"n\",\":date_of_joining\":\"2025-12-15\",\":is_active\":0,\":email\":\"n@pr.in\",\":role_id\":2,\":branch_id\":1,\":employee_id\":6}', '127.0.0.1'),
(182, '2025-12-15 15:42:18', NULL, 1, 'Pranav', 1, 'UPDATE', 'employees', 9, NULL, '{\":first_name\":\"Test5\",\":last_name\":\"te\",\":job_title\":\"Test\",\":phone_number\":\"7889218292\",\":address\":\"noida\",\":date_of_joining\":\"2025-12-15\",\":is_active\":0,\":email\":\"test5@prospine.in\",\":role_id\":2,\":branch_id\":1,\":employee_id\":9}', '127.0.0.1'),
(183, '2025-12-15 19:16:37', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(184, '2025-12-15 19:17:04', NULL, 2, 'Saniya', 1, 'CREATE', 'patients', 15, NULL, '{\"service_type\":\"physio\",\"total_amount\":30000}', '127.0.0.1'),
(185, '2025-12-15 19:17:51', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 2, NULL, '{\"token_uid\":\"T251216-01\",\"patient_id\":15}', '127.0.0.1'),
(186, '2025-12-15 19:19:37', NULL, 2, 'Saniya', 1, 'UPDATE', 'patient_appointments', 131, NULL, '{\"appointment_id\":131,\"new_date\":\"2025-12-16\",\"new_time\":\"12:00:00\"}', '127.0.0.1'),
(187, '2025-12-15 19:19:48', NULL, 2, 'Saniya', 1, 'UPDATE', 'patient_appointments', 89, NULL, '{\"appointment_id\":89,\"new_date\":\"2025-12-16\",\"new_time\":\"18:00:00\"}', '127.0.0.1'),
(188, '2025-12-15 19:21:52', NULL, 2, 'Saniya', 1, 'CREATE', 'tests', 22, NULL, '{\"patient_id\":15,\"test_name\":\"eeg\"}', '127.0.0.1'),
(189, '2025-12-15 19:22:36', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 22, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(190, '2025-12-15 19:22:41', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 22, '{\"paid\":500}', '{\"new_due\":0,\"payment_status\":\"paid\"}', '127.0.0.1'),
(191, '2025-12-15 19:23:10', NULL, 2, 'Saniya', 1, 'UPDATE', 'registration', 18, NULL, '{\"rescheduled_to\":\"2025-12-17 10:00\"}', '127.0.0.1'),
(192, '2025-12-16 17:30:46', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 3, '{\"expense_id\":3,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-20251207013058\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test3\",\"expense_done_by\":\"test3\",\"expense_for\":\"test3\",\"description\":\"\",\"amount\":\"1200.00\",\"amount_in_words\":\"One Thousand Two Hundred Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-15 17:54:41\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:30:58\",\"updated_at\":\"2025-12-15 17:54:41\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '{\"expense_id\":3,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-20251207013058\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test3\",\"expense_done_by\":\"test3\",\"expense_for\":\"test3\",\"description\":\"\",\"amount\":\"1200.00\",\"amount_in_words\":\"One Thousand Two Hundred Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-16 23:00:46\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:30:58\",\"updated_at\":\"2025-12-16 23:00:46\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '127.0.0.1'),
(193, '2025-12-16 17:31:52', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 3, '{\"expense_id\":3,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-20251207013058\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test3\",\"expense_done_by\":\"test3\",\"expense_for\":\"test3\",\"description\":\"\",\"amount\":\"1200.00\",\"amount_in_words\":\"One Thousand Two Hundred Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-16 23:00:46\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:30:58\",\"updated_at\":\"2025-12-16 23:00:46\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '{\"expense_id\":3,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-20251207013058\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test3\",\"expense_done_by\":\"test3\",\"expense_for\":\"test3\",\"description\":\"\",\"amount\":\"1200.00\",\"amount_in_words\":\"One Thousand Two Hundred Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:30:58\",\"updated_at\":\"2025-12-16 23:01:52\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '127.0.0.1'),
(194, '2025-12-16 17:45:44', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 3, '{\"expense_id\":3,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-20251207013058\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test3\",\"expense_done_by\":\"test3\",\"expense_for\":\"test3\",\"description\":\"\",\"amount\":\"1200.00\",\"amount_in_words\":\"One Thousand Two Hundred Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:30:58\",\"updated_at\":\"2025-12-16 23:01:52\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '{\"expense_id\":3,\"branch_id\":1,\"user_id\":2,\"employee_id\":null,\"voucher_no\":\"EXP-20251207013058\",\"expense_date\":\"2025-12-07\",\"paid_to\":\"test3\",\"expense_done_by\":\"test3\",\"expense_for\":\"test3\",\"description\":\"\",\"amount\":\"1200.00\",\"amount_in_words\":\"One Thousand Two Hundred Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-16 23:15:44\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-07 01:30:58\",\"updated_at\":\"2025-12-16 23:15:44\",\"payment_method\":\"cash\",\"bill_image_path\":null}', '127.0.0.1'),
(195, '2025-12-16 17:53:38', NULL, 1, 'Pranav', 1, 'CREATE', 'expenses', 4, NULL, '{\"amount\":5000,\"for\":\"Admin Expense\"}', '127.0.0.1'),
(196, '2025-12-16 18:30:56', NULL, 1, 'Pranav', 1, 'CREATE', 'expenses', 5, NULL, '{\"amount\":20000,\"for\":\"Admin Expense\"}', '127.0.0.1'),
(197, '2025-12-16 19:11:17', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 6, '{\"expense_id\":6,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217004059\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me\",\"expense_done_by\":\"me\",\"expense_for\":\"me\",\"description\":\"test\",\"amount\":\"500.00\",\"amount_in_words\":\"Five Hundred Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 00:40:59\",\"updated_at\":\"2025-12-17 00:40:59\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":6,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217004059\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me\",\"expense_done_by\":\"me\",\"expense_for\":\"me\",\"description\":\"test\",\"amount\":\"500.00\",\"amount_in_words\":\"Five Hundred Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-17 00:41:17\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 00:40:59\",\"updated_at\":\"2025-12-17 00:41:17\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1'),
(198, '2025-12-16 19:37:53', NULL, 2, 'Saniya', 1, 'CREATE', 'expenses', 8, NULL, '{\"expense_id\":\"8\",\"voucher_no\":\"\",\"amount\":800,\"status\":\"approved\",\"paid_to\":\"me2\"}', '127.0.0.1'),
(199, '2025-12-16 19:46:00', NULL, 2, 'Saniya', 1, 'CREATE', 'expenses', 9, NULL, '{\"expense_id\":\"9\",\"voucher_no\":\"\",\"amount\":1000,\"status\":\"pending\",\"paid_to\":\"me3\"}', '127.0.0.1'),
(200, '2025-12-16 19:46:35', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 9, '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:16:00\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"rejected\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:16:35\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1'),
(201, '2025-12-16 19:46:52', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 9, '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"rejected\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:16:35\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"paid\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:16:52\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1');
INSERT INTO `audit_log` (`log_id`, `log_timestamp`, `user_id`, `employee_id`, `username`, `branch_id`, `action_type`, `target_table`, `target_id`, `details_before`, `details_after`, `ip_address`) VALUES
(202, '2025-12-16 19:47:04', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 9, '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"paid\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:16:52\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-17 01:17:04\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:17:04\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1'),
(203, '2025-12-16 19:47:11', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 9, '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-17 01:17:04\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:17:04\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"rejected\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:17:11\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1'),
(204, '2025-12-16 19:47:29', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 9, '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"rejected\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:17:11\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:17:29\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1'),
(205, '2025-12-16 19:47:55', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 9, '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:17:29\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"rejected\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:17:55\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1'),
(206, '2025-12-16 19:48:08', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 9, '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"rejected\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:17:55\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"rejected\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:18:08\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1'),
(207, '2025-12-16 19:57:20', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 9, '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"rejected\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:18:08\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '{\"expense_id\":9,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217011600\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"me3\",\"expense_done_by\":\"me3\",\"expense_for\":\"me3\",\"description\":\"test3\",\"amount\":\"1000.00\",\"amount_in_words\":\"One Thousand Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-17 01:27:20\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:16:00\",\"updated_at\":\"2025-12-17 01:27:20\",\"payment_method\":\"upi\",\"cheque_details\":null,\"bill_image_path\":null}', '127.0.0.1'),
(208, '2025-12-16 20:06:02', NULL, 2, 'Saniya', 1, 'CREATE', 'expenses', 10, NULL, '{\"expense_id\":\"10\",\"voucher_no\":\"\",\"amount\":939,\"status\":\"pending\",\"paid_to\":\"Delivery Boy\"}', '127.0.0.1'),
(209, '2025-12-16 20:23:53', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 10, '{\"expense_id\":10,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217013602\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"Delivery Boy\",\"expense_done_by\":\"Reception\",\"expense_for\":\"Delivery\",\"description\":\"FOR DELIVERY OF REPORTS\",\"amount\":\"939.00\",\"amount_in_words\":\"Nine Hundred Thirty Nine Rupees Only\",\"status\":\"pending\",\"approved_by_user_id\":null,\"approved_by_employee_id\":null,\"approved_at\":null,\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:36:02\",\"updated_at\":\"2025-12-17 01:36:02\",\"payment_method\":\"cheque\",\"cheque_details\":\"BOI-12029\",\"bill_image_path\":null}', '{\"expense_id\":10,\"branch_id\":1,\"user_id\":2,\"employee_id\":2,\"voucher_no\":\"EXP-20251217013602\",\"expense_date\":\"2025-12-17\",\"paid_to\":\"Delivery Boy\",\"expense_done_by\":\"Reception\",\"expense_for\":\"Delivery\",\"description\":\"FOR DELIVERY OF REPORTS\",\"amount\":\"939.00\",\"amount_in_words\":\"Nine Hundred Thirty Nine Rupees Only\",\"status\":\"approved\",\"approved_by_user_id\":1,\"approved_by_employee_id\":null,\"approved_at\":\"2025-12-17 01:53:53\",\"authorized_by_user_id\":null,\"authorized_by_employee_id\":null,\"created_at\":\"2025-12-17 01:36:02\",\"updated_at\":\"2025-12-17 01:53:53\",\"payment_method\":\"cheque\",\"cheque_details\":\"BOI-12029\",\"bill_image_path\":null}', '127.0.0.1'),
(210, '2025-12-17 09:06:15', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 29, NULL, '{\"patient_name\":\"Ishan Mishra\",\"phone_number\":\"737437333\",\"new_patient_uid\":\"2512171\",\"master_patient_id\":\"28\",\"consultation_amount\":600}', '127.0.0.1'),
(211, '2025-12-17 09:06:49', NULL, 2, 'Saniya', 1, 'CREATE', 'patients', 16, NULL, '{\"service_type\":\"physio\",\"total_amount\":600}', '127.0.0.1'),
(212, '2025-12-17 09:07:50', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 3, NULL, '{\"token_uid\":\"T251217-01\",\"patient_id\":16}', '127.0.0.1'),
(213, '2025-12-17 12:22:24', NULL, 1, 'Pranav', 1, 'CREATE', 'employees', 10, NULL, '{\":first_name\":\"Aditya\",\":last_name\":\"Singh\",\":job_title\":\"Consultant\",\":phone_number\":\"9191919282\",\":address\":\"Noida\",\":date_of_joining\":\"2025-12-01\",\":email\":\"aditya@prospine.in\",\":role_id\":2,\":branch_id\":2,\":is_active\":1}', '127.0.0.1'),
(214, '2025-12-17 12:26:13', NULL, 2, 'Saniya', 1, 'UPDATE', 'tests', 7, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(215, '2025-12-17 16:09:23', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 4, NULL, '{\"token_uid\":\"T251217-02\",\"patient_id\":15}', '127.0.0.1'),
(216, '2025-12-17 16:11:54', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 5, NULL, '{\"token_uid\":\"T251217-03\",\"patient_id\":14}', '127.0.0.1'),
(217, '2025-12-17 16:17:52', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 6, NULL, '{\"token_uid\":\"T251217-04\",\"patient_id\":13}', '127.0.0.1'),
(218, '2025-12-17 16:42:08', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(220, '2025-12-17 18:19:03', NULL, 12, 'Sumit', 5, 'UPDATE', 'employees', 12, NULL, '{\":first_name\":\"Sumit\",\":last_name\":\"Sinha\",\":job_title\":null,\":phone_number\":\"7729127781\",\":address\":null,\":date_of_joining\":\"2025-12-17\",\":is_active\":1,\":email\":\"sumitsinha@prospine.in\",\":role_id\":1,\":branch_id\":5,\":employee_id\":12}', '127.0.0.1'),
(222, '2025-12-18 18:01:26', NULL, 2, 'Saniya', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(223, '2025-12-18 18:05:29', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 7, NULL, '{\"token_uid\":\"T251218-01\",\"patient_id\":16}', '127.0.0.1'),
(224, '2025-12-18 20:15:27', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 8, NULL, '{\"token_uid\":\"T251219-01\",\"patient_id\":15}', '127.0.0.1'),
(225, '2025-12-18 20:21:37', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 9, NULL, '{\"token_uid\":\"T251219-02\",\"patient_id\":13}', '127.0.0.1'),
(226, '2025-12-18 20:23:06', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 10, NULL, '{\"token_uid\":\"T251219-03\",\"patient_id\":10}', '127.0.0.1'),
(227, '2025-12-18 20:24:07', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 11, NULL, '{\"token_uid\":\"T251219-04\",\"patient_id\":9}', '127.0.0.1'),
(228, '2025-12-18 20:33:44', NULL, 2, 'Saniya', 1, 'CREATE', 'tokens', 12, NULL, '{\"token_uid\":\"T251219-05\",\"patient_id\":16}', '127.0.0.1'),
(229, '2025-12-19 14:47:22', NULL, 2, 'Saniya', 1, 'CREATE', 'registration', 30, NULL, '{\"patient_name\":\"test\",\"phone_number\":\"8929928829\",\"new_patient_uid\":\"2512191\",\"master_patient_id\":\"31\",\"consultation_amount\":600}', '127.0.0.1'),
(230, '2025-12-19 19:05:44', NULL, 1, 'Pranav', 1, 'CREATE', 'employees', 13, NULL, '{\":first_name\":\"Test\",\":last_name\":\"testing2\",\":job_title\":null,\":phone_number\":null,\":address\":null,\":date_of_joining\":\"2025-12-19\",\":email\":\"test@prospine.in\",\":role_id\":2,\":branch_id\":5,\":is_active\":1}', '127.0.0.1'),
(231, '2025-12-19 19:06:23', NULL, 1, 'Pranav', 1, 'UPDATE', 'employees', 13, NULL, '{\":first_name\":\"Test\",\":last_name\":\"testing2\",\":job_title\":null,\":phone_number\":null,\":address\":null,\":date_of_joining\":\"2025-12-19\",\":is_active\":1,\":email\":\"test@prospine.in\",\":role_id\":2,\":branch_id\":2,\":employee_id\":13}', '127.0.0.1'),
(232, '2025-12-19 19:20:35', NULL, 2, 'Saniya', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(233, '2025-12-19 23:05:08', NULL, 2, 'Saniya', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(234, '2025-12-25 08:40:24', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 13, NULL, '{\"token_uid\":\"T251225-01\",\"patient_id\":16}', '127.0.0.1'),
(235, '2025-12-25 09:19:54', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 14, NULL, '{\"token_uid\":\"T251225-02\",\"patient_id\":15}', '127.0.0.1'),
(236, '2025-12-25 09:30:40', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 15, NULL, '{\"token_uid\":\"T251225-03\",\"patient_id\":12}', '127.0.0.1'),
(237, '2025-12-25 09:33:07', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 16, NULL, '{\"token_uid\":\"T251225-04\",\"patient_id\":13}', '127.0.0.1'),
(238, '2025-12-25 09:35:31', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 17, NULL, '{\"token_uid\":\"T251225-05\",\"patient_id\":14}', '127.0.0.1'),
(239, '2025-12-25 09:42:50', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 18, NULL, '{\"token_uid\":\"T251225-06\",\"patient_id\":11}', '127.0.0.1'),
(240, '2025-12-25 09:59:22', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 19, NULL, '{\"token_uid\":\"T251225-07\",\"patient_id\":10}', '127.0.0.1'),
(241, '2025-12-25 10:02:51', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 20, NULL, '{\"token_uid\":\"T251225-08\",\"patient_id\":9}', '127.0.0.1'),
(242, '2025-12-25 10:05:02', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 21, NULL, '{\"token_uid\":\"T251225-09\",\"patient_id\":8}', '127.0.0.1'),
(243, '2025-12-31 17:13:57', NULL, 1, 'Pranav', 1, 'CREATE', 'tokens', 22, NULL, '{\"token_uid\":\"T251231-01\",\"patient_id\":16}', '127.0.0.1'),
(244, '2026-01-01 10:47:51', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(245, '2026-01-01 11:26:50', NULL, 1, 'Pranav', 1, 'CREATE', 'tokens', 23, NULL, '{\"token_uid\":\"T260101-01\",\"patient_id\":16}', '127.0.0.1'),
(246, '2026-01-02 10:08:24', NULL, 1, 'Pranav', 1, 'CREATE', 'tests', 24, NULL, '{\"patient_name\":\"Sumit\",\"test_uid\":\"26010201\",\"test_names\":[\"eeg\",\"ncv\"],\"total_amount\":4000,\"discount\":500,\"payment_status\":\"partial\"}', '127.0.0.1'),
(247, '2026-01-02 10:09:13', NULL, 1, 'Pranav', 1, 'UPDATE', 'test_items', 32, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(248, '2026-01-02 10:09:20', NULL, 1, 'Pranav', 1, 'UPDATE', 'test_items', 33, '{\"test_status\":\"previous\"}', '{\"test_status\":\"completed\"}', '127.0.0.1'),
(249, '2026-01-02 10:09:31', NULL, 1, 'Pranav', 1, 'UPDATE', 'test_items', 33, '{\"paid\":500}', '{\"new_due\":0,\"payment_status\":\"paid\"}', '127.0.0.1'),
(250, '2026-01-02 10:11:15', NULL, 1, 'Pranav', 1, 'CREATE', 'patient_appointments', 170, NULL, '{\"patient_id\":13,\"date\":\"2026-01-02\",\"time\":\"09:00:00\",\"service\":\"physio\"}', '127.0.0.1'),
(251, '2026-01-02 10:15:29', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(252, '2026-01-04 16:03:14', NULL, 2, 'Saniyas', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(253, '2026-01-04 16:21:14', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 5, NULL, '{\"amount\":20000}', '127.0.0.1'),
(254, '2026-01-04 16:21:24', NULL, 1, 'Pranav', 1, 'UPDATE', 'expenses', 4, NULL, '{\"amount\":5000}', '127.0.0.1'),
(255, '2026-01-04 16:35:37', NULL, 1, 'Pranav', 1, 'UPDATE', 'registration', 9, NULL, '{\"rescheduled_to\":\"2026-01-04 09:00\"}', '127.0.0.1'),
(256, '2026-01-04 17:11:24', NULL, 1, 'Pranav', 1, 'CREATE', 'expenses', 11, NULL, '{\"amount\":100}', '127.0.0.1'),
(257, '2026-01-04 17:13:16', NULL, 1, 'Pranav', 1, 'CREATE', 'expenses', 12, NULL, '{\"amount\":100}', '127.0.0.1'),
(258, '2026-01-04 17:16:22', NULL, 1, 'Pranav', 1, 'CREATE', 'patients', 17, NULL, '{\"service_type\":\"physio\",\"total_amount\":750}', '127.0.0.1'),
(259, '2026-01-05 06:34:39', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(260, '2026-01-05 06:37:44', NULL, 2, 'Saniyas', 1, 'CREATE', 'registration', 32, NULL, '{\"patient_name\":\"test\",\"phone_number\":\"1234567890\",\"new_patient_uid\":\"2601051\",\"master_patient_id\":\"33\",\"consultation_amount\":600}', '127.0.0.1'),
(261, '2026-01-05 18:03:05', NULL, 2, 'Saniyas', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(262, '2026-01-06 16:49:40', NULL, 1, 'Pranav', 1, 'CREATE', 'expenses', 13, NULL, '{\"amount\":1}', '127.0.0.1'),
(263, '2026-01-06 18:02:10', NULL, 1, 'Pranav', 1, 'DELETE', 'expenses', 11, NULL, '{\"amount\":\"100.00\"}', '127.0.0.1'),
(264, '2026-01-06 18:02:18', NULL, 1, 'Pranav', 1, 'DELETE', 'expenses', 13, NULL, '{\"amount\":\"1.00\"}', '127.0.0.1'),
(265, '2026-01-11 16:24:00', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 24, NULL, '{\"token_uid\":\"T260111-01\",\"patient_id\":15}', '127.0.0.1'),
(266, '2026-01-11 16:24:09', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 25, NULL, '{\"token_uid\":\"T260111-02\",\"patient_id\":16}', '127.0.0.1'),
(267, '2026-01-11 16:27:21', NULL, 2, 'Saniyas', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(268, '2026-01-11 16:42:58', NULL, 1, 'Pranav', 1, 'CREATE', 'tokens', 26, NULL, '{\"token_uid\":\"T260111-03\",\"patient_id\":17}', '127.0.0.1'),
(269, '2026-01-11 17:08:17', NULL, 1, 'Pranav', 1, 'CREATE', 'expenses', 14, NULL, '{\"amount\":100}', '127.0.0.1'),
(270, '2026-01-14 12:26:10', NULL, 2, 'Saniyas', 1, 'CREATE', 'tests', 25, NULL, '{\"patient_name\":\"test\",\"test_uid\":\"26011401\",\"test_names\":[\"ncv\",\"bera\"],\"total_amount\":4200,\"discount\":200,\"payment_status\":\"paid\"}', '127.0.0.1'),
(271, '2026-01-18 07:35:15', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 27, NULL, '{\"token_uid\":\"T260118-01\",\"patient_id\":10}', '127.0.0.1'),
(272, '2026-01-18 14:50:06', NULL, 2, 'Saniyas', 1, 'CREATE', 'registration', 33, NULL, '{\"patient_name\":\"Ravi\",\"phone_number\":\"1111111111\",\"new_patient_uid\":\"2601181\",\"master_patient_id\":\"34\",\"consultation_amount\":750}', '127.0.0.1'),
(273, '2026-01-18 14:50:55', NULL, 2, 'Saniyas', 1, 'CREATE', 'patients', 20, NULL, '{\"service_type\":\"physio\",\"total_amount\":5000}', '127.0.0.1'),
(274, '2026-01-18 23:05:56', NULL, 2, 'Saniyas', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(275, '2026-01-20 00:10:34', NULL, 2, 'Saniyas', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(276, '2026-01-20 01:21:28', NULL, 1, 'Pranav', 1, 'LOGOUT', NULL, NULL, NULL, NULL, '127.0.0.1'),
(277, '2026-01-30 10:46:18', NULL, 2, 'saniyas', NULL, 'webapp_login_success', 'auth', NULL, NULL, '{\"success\":true,\"user_agent\":\"Mozilla\\/5.0 (X11; Linux x86_64; rv:147.0) Gecko\\/20100101 Firefox\\/147.0\",\"timestamp\":\"2026-01-30 16:16:18\",\"role\":\"reception\",\"branch_id\":1,\"login_type\":\"standard\"}', '127.0.0.1'),
(278, '2026-01-30 14:27:44', NULL, NULL, 'saniya', NULL, 'webapp_login_failed', 'auth', NULL, NULL, '{\"success\":false,\"user_agent\":\"Mozilla\\/5.0 (X11; Linux x86_64; rv:147.0) Gecko\\/20100101 Firefox\\/147.0\",\"timestamp\":\"2026-01-30 19:57:44\",\"reason\":\"invalid_credentials\",\"attempt_count\":1,\"locked\":false}', '127.0.0.1'),
(279, '2026-01-30 14:27:46', NULL, 2, 'saniyas', NULL, 'webapp_login_success', 'auth', NULL, NULL, '{\"success\":true,\"user_agent\":\"Mozilla\\/5.0 (X11; Linux x86_64; rv:147.0) Gecko\\/20100101 Firefox\\/147.0\",\"timestamp\":\"2026-01-30 19:57:46\",\"role\":\"reception\",\"branch_id\":1,\"login_type\":\"standard\"}', '127.0.0.1'),
(280, '2026-01-30 14:28:20', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 29, NULL, '{\"token_uid\":\"T260130-02\",\"patient_id\":20}', '127.0.0.1'),
(281, '2026-01-30 14:45:29', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 31, NULL, '{\"token_uid\":\"T260130-04\",\"patient_id\":19}', '127.0.0.1'),
(282, '2026-01-30 14:45:50', NULL, 2, 'Saniyas', 1, 'CREATE', 'tokens', 32, NULL, '{\"token_uid\":\"T260130-05\",\"patient_id\":17}', '127.0.0.1'),
(283, '2026-01-31 04:26:33', NULL, 2, 'saniyas', NULL, 'webapp_login_success', 'auth', NULL, NULL, '{\"success\":true,\"user_agent\":\"Mozilla\\/5.0 (X11; Linux x86_64; rv:147.0) Gecko\\/20100101 Firefox\\/147.0\",\"timestamp\":\"2026-01-31 09:56:33\",\"role\":\"reception\",\"branch_id\":1,\"login_type\":\"standard\"}', '127.0.0.1');

-- --------------------------------------------------------

--
-- Table structure for table `blocked_ips`
--

CREATE TABLE `blocked_ips` (
  `id` int(11) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `reason` text DEFAULT NULL,
  `blocked_by` varchar(100) DEFAULT NULL,
  `blocked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `branch_id` int(11) NOT NULL,
  `branch_name` varchar(100) NOT NULL COMMENT 'Short name for display in UI (e.g., Siliguri)',
  `clinic_name` varchar(255) NOT NULL COMMENT 'The full legal or display name of the clinic',
  `address_line_1` varchar(255) DEFAULT NULL,
  `address_line_2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `phone_primary` varchar(20) DEFAULT NULL,
  `phone_secondary` varchar(100) DEFAULT NULL COMMENT 'Can store multiple numbers, comma-separated',
  `email` varchar(120) DEFAULT NULL,
  `logo_primary_path` varchar(255) DEFAULT NULL COMMENT 'e.g., /assets/logos/prospine_logo.png',
  `logo_secondary_path` varchar(255) DEFAULT NULL COMMENT 'e.g., /assets/logos/manipal_logo.png',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Allows deactivating a branch instead of deleting',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `admin_employee_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`branch_id`, `branch_name`, `clinic_name`, `address_line_1`, `address_line_2`, `city`, `state`, `pincode`, `phone_primary`, `phone_secondary`, `email`, `logo_primary_path`, `logo_secondary_path`, `is_active`, `created_at`, `admin_employee_id`, `created_by`) VALUES
(1, 'ProSpine', 'Prospine', 'Swami Vivika Nand Road', '', 'Bhagalpur', 'Bihar', '812002', '+91-8002910021', '', 'prospine33@gmail.com', 'uploads/logos/branch_2_primary_1764637494.png', 'uploads/logos/branch_1_secondary_1765911594.jpg', 1, '2025-12-02 00:35:09', 1, 1),
(2, 'Manipal', 'Manipal Physio', 'Aadampur Chowk', 'Near Manali Chowk', 'Bhagalpur', 'Bihar', '812002', '9123217818', '', '', 'uploads/logos/branch_4_primary_1765912878.png', 'uploads/logos/branch_2_secondary_1766176503.png', 1, '2025-12-16 19:20:44', 1, 1),
(5, 'Main Branch', 'CareSyncOS', 'Dhankaur', '', 'Noida', 'Uttar Pradesh', '812002', '8781239878', '', 'caresyncos@gmail.com', 'uploads/logos/logo_5_1765991854_icon.png', '', 1, '2025-12-17 17:12:52', 12, 1);

-- --------------------------------------------------------

--
-- Table structure for table `branch_budgets`
--

CREATE TABLE `branch_budgets` (
  `id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `daily_budget_amount` decimal(10,2) NOT NULL,
  `effective_from_date` date NOT NULL,
  `created_by_user_id` int(11) DEFAULT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `branch_budgets`
--

INSERT INTO `branch_budgets` (`id`, `branch_id`, `daily_budget_amount`, `effective_from_date`, `created_by_user_id`, `created_by_employee_id`, `created_at`) VALUES
(3, 1, 1000.00, '2025-12-01', 1, 1, '2025-12-16 19:08:23');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `message_id` bigint(20) UNSIGNED NOT NULL,
  `sender_employee_id` int(11) DEFAULT NULL,
  `receiver_employee_id` int(11) DEFAULT NULL,
  `message_type` varchar(20) NOT NULL DEFAULT 'text' COMMENT 'Type of message: text, image, pdf, doc',
  `message_text` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`message_id`, `sender_employee_id`, `receiver_employee_id`, `message_type`, `message_text`, `is_read`, `created_at`) VALUES
(98, 2, 3, 'text', 'VeS7oHhk/jG03WzXEe/7Og==:R1NPaC82aFNqc3JMWDMvSlF2dnNidz09', 0, '2025-12-24 16:57:27'),
(99, 2, 3, 'image', 'admin/desktop/server/uploads/chat_uploads/694c1e8b43556-Beach-Dark.png', 0, '2025-12-24 17:10:35'),
(100, 2, 3, 'text', '2EAQw2Sz+1TcZIybXGfnbQ==:NkVVc1M1YWFIRHpqUXcvYUhoNlB0UT09', 0, '2026-01-07 01:23:54'),
(101, 2, 1, 'text', 'WViMG5AkYsNt4AEoXi1GZg==:dVRYSE9iWW10VnpEbVZzdDZncCtLUT09', 1, '2026-01-19 23:50:01'),
(102, 2, 1, 'text', 'qhtjWjuCjpsRhJG6r+aRrg==:NnM1R3JSaklzZXg3bFBCQnhxaFNTZz09', 1, '2026-01-19 23:50:30'),
(103, 2, 1, 'text', 'OerQK61JkEF1oLPFxfC2Qw==:MEpqN1RNczVUVkUwaDNSNE9KZmprQT09', 1, '2026-01-19 23:53:06'),
(104, 2, 1, 'text', '2Q10GVJUDPqLBiuIpN1WVA==:UzFrdnJ5SHBTZElQZWVOaGZ6aUZ3UT09', 1, '2026-01-19 23:59:03'),
(105, 2, 1, 'text', 'hshN9G0mXr3BvCA3WhmpqQ==:NVBaZms0Nks3S3B2eUtWWWplRTZPZz09', 1, '2026-01-20 00:02:21'),
(106, 2, 1, 'text', 'DAQv+1aQQYvb6Xqj31r0Bw==:OUdhL0UzVy9tQ0I1VnlBbmw4TVFKZz09', 1, '2026-01-20 00:02:48'),
(107, 2, 1, 'text', 'g0WdRbK0q322UywRlwf8AA==:bG1UVC9sZzk0WUdDMUV6eVhOazA1Zz09', 1, '2026-01-20 00:02:57'),
(108, 1, 2, 'text', 'dK3OlqvJoXjI1nNSmItQcQ==:NzEvMW5jUk1NckYxR1ppQjYzRHdoZz09', 1, '2026-01-20 00:10:50'),
(109, 1, 2, 'text', '6AB4td1v7zOKlIyIG2bA5g==:dnNlTkNmdkxwRGd3dWRKUzJWcFhPUT09', 1, '2026-01-20 00:19:16'),
(110, 2, 3, 'text', 'LPL/+di3G5h9sWPE3sHrXg==:M0x0YkRUODJ4ZlF3bXFGNEpQODlQZz09', 0, '2026-01-30 07:05:47'),
(111, 2, 1, 'text', 'f5POib8tC1S182G8wurpzA==:Y2s4b0NrM2h3dnNNNTRVbWduNEdydz09', 0, '2026-01-30 07:06:51');

-- --------------------------------------------------------

--
-- Table structure for table `chief_complaints`
--

CREATE TABLE `chief_complaints` (
  `complaint_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `complaint_name` varchar(100) NOT NULL,
  `complaint_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chief_complaints`
--

INSERT INTO `chief_complaints` (`complaint_id`, `branch_id`, `complaint_name`, `complaint_code`, `is_active`, `display_order`, `created_at`) VALUES
(61, 1, 'Neck Pains', 'neck_pain', 0, 2, '2025-12-17 21:24:37'),
(62, 1, 'Back Pain', 'back_pain', 1, 5, '2025-12-17 21:24:37'),
(63, 1, 'Low Back Pain', 'low_back_pain', 1, 6, '2025-12-17 21:24:37'),
(64, 1, 'Radiating Pain', 'radiating_pain', 1, 3, '2025-12-17 21:24:37'),
(65, 1, 'Other', 'other', 0, 7, '2025-12-17 21:24:37'),
(66, 2, 'Neck Pain', 'neck_pain', 1, 1, '2025-12-17 21:24:37'),
(67, 2, 'Back Pain', 'back_pain', 1, 2, '2025-12-17 21:24:37'),
(68, 2, 'Low Back Pain', 'low_back_pain', 1, 3, '2025-12-17 21:24:37'),
(69, 2, 'Radiating Pain', 'radiating_pain', 1, 4, '2025-12-17 21:24:37'),
(70, 2, 'Other', 'other', 1, 5, '2025-12-17 21:24:37'),
(71, 5, 'Neck Pain', 'neck_pain', 1, 1, '2025-12-17 21:24:37'),
(72, 5, 'Back Pain', 'back_pain', 1, 2, '2025-12-17 21:24:37'),
(73, 5, 'Low Back Pain', 'low_back_pain', 1, 3, '2025-12-17 21:24:37'),
(74, 5, 'Radiating Pain', 'radiating_pain', 1, 4, '2025-12-17 21:24:37'),
(75, 5, 'Other', 'other', 1, 5, '2025-12-17 21:24:37'),
(76, 1, 'Testing', 'test', 1, 4, '2025-12-19 15:29:27'),
(78, 1, 'Leg Pain', 'leg_pain', 1, 1, '2025-12-19 18:48:54');

-- --------------------------------------------------------

--
-- Table structure for table `clinic_settings`
--

CREATE TABLE `clinic_settings` (
  `setting_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clinic_settings`
--

INSERT INTO `clinic_settings` (`setting_id`, `branch_id`, `setting_key`, `setting_value`, `updated_at`) VALUES
(1, 5, 'consultation_fee', '600', '2025-12-17 17:17:34'),
(2, 5, 'currency_symbol', '₹', '2025-12-17 17:17:34'),
(3, 5, 'appointment_start_time', '09:00', '2025-12-17 17:17:34'),
(4, 5, 'appointment_end_time', '18:00', '2025-12-17 17:17:34'),
(5, 1, 'consultation_fee', '600', '2025-12-17 19:35:15'),
(6, 1, 'currency_symbol', '₹', '2025-12-17 19:35:15'),
(7, 1, 'appointment_start_time', '09:00', '2025-12-17 19:35:15'),
(8, 1, 'appointment_end_time', '18:00', '2025-12-17 19:35:15');

-- --------------------------------------------------------

--
-- Table structure for table `consultation_types`
--

CREATE TABLE `consultation_types` (
  `consultation_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `consultation_name` varchar(100) NOT NULL,
  `consultation_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consultation_types`
--

INSERT INTO `consultation_types` (`consultation_id`, `branch_id`, `consultation_name`, `consultation_code`, `is_active`, `display_order`, `created_at`) VALUES
(1, 1, 'In-Clinic', 'in_clinic', 1, 1, '2025-12-17 21:24:37'),
(2, 1, 'Speech Therapy', 'speech_therapy', 1, 2, '2025-12-17 21:24:37'),
(3, 1, 'Home Visit', 'home_visit', 1, 3, '2025-12-17 21:24:37'),
(4, 1, 'Virtual/Online', 'online', 1, 4, '2025-12-17 21:24:37'),
(5, 2, 'In-Clinic', 'in_clinic', 1, 1, '2025-12-17 21:24:37'),
(6, 2, 'Speech Therapy', 'speech_therapy', 1, 2, '2025-12-17 21:24:37'),
(7, 2, 'Home Visit', 'home_visit', 1, 3, '2025-12-17 21:24:37'),
(8, 2, 'Virtual/Online', 'online', 1, 4, '2025-12-17 21:24:37'),
(9, 5, 'In-Clinic', 'in_clinic', 1, 1, '2025-12-17 21:24:37'),
(10, 5, 'Speech Therapy', 'speech_therapy', 1, 2, '2025-12-17 21:24:37'),
(11, 5, 'Home Visit', 'home_visit', 1, 3, '2025-12-17 21:24:37'),
(12, 5, 'Virtual/Online', 'online', 1, 4, '2025-12-17 21:24:37');

-- --------------------------------------------------------

--
-- Table structure for table `daily_patient_counter`
--

CREATE TABLE `daily_patient_counter` (
  `entry_date` date NOT NULL,
  `counter` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `daily_patient_counter`
--

INSERT INTO `daily_patient_counter` (`entry_date`, `counter`) VALUES
('2025-12-02', 20),
('2025-12-05', 1),
('2025-12-06', 1),
('2025-12-07', 1),
('2025-12-10', 2),
('2025-12-11', 1),
('2025-12-13', 1),
('2025-12-15', 1),
('2025-12-17', 1),
('2025-12-19', 1),
('2025-12-24', 1),
('2026-01-05', 1),
('2026-01-18', 1),
('2026-01-23', 1),
('2026-01-30', 1);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `branch_id`, `department_name`, `description`, `is_active`, `created_at`) VALUES
(1, 5, 'Physiotherapy', NULL, 1, '2025-12-17 17:17:34'),
(2, 5, 'Speech Therapy', NULL, 1, '2025-12-17 17:17:34'),
(3, 1, 'Physiotherapy', NULL, 1, '2025-12-17 19:35:15'),
(4, 1, 'Speech Therapy', NULL, 1, '2025-12-17 19:35:15');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `employee_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL COMMENT 'FK to branches table',
  `role_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL COMMENT 'The login email for the employee',
  `user_email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL COMMENT 'The hashed login password',
  `auth_version` int(11) DEFAULT 1,
  `address` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `date_of_joining` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`employee_id`, `user_id`, `branch_id`, `role_id`, `first_name`, `last_name`, `job_title`, `phone_number`, `email`, `user_email`, `password_hash`, `auth_version`, `address`, `date_of_birth`, `date_of_joining`, `is_active`, `photo_path`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'Pranav', 'Kumar', 'Administrator/Doctor', '800291002', 'pranav@prospine.in', NULL, '$2y$10$.Puey6MAzn3wxTCbW5tJ1.LE5B/zo/aqQTwlmFe3jLlm24FCdBh0y', 1, 'Bhagalpur', NULL, '2025-12-02', 1, 'uploads/employee_photo/emp_1_1765893846.jpg', '2025-12-02 00:35:09', '2026-01-20 18:02:23'),
(2, 2, 1, 2, 'Saniyas', 'Parween', 'Receptionist', '8833456892', 'saniya@prospine.in', NULL, '$2y$10$zzIRe1w9882wG.Dw.0pQUuPMZ6vxpO3oFOvP3Py4yggCHdKKY1V7K', 1, 'Bhagalpur', NULL, '2025-12-01', 1, 'uploads/profile_photos/emp_2_1764639676.jpg', '2025-12-02 01:32:18', '2025-12-24 14:52:01'),
(3, NULL, 1, 3, 'Sumit', 'Srivastava', 'Developer', '7739028861', 'sumit@prospine.in', NULL, '$2y$10$jLhwQ2ja6mdXm3uRwybKR.O24uAvJGMI5mJdsV5nJGejUZ7wbFsey', 1, 'Sarai Bhagalpur', NULL, '2025-12-01', 1, 'uploads/profile_photos/emp_2_1764639676.jpg', '2025-12-02 12:17:11', '2026-01-20 18:02:23'),
(12, NULL, 5, 1, 'Sumit', 'Sinha', NULL, '7729127781', 'sumitsinha@prospine.in', 'srisumit4@gmail.com', '$2y$12$RdvB316bAv90nT3qpyiaUO6lXaR8.G7dVHlUQ2glYy9eMYiY6jO2W', 1, NULL, NULL, '2025-12-17', 1, 'uploads/employee_photo/emp_12_1765991877.png', '2025-12-17 17:12:52', '2025-12-17 18:19:03'),
(13, NULL, 2, 2, 'Test', 'testing2', NULL, NULL, 'test@prospine.in', NULL, '$2y$12$aCSO25Axy.Y0f8N62m.T4.XIVg./UBfQSHJP2sAJxgena7lClC2Am', 1, NULL, NULL, '2025-12-19', 1, NULL, '2025-12-19 19:05:44', '2025-12-19 19:06:23'),
(14, NULL, 1, 2, 'Test', 'User', NULL, NULL, 'test@example.com', 'test@example.com', '$2y$12$awyD.2CWOOu4dTIEiech9u953E2PUvuLXU5WusvGuZurkNJcTnBp.', 1, NULL, NULL, '2026-01-07', 1, NULL, '2026-01-06 20:49:12', '2026-01-06 20:56:39');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expense_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `voucher_no` varchar(50) NOT NULL,
  `manual_voucher_no` varchar(50) DEFAULT NULL,
  `expense_date` date NOT NULL,
  `paid_to` varchar(255) NOT NULL,
  `expense_done_by` varchar(100) DEFAULT NULL COMMENT 'Name of person who did the expense',
  `expense_for` varchar(100) DEFAULT NULL COMMENT 'Purpose of the expense, e.g., Office, Marketing',
  `description` text NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `amount_in_words` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
  `approved_by_user_id` int(11) DEFAULT 1,
  `approved_by_employee_id` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `authorized_by_user_id` int(11) DEFAULT NULL COMMENT '\r\n',
  `authorized_by_employee_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_method` varchar(50) DEFAULT NULL,
  `cheque_details` varchar(255) DEFAULT NULL,
  `bill_image_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`expense_id`, `branch_id`, `user_id`, `employee_id`, `voucher_no`, `manual_voucher_no`, `expense_date`, `paid_to`, `expense_done_by`, `expense_for`, `description`, `amount`, `amount_in_words`, `status`, `approved_by_user_id`, `approved_by_employee_id`, `approved_at`, `authorized_by_user_id`, `authorized_by_employee_id`, `created_at`, `updated_at`, `payment_method`, `cheque_details`, `bill_image_path`) VALUES
(1, 1, 2, NULL, '', NULL, '2025-12-07', 'test', 'test', 'test', '', 1000.00, 'One Thousand Rupees Only', 'approved', 1, NULL, '2025-12-15 12:24:46', NULL, NULL, '2025-12-06 19:55:02', '2025-12-15 12:24:46', 'cash', NULL, NULL),
(2, 1, 2, NULL, 'EXP-1765051182-6068', NULL, '2025-12-07', 'test2', 'test2', 'test2', '', 2000.00, 'Two Thousand Rupees Only', 'approved', 1, NULL, '2025-12-15 12:24:43', NULL, NULL, '2025-12-06 19:59:42', '2025-12-15 12:24:43', 'cash', NULL, NULL),
(3, 1, 2, NULL, 'EXP-20251207013058', NULL, '2025-12-07', 'test3', 'test3', 'test3', '', 1200.00, 'One Thousand Two Hundred Rupees Only', 'approved', 1, NULL, '2025-12-16 17:45:44', NULL, NULL, '2025-12-06 20:00:58', '2025-12-16 17:46:15', 'cash', NULL, 'uploads/expenses/expense_3_1765907175.png'),
(4, 1, 1, 1, 'ADM-EXP-69419CA2143AE', '1', '2025-12-16', 'Saniya', 'Pranav', 'Salary', '', 5000.00, 'Rupees 5,000.00 Only', 'approved', 1, NULL, '2025-12-16 17:53:38', NULL, NULL, '2025-12-16 17:53:38', '2026-01-04 16:21:24', 'cash', NULL, NULL),
(5, 1, 1, 1, 'ADM-EXP-6941A56099161', '2', '2025-12-17', 'ME', 'Pranav', 'Maintenance', 'REPAIR IN STAIRS', 20000.00, 'Rupees 20,000.00 Only', 'approved', 1, NULL, '2025-12-16 18:30:56', NULL, NULL, '2025-12-16 18:30:56', '2026-01-04 16:24:55', 'cheque', 'HDFC-12345', 'uploads/expenses/admin_exp_5_1767543895.png'),
(6, 1, 2, 2, 'EXP-20251217004059', NULL, '2025-12-17', 'me', 'me', 'me', 'test', 500.00, 'Five Hundred Rupees Only', 'approved', 1, NULL, '2025-12-16 19:11:17', NULL, NULL, '2025-12-16 19:10:59', '2025-12-16 19:11:17', 'upi', NULL, NULL),
(8, 1, 2, 2, 'EXP-20251217010753', NULL, '2025-12-17', 'me2', 'me2', 'me2', 'test2', 800.00, 'Eight Hundred Rupees Only', 'approved', NULL, NULL, '2025-12-16 19:37:53', NULL, NULL, '2025-12-16 19:37:53', '2025-12-16 19:37:53', 'cash', NULL, NULL),
(9, 1, 2, 2, 'EXP-20251217011600', NULL, '2025-12-17', 'me3', 'me3', 'me3', 'test3', 1000.00, 'One Thousand Rupees Only', 'approved', 1, NULL, '2025-12-16 19:57:20', NULL, NULL, '2025-12-16 19:46:00', '2025-12-16 19:57:20', 'upi', NULL, NULL),
(10, 1, 2, 2, 'EXP-20251217013602', NULL, '2025-12-17', 'Delivery Boy', 'Reception', 'Delivery', 'FOR DELIVERY OF REPORTS', 939.00, 'Nine Hundred Thirty Nine Rupees Only', 'approved', 1, NULL, '2025-12-16 20:23:53', NULL, NULL, '2025-12-16 20:06:02', '2025-12-16 20:23:53', 'cheque', 'BOI-12029', NULL),
(12, 1, 1, 1, 'ADM-EXP-695A9FAC7C830', '2', '2026-01-04', 'Self', 'Pranav', 'Personal', '', 100.00, 'Rupees 100.00 Only', 'approved', 1, NULL, '2026-01-04 17:13:16', NULL, NULL, '2026-01-04 17:13:16', '2026-01-04 17:13:16', 'cash', NULL, NULL),
(14, 1, 1, 1, 'PER-EXP-6963D90199E71', '1', '2026-01-11', 'Self', 'Pranav', 'Test', 'test', 100.00, 'Rupees 100.00 Only', 'approved', 1, NULL, '2026-01-11 17:08:17', NULL, NULL, '2026-01-11 17:08:17', '2026-01-11 17:08:17', 'cash', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`category_id`, `category_name`, `display_order`, `is_active`, `created_at`) VALUES
(4, 'Internet', 4, 1, '2026-01-05 18:35:37'),
(5, 'Maintenance', 5, 1, '2026-01-05 18:35:37'),
(6, 'Marketing', 6, 1, '2026-01-05 18:35:37'),
(7, 'Provisions', 7, 1, '2026-01-05 18:35:37'),
(8, 'Equipment', 8, 1, '2026-01-05 18:35:37'),
(9, 'Petty Cash', 9, 1, '2026-01-05 18:35:37'),
(10, 'Test', 0, 1, '2026-01-11 17:08:17');

-- --------------------------------------------------------

--
-- Table structure for table `inquiry_followups`
--

CREATE TABLE `inquiry_followups` (
  `followup_id` int(11) NOT NULL,
  `inquiry_id` int(11) NOT NULL,
  `inquiry_type` enum('consultation','test') NOT NULL,
  `branch_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `note` text DEFAULT NULL,
  `next_followup_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inquiry_followups`
--

INSERT INTO `inquiry_followups` (`followup_id`, `inquiry_id`, `inquiry_type`, `branch_id`, `employee_id`, `note`, `next_followup_date`, `created_at`) VALUES
(1, 2, 'consultation', 1, 2, 'test', '2026-01-23', '2026-01-22 23:11:20'),
(2, 2, 'consultation', 1, 2, 'one more test', '2026-01-24', '2026-01-22 23:14:29'),
(3, 2, 'test', 1, 2, 'testing', NULL, '2026-01-22 23:49:20'),
(10, 2, 'test', 1, 2, 'patients said will contact in few days, so i will contact tomorrow again', '2026-01-24', '2026-01-22 23:53:07'),
(11, 2, 'consultation', 1, 2, 'test2', NULL, '2026-01-22 23:53:58'),
(12, 2, 'consultation', 1, 2, 'test3', NULL, '2026-01-22 23:54:02'),
(13, 3, 'consultation', 1, 2, 'Testing', '2026-01-31', '2026-01-30 07:34:05'),
(14, 3, 'test', 1, 2, 'Re testing', '2026-01-31', '2026-01-30 07:34:36');

-- --------------------------------------------------------

--
-- Table structure for table `inquiry_service_types`
--

CREATE TABLE `inquiry_service_types` (
  `service_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `service_name` varchar(100) NOT NULL,
  `service_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inquiry_service_types`
--

INSERT INTO `inquiry_service_types` (`service_id`, `branch_id`, `service_name`, `service_code`, `is_active`, `display_order`, `created_at`) VALUES
(1, 1, 'Physio', 'physio', 1, 1, '2025-12-17 21:24:37'),
(2, 1, 'Speech Therapy', 'speech_therapy', 1, 2, '2025-12-17 21:24:37'),
(3, 2, 'Physio', 'physio', 1, 1, '2025-12-17 21:24:37'),
(4, 2, 'Speech Therapy', 'speech_therapy', 1, 2, '2025-12-17 21:24:37'),
(5, 5, 'Physio', 'physio', 1, 1, '2025-12-17 21:24:37'),
(6, 5, 'Speech Therapy', 'speech_therapy', 1, 2, '2025-12-17 21:24:37');

-- --------------------------------------------------------

--
-- Table structure for table `issue_attachments`
--

CREATE TABLE `issue_attachments` (
  `attachment_id` int(11) NOT NULL,
  `issue_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `issue_attachments`
--

INSERT INTO `issue_attachments` (`attachment_id`, `issue_id`, `file_path`, `uploaded_at`) VALUES
(1, 1, 'uploads/issues/1_6930829b2f63f.png', '2025-12-03 18:34:03'),
(2, 3, 'uploads/issues/3_693086652460e.png', '2025-12-03 18:50:13'),
(3, 3, 'uploads/issues/3_693086652496e.png', '2025-12-03 18:50:13'),
(4, 3, 'uploads/issues/3_6930866524d24.png', '2025-12-03 18:50:13'),
(5, 3, 'uploads/issues/3_6930866524e69.png', '2025-12-03 18:50:13');

-- --------------------------------------------------------

--
-- Table structure for table `job_applications`
--

CREATE TABLE `job_applications` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','reviewed','accepted','rejected') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `limb_types`
--

CREATE TABLE `limb_types` (
  `limb_type_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `limb_name` varchar(50) NOT NULL,
  `limb_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `limb_types`
--

INSERT INTO `limb_types` (`limb_type_id`, `branch_id`, `limb_name`, `limb_code`, `is_active`, `display_order`, `created_at`) VALUES
(1, 2, 'Upper Limbb', 'upper_limb', 1, 1, '2025-12-17 19:54:38'),
(2, 1, 'Upper Limb', 'upper_limb', 1, 2, '2025-12-17 19:54:38'),
(3, 5, 'Upper Limb', 'upper_limb', 1, 1, '2025-12-17 19:54:38'),
(4, 2, 'Lower Limb', 'lower_limb', 1, 2, '2025-12-17 19:54:38'),
(5, 1, 'Lower Limb', 'lower_limb', 0, 1, '2025-12-17 19:54:38'),
(6, 5, 'Lower Limb', 'lower_limb', 1, 2, '2025-12-17 19:54:38'),
(7, 2, 'Both Limbs', 'both', 1, 3, '2025-12-17 19:54:38'),
(8, 1, 'Both Limbs', 'both', 1, 3, '2025-12-17 19:54:38'),
(9, 5, 'Both Limbs', 'both', 1, 3, '2025-12-17 19:54:38'),
(10, 2, 'None', 'none', 1, 4, '2025-12-17 19:54:38'),
(11, 1, 'None', 'none', 1, 4, '2025-12-17 19:54:38'),
(12, 5, 'None', 'none', 1, 4, '2025-12-17 19:54:38');

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `ip` varbinary(16) NOT NULL,
  `attempt_count` int(11) NOT NULL DEFAULT 0,
  `last_attempt` timestamp NULL DEFAULT NULL,
  `locked_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `username`, `ip`, `attempt_count`, `last_attempt`, `locked_until`) VALUES
(1, 'admin', 0x9d313b78, 1, '2025-12-02 03:49:42', NULL),
(2, 'Reception', 0x24050201a41bf034f96d09501400cad2, 1, '2025-12-02 10:05:13', NULL),
(3, 'sania@prospine.in', 0x240940d2100fbab9ad0b0eece1989b3a, 1, '2025-12-02 16:12:12', NULL),
(4, 'admin', 0x240940d2100fbab9ad0b0eece1989b3a, 4, '2025-12-02 16:12:16', NULL),
(5, 'sumit', 0x7f000001, 3, '2026-01-18 23:06:19', NULL),
(6, 'pranav.demoacc.f0425c6c@prospine.in', 0x7f000001, 1, '2025-12-19 19:21:01', NULL),
(7, 'pranavdemo@acc.in', 0x7f000001, 1, '2025-12-19 19:21:51', NULL),
(8, 'Reception', 0x7f000001, 1, '2025-12-30 18:21:01', NULL),
(10, 'saniya', 0x7f000001, 1, '2026-01-30 14:27:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `branch_id` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `link_url` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `employee_id`, `created_by_employee_id`, `branch_id`, `message`, `link_url`, `is_read`, `created_at`) VALUES
(1, 3, 2, 1, 'New message from Saniya Parween', 'chat_with_employee_id:2', 0, '2025-12-04 07:47:05'),
(2, 3, 2, 1, 'New message from Saniya Parween', 'chat_with_employee_id:2', 0, '2025-12-06 09:02:52'),
(12, 3, NULL, 1, 'New high-value expense req: ₹1000 () at Saniya\'s branch.', 'manage_expenses.php?search=', 0, '2025-12-16 19:46:00'),
(14, 3, NULL, 1, 'New high-value expense req: ₹939 () at Saniya\'s branch.', 'manage_expenses.php?search=', 0, '2025-12-16 20:06:02'),
(16, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 20:40:44'),
(18, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 20:42:00'),
(20, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 20:46:50'),
(22, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:08:32'),
(24, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:11:12'),
(26, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:12:02'),
(28, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:12:52'),
(30, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:13:42'),
(32, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:14:32'),
(34, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:15:22'),
(36, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:18:04'),
(38, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:18:04'),
(40, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:18:20'),
(42, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:18:20'),
(44, 3, 2, 1, 'Attendance Approval Req: Patient #13 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:18:47'),
(46, 3, 2, 1, 'Attendance Approval Req: Patient #13 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:18:47'),
(48, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:20:01'),
(50, 3, 2, 1, 'Attendance Approval Req: Patient #13 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:20:24'),
(52, 3, 1, 1, 'Attendance Approval Req: Patient #11 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:23:44'),
(57, 3, 1, 1, 'Attendance Approval Req: Patient #8 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:34:29'),
(60, 3, 1, 1, 'Attendance Approval Req: Patient #3 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:44:13'),
(63, 3, 1, 1, 'Attendance Approval Req: Patient #2 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:49:18'),
(66, 3, 1, 1, 'Attendance Approval Req: Patient #3 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 21:56:15'),
(69, 3, 1, 1, 'Attendance Approval Req: Patient #8 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 22:20:43'),
(72, 3, 1, 1, 'Attendance Approval Req: Patient #7 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 22:25:20'),
(74, 3, 1, 1, 'Attendance Approval Req: Patient #5 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 22:26:11'),
(78, 3, 2, 1, 'Attendance Approval Req: Patient #13 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 22:38:04'),
(80, 3, 2, 1, 'Attendance Approval Req: Patient #4 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 22:38:11'),
(82, 3, 2, 1, 'Attendance Approval Req: Patient #1 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-16 22:38:19'),
(87, 3, 2, 1, 'Attendance Approval Req: Patient #16 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-17 09:07:08'),
(90, 3, 2, 1, 'Attendance Approval Req: Patient #4 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-17 15:43:29'),
(93, 3, 2, 1, 'Attendance Approval Req: Patient #16 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-18 18:03:15'),
(96, 3, 2, 1, 'Attendance Approval Req: Patient #14 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-18 18:52:54'),
(99, 3, 2, 1, 'Attendance Approval Req: Patient #16 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2025-12-19 18:55:15'),
(101, 3, 2, 1, 'Sent you a file (image)', 'chat_with_employee_id:2', 0, '2025-12-19 23:37:29'),
(104, 3, 2, 1, 'New message from Saniya Parween', 'chat_with_employee_id:2', 0, '2025-12-19 23:38:58'),
(105, 3, 2, 1, 'New message from Saniya Parween', 'chat_with_employee_id:2', 0, '2025-12-19 23:39:13'),
(106, 3, 2, 1, 'Sent you a file (image)', 'chat_with_employee_id:2', 0, '2025-12-19 23:39:28'),
(112, 2, 1, 1, 'Sent you a file (pdf)', 'chat_with_employee_id:1', 1, '2025-12-19 23:46:55'),
(113, 2, 1, 1, 'New message from Pranav Kumar', 'chat_with_employee_id:1', 1, '2025-12-19 23:47:11'),
(117, 2, 1, 1, 'Sent you a file (image)', 'chat_with_employee_id:1', 1, '2025-12-19 23:54:06'),
(118, 1, 2, 1, 'Sent you a file (pdf)', 'chat_with_employee_id:2', 1, '2025-12-19 23:54:51'),
(119, 1, 2, 1, 'Sent you a file (image)', 'chat_with_employee_id:2', 1, '2025-12-19 23:55:18'),
(120, 1, 2, 1, 'Sent you a file (image)', 'chat_with_employee_id:2', 1, '2025-12-19 23:59:22'),
(121, 1, 2, 1, 'Sent you a file (image)', 'chat_with_employee_id:2', 1, '2025-12-19 23:59:40'),
(122, 3, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 0, '2025-12-24 16:43:30'),
(123, 3, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 0, '2025-12-24 16:46:16'),
(124, 3, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 0, '2025-12-24 16:50:22'),
(125, 3, 2, 1, 'Sent you a file (image)', 'chat_with_employee_id:2', 0, '2025-12-24 16:54:49'),
(126, 3, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 0, '2025-12-24 16:57:27'),
(127, 3, 2, 1, 'Sent you a file (image)', 'chat_with_employee_id:2', 0, '2025-12-24 17:10:35'),
(128, 3, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 0, '2026-01-07 01:23:54'),
(129, 1, 2, 1, 'Attendance Approval Req: Patient #10 at Branch #1', 'manage_attendance.php?branch_id=1', 1, '2026-01-18 07:35:07'),
(130, 3, 2, 1, 'Attendance Approval Req: Patient #10 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2026-01-18 07:35:07'),
(131, 1, 2, 1, 'Attendance Approval Req: Patient #8 at Branch #1', 'manage_attendance.php?branch_id=1', 1, '2026-01-18 07:38:21'),
(132, 3, 2, 1, 'Attendance Approval Req: Patient #8 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2026-01-18 07:38:21'),
(134, 1, NULL, 1, 'Congratulations! Push notifications are now fixed.', '/admin/dashboard', 1, '2026-01-19 23:45:31'),
(135, 1, NULL, 1, 'Congratulations! You are now receiving push notifications.', '/admin/dashboard', 1, '2026-01-19 23:47:24'),
(136, 1, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 1, '2026-01-19 23:50:01'),
(137, 1, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 1, '2026-01-19 23:50:30'),
(138, 1, NULL, 1, 'Congratulations! You are now receiving push notifications.', '/admin/dashboard', 1, '2026-01-19 23:50:50'),
(139, 1, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 1, '2026-01-19 23:53:06'),
(140, 1, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 1, '2026-01-19 23:59:03'),
(141, 1, 2, 1, 'Attendance Approval Req: Patient #19 at Branch #1', 'manage_attendance.php?branch_id=1', 1, '2026-01-20 00:00:08'),
(142, 3, 2, 1, 'Attendance Approval Req: Patient #19 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2026-01-20 00:00:08'),
(143, 1, 2, 1, 'Attendance Approval Req: Patient #17 at Branch #1', 'manage_attendance.php?branch_id=1', 1, '2026-01-20 00:00:56'),
(144, 3, 2, 1, 'Attendance Approval Req: Patient #17 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2026-01-20 00:00:56'),
(145, 1, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 1, '2026-01-20 00:02:21'),
(146, 1, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 1, '2026-01-20 00:02:48'),
(147, 1, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 1, '2026-01-20 00:02:57'),
(148, 2, 1, 1, 'New message from Pranav Kumar', 'chat_with_employee_id:1', 1, '2026-01-20 00:10:50'),
(149, 2, 1, 1, 'Attendance Request for Sakshi was Approved', 'patients.php?search=17', 1, '2026-01-20 00:11:23'),
(150, 14, 1, 1, 'Attendance Request for Sakshi was Approved', 'patients.php?search=17', 0, '2026-01-20 00:11:23'),
(151, 2, 1, 1, 'New message from Pranav Kumar', 'chat_with_employee_id:1', 1, '2026-01-20 00:19:16'),
(152, 3, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 0, '2026-01-30 07:05:47'),
(153, 1, 2, 1, 'New message from Saniyas Parween', 'chat_with_employee_id:2', 0, '2026-01-30 07:06:51'),
(154, 1, 2, 1, 'Attendance Approval Req: Patient #4 at Branch #1', 'manage_attendance.php?branch_id=1', 0, '2026-01-30 14:59:39'),
(155, 1, 2, 1, 'Attendance Approval Req: Patient #13', 'manage_attendance.php?branch_id=1', 0, '2026-01-30 15:43:13');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` int(11) NOT NULL,
  `master_patient_id` bigint(20) UNSIGNED DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `registration_id` int(11) DEFAULT NULL,
  `service_track_id` int(11) DEFAULT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `assigned_doctor` varchar(255) NOT NULL DEFAULT 'Not Assigned',
  `service_type` varchar(50) NOT NULL DEFAULT 'physio' COMMENT 'e.g., physio, speech_therapy',
  `treatment_type` varchar(100) NOT NULL,
  `treatment_cost_per_day` decimal(10,2) DEFAULT NULL,
  `package_cost` decimal(10,2) DEFAULT NULL,
  `treatment_days` int(11) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(255) DEFAULT 'cash',
  `treatment_time_slot` time DEFAULT NULL COMMENT 'Initial time slot chosen at registration',
  `advance_payment` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00 COMMENT 'Fixed discount amount deducted from total cost',
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `discount_approved_by` int(11) DEFAULT NULL,
  `discount_approved_by_employee_id` int(11) DEFAULT NULL,
  `due_amount` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `patient_photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `remarks` text DEFAULT NULL,
  `custom_fields` longtext DEFAULT NULL,
  `plan_changed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Flag: 1 if the treatment plan has been changed and historical data exists in patients_treatment, 0 otherwise.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`patient_id`, `master_patient_id`, `branch_id`, `registration_id`, `service_track_id`, `created_by_employee_id`, `assigned_doctor`, `service_type`, `treatment_type`, `treatment_cost_per_day`, `package_cost`, `treatment_days`, `total_amount`, `payment_method`, `treatment_time_slot`, `advance_payment`, `discount_amount`, `discount_percentage`, `discount_approved_by`, `discount_approved_by_employee_id`, `due_amount`, `start_date`, `end_date`, `status`, `patient_photo_path`, `created_at`, `updated_at`, `remarks`, `custom_fields`, `plan_changed`) VALUES
(1, NULL, 1, 18, NULL, 2, 'Dr Pranav Kumar', 'physio', 'daily', 600.00, NULL, 8, 4800.00, 'cash', '09:00:00', -1200.00, 0.00, 0.00, NULL, 2, 4200.00, '2025-12-02', '2025-12-09', 'inactive', NULL, '2025-12-02 12:19:05', '2025-12-28 16:34:29', '\n[2025-12-10 18:25:10] Plan edited: Treatment plan details updated\n[2025-12-10 18:34:17] Plan edited: Treatment plan details updated\n[2025-12-10 18:37:47] Plan edited: Treatment plan details updated\n[2025-12-10 18:38:02] Plan edited: Treatment plan details updated', NULL, 0),
(2, NULL, 1, 17, NULL, 2, 'Dr Pranav Kumar', 'physio', 'daily', 600.00, NULL, 10, 6000.00, 'cash', '09:00:00', -600.00, 0.00, 0.00, NULL, 2, 5400.00, '2025-12-02', '2025-12-11', 'inactive', NULL, '2025-12-02 12:19:36', '2025-12-28 16:34:29', NULL, NULL, 0),
(3, NULL, 1, 15, NULL, 2, 'Dr Pranav Kumar', 'physio', 'daily', 600.00, NULL, 10, 6000.00, 'cash', '09:00:00', -600.00, 0.00, 0.00, NULL, 2, 5400.00, '2025-12-02', '2025-12-11', 'inactive', NULL, '2025-12-02 12:20:07', '2025-12-28 16:34:29', NULL, NULL, 0),
(4, NULL, 1, 8, NULL, 2, 'Dr Pranav Kumar', 'physio', 'daily', 600.00, NULL, 10, 6000.00, 'upi', '09:00:00', -600.00, 0.00, 0.00, NULL, 2, 5000.00, '2025-12-03', '2025-12-13', 'inactive', NULL, '2025-12-02 12:20:42', '2025-12-28 16:34:29', 'Plan changed to daily on 2025-12-03. Credit Transfer: 0.00', NULL, 1),
(5, NULL, 1, 7, NULL, 2, 'Dr Pranav Kumar', 'physio', 'advance', 1000.00, NULL, 10, 10000.00, 'upi', '09:00:00', 1000.00, 0.00, 0.00, NULL, 2, 6400.00, '2025-12-03', '2025-12-13', 'active', NULL, '2025-12-02 12:21:12', '2026-01-30 14:57:22', 'Plan changed to advance on 2025-12-03. Credit Transfer: 0.00', NULL, 1),
(6, NULL, 1, 5, NULL, 2, 'Dr Pranav Kumar', 'physio', 'advance', 1000.00, NULL, 5, 5000.00, 'upi', '09:00:00', 1500.00, 0.00, 0.00, NULL, 2, -10.00, '2025-12-03', '2025-12-08', 'inactive', NULL, '2025-12-02 12:22:39', '2025-12-28 16:34:29', 'Plan changed to advance on 2025-12-03. Credit Transfer: 0.00', NULL, 1),
(7, NULL, 1, 2, NULL, 2, 'Dr Pranav Kumar', 'physio', 'advance', 1000.00, NULL, 5, 5000.00, 'upi', '09:00:00', -2000.00, 0.00, 0.00, NULL, 2, 4000.00, '2025-12-02', '2025-12-06', 'inactive', NULL, '2025-12-02 12:24:17', '2025-12-28 16:34:29', NULL, NULL, 0),
(8, NULL, 1, 20, NULL, 2, 'Dr Pranav Kumar', 'physio', 'daily', 504.00, NULL, 4, 1200.00, 'cash', '09:00:00', -1512.00, 16.00, 0.00, NULL, 2, 696.00, '2025-12-02', '2025-12-03', 'inactive', NULL, '2025-12-02 12:28:36', '2026-01-14 12:48:36', '\n[2025-12-10 21:13:28] Status manually changed from active to inactive by employee #2\n[2025-12-10 21:14:02] Status manually changed from inactive to active by employee #2\n[2025-12-11 00:55:44] Plan edited: Treatment plan details updated', NULL, 0),
(9, NULL, 1, 19, NULL, 2, 'Dr Pranav Kumar', 'speech_therapy', 'daily', 475.00, NULL, 7, 1200.00, 'upi', '15:00:00', 175.00, 5.00, 0.00, NULL, 1, -2300.00, '2025-12-05', '2025-12-06', 'inactive', NULL, '2025-12-05 18:05:48', '2026-01-18 07:34:58', '\n[2025-12-10 19:59:25] Status manually changed from active to inactive by employee #2\n[2025-12-11 00:24:45] Plan edited: Treatment plan details updated', NULL, 0),
(10, NULL, 1, 23, NULL, 2, 'Dr Pranav Kumar', 'physio', 'advance', 900.00, NULL, 6, 5000.00, 'cash', '09:00:00', -900.00, 10.00, 0.00, NULL, 1, 500.00, '2025-12-06', '2025-12-10', 'inactive', NULL, '2025-12-06 19:47:26', '2026-01-14 12:48:36', '\n[2025-12-10 18:45:16] Status manually changed from inactive to active by employee #2\n[2025-12-10 18:46:36] Status manually changed from active to inactive by employee #2\n[2025-12-10 19:59:30] Status manually changed from inactive to active by employee #2\n[2025-12-11 00:54:54] Plan edited: Treatment plan details updated\n[2025-12-11 00:57:44] Plan edited: Treatment plan details updated', NULL, 0),
(11, NULL, 1, 24, NULL, 2, 'Dr Pranav Kumar', 'physio', 'package', NULL, 30000.00, 28, 30000.00, 'cash', '09:00:00', 0.00, 0.00, 0.00, NULL, 3, 27857.14, '2025-12-10', '2026-01-06', 'active', NULL, '2025-12-10 17:21:01', '2026-01-30 15:50:41', 'Plan changed to package on 2025-12-10. Credit Transfer: 0.00\n[2025-12-10 22:54:05] Plan edited: Treatment plan details updated\n[2025-12-17 02:59:08] Status manually changed from inactive to active by employee #1', NULL, 1),
(12, NULL, 1, 25, NULL, 2, 'Dr Pranav Kumar', 'physio', 'package', NULL, 30000.00, 35, 37500.00, 'other', '09:00:00', 20000.00, 0.00, 0.00, NULL, NULL, 17500.00, '2025-12-10', '2026-01-13', 'inactive', NULL, '2025-12-10 17:33:35', '2025-12-28 16:34:29', '\n[2025-12-10 23:04:11] Plan edited: Treatment plan details updated\n[2025-12-11 00:23:39] Plan edited: Treatment plan details updated\n[2025-12-11 00:36:44] Status manually changed from active to inactive by employee #2\n[2025-12-11 00:36:49] Status manually changed from inactive to active by employee #2\n[2025-12-13 02:00:52] Status manually changed from active to inactive by employee #2', NULL, 0),
(13, NULL, 1, 26, NULL, 2, 'Dr Pranav Kumar', 'physio', 'daily', 600.00, NULL, 6, 600.00, 'upi', '12:00:00', 0.00, 0.00, 0.00, NULL, NULL, -2400.00, '2025-12-10', '2025-12-10', 'active', NULL, '2025-12-10 19:24:11', '2026-01-30 15:43:13', NULL, NULL, 0),
(14, NULL, 1, 27, NULL, 2, 'Dr Pranav Kumar', 'physio', 'package', NULL, 30000.00, 21, 30000.00, 'other', '09:00:00', 0.00, 0.00, 0.00, NULL, NULL, 25714.29, '2025-12-13', '2026-01-02', 'active', NULL, '2025-12-12 20:51:33', '2026-01-30 15:42:42', '\n[2025-12-13 02:23:00] Plan edited: Treatment plan updated (Days: 21, Discount: 0%)', NULL, 0),
(15, NULL, 1, 28, NULL, 2, 'Dr Pranav Kumar', 'physio', 'package', NULL, 40000.00, 28, 40000.00, 'other', '09:00:00', 1428.57, 0.00, 0.00, NULL, NULL, 30000.00, '2025-12-15', '2026-01-11', 'active', NULL, '2025-12-15 19:17:04', '2026-01-30 15:30:26', '\n[2025-12-16 00:51:05] Plan edited: Treatment plan updated (Days: 28, Discount: 0%)', NULL, 0),
(16, NULL, 1, 29, NULL, 2, 'Dr Pranav Kumar', 'physio', 'daily', 600.00, NULL, 8, 600.00, 'other', '09:00:00', 0.00, 0.00, 0.00, NULL, NULL, -4200.00, '2025-12-17', '2025-12-17', 'active', NULL, '2025-12-17 09:06:49', '2026-01-30 14:56:17', '\n[2025-12-19 01:34:57] Status manually changed from active to inactive by employee #2\n[2025-12-19 02:16:31] Status manually changed from active to inactive by employee #1\n[2025-12-19 02:16:41] Status manually changed from inactive to active by employee #1', NULL, 0),
(17, NULL, 1, 31, NULL, 1, 'Dr Pranav Kumar', 'physio', 'daily', 750.00, NULL, 4, 750.00, 'UPI-BOI', '09:00:00', 0.00, 0.00, 0.00, NULL, NULL, -2250.00, '2026-01-04', '2026-01-04', 'active', NULL, '2026-01-04 17:16:22', '2026-01-30 14:45:48', NULL, NULL, 0),
(19, 33, 1, 32, NULL, 2, 'Not Assigned', 'physio', 'advance', 1200.00, NULL, 6, 1200.00, 'CASH, upi-hdfc, cheque, net_banking', '09:00:00', 0.00, 0.00, 0.00, NULL, NULL, -6000.00, '2026-01-07', '2026-01-07', 'active', NULL, '2026-01-06 22:47:23', '2026-01-30 14:45:19', '\n[2026-01-30 16:24:43] Status manually changed from inactive to active by employee #2', NULL, 0),
(20, NULL, 1, 33, NULL, 2, 'Not Assigned', 'physio', 'advance', 1000.00, NULL, 5, 5000.00, 'CASH', '09:00:00', 4500.00, 1000.00, 0.00, NULL, 1, 500.00, '2026-01-18', '2026-01-22', 'active', NULL, '2026-01-18 14:50:55', '2026-01-31 07:43:59', NULL, NULL, 0),
(21, 13, 1, 14, 2, 2, 'Not Assigned', 'physio', 'daily', 750.00, NULL, 1, 750.00, 'CASH', '09:00:00', 750.00, 0.00, 0.00, NULL, NULL, 0.00, '2026-01-24', '2026-01-24', 'active', NULL, '2026-01-23 21:17:50', '2026-01-30 10:55:09', NULL, '[]', 0),
(22, 32, 1, 31, 3, 2, 'Not Assigned', 'heart', 'fixed', 2000.00, NULL, 1, 2000.00, 'CASH', '09:00:00', 2000.00, 0.00, 0.00, NULL, NULL, 0.00, '2026-01-31', '2026-01-31', 'active', NULL, '2026-01-31 06:16:22', '2026-01-31 06:16:22', NULL, '{}', 0),
(23, 36, 1, 35, 3, 2, 'Dr Pranav Kumar', 'heart', '0.029061961180821383', 50000.00, 0.00, 1, 50000.00, 'CASH', '11:00:00', 2000.00, 0.00, 0.00, NULL, NULL, 18000.00, '2026-01-31', '2026-01-31', 'active', NULL, '2026-01-31 06:18:16', '2026-01-31 07:53:39', '\n[Plan Change: 0.029061961180821383 | New Tot: 50000 | Days: 1 | Ad: 30000 | Rsn: who knows]', '{}', 1);

-- --------------------------------------------------------

--
-- Table structure for table `patients_treatment`
--

CREATE TABLE `patients_treatment` (
  `treatment_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `treatment_type` varchar(100) NOT NULL,
  `treatment_cost_per_day` decimal(10,2) DEFAULT 0.00,
  `package_cost` decimal(10,2) DEFAULT 0.00,
  `treatment_days` int(11) DEFAULT 0,
  `attendance_count` int(11) DEFAULT 0,
  `consumed_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `advance_payment` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00 COMMENT 'Fixed discount amount deducted from total cost',
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `due_amount` decimal(10,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `remarks` text DEFAULT NULL,
  `treatment_time_slot` time DEFAULT NULL COMMENT 'Initial time slot chosen at registration',
  `archived_reason` text DEFAULT NULL COMMENT 'Reason provided by the user for changing the plan.',
  `created_by_employee_id` int(11) DEFAULT NULL COMMENT 'FK to employees table for the person who archived this plan.'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `patients_treatment`
--

INSERT INTO `patients_treatment` (`treatment_id`, `patient_id`, `treatment_type`, `treatment_cost_per_day`, `package_cost`, `treatment_days`, `attendance_count`, `consumed_amount`, `total_amount`, `advance_payment`, `discount_amount`, `discount_percentage`, `due_amount`, `start_date`, `end_date`, `status`, `created_at`, `remarks`, `treatment_time_slot`, `archived_reason`, `created_by_employee_id`) VALUES
(1, 4, 'advance', 1000.00, 0.00, 10, 1, 1000.00, 10000.00, 1000.00, 0.00, 0.00, 0.00, '2025-12-02', '2025-12-03', 'inactive', '2025-12-02 12:20:42', ' | Archived on 2025-12-03. Consumed: 1,000.00', '09:00:00', 'j', 2),
(2, 5, 'daily', 600.00, 0.00, 5, 1, 600.00, 3000.00, 600.00, 0.00, 0.00, 0.00, '2025-12-02', '2025-12-03', 'inactive', '2025-12-02 12:21:12', ' | Archived on 2025-12-03. Consumed: 600.00', '09:00:00', 'jn', 2),
(3, 6, 'daily', 510.00, 0.00, 10, 1, 510.00, 5100.00, 510.00, 15.00, 0.00, 0.00, '2025-12-02', '2025-12-03', 'inactive', '2025-12-02 12:22:39', ' | Archived on 2025-12-03. Consumed: 510.00', '09:00:00', 'test', 2),
(4, 11, 'package', 0.00, 28500.00, 21, 0, 0.00, 28500.00, 0.00, 5.00, 0.00, 0.00, '2025-12-10', '2025-12-10', 'inactive', '2025-12-10 17:21:01', ' | Archived on 2025-12-10. Consumed: 0.00', '09:00:00', 'dont know', 2),
(7, 23, 'fixed', 2000.00, 0.00, 1, 0, 0.00, 2000.00, 0.00, 0.00, 0.00, 0.00, '2026-01-31', '2026-01-31', 'active', '2026-01-31 06:54:47', 'Archived on Plan Change. Carried Over Balance: 2000. Reason: who knows', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `patient_appointments`
--

CREATE TABLE `patient_appointments` (
  `appointment_id` int(10) UNSIGNED NOT NULL,
  `patient_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `time_slot` time NOT NULL,
  `service_type` varchar(50) NOT NULL COMMENT 'e.g., physio, speech_therapy',
  `status` varchar(50) NOT NULL DEFAULT 'scheduled' COMMENT 'e.g., scheduled, completed, cancelled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_appointments`
--

INSERT INTO `patient_appointments` (`appointment_id`, `patient_id`, `branch_id`, `created_by_employee_id`, `appointment_date`, `time_slot`, `service_type`, `status`, `created_at`) VALUES
(1, 1, 1, NULL, '2025-12-02', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(2, 1, 1, NULL, '2025-12-03', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(3, 1, 1, NULL, '2025-12-04', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(4, 1, 1, NULL, '2025-12-05', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(5, 1, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(6, 1, 1, NULL, '2025-12-07', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(7, 1, 1, NULL, '2025-12-08', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(8, 1, 1, NULL, '2025-12-09', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(9, 1, 1, NULL, '2025-12-10', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(10, 1, 1, NULL, '2025-12-11', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:05'),
(11, 2, 1, NULL, '2025-12-02', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(12, 2, 1, NULL, '2025-12-03', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(13, 2, 1, NULL, '2025-12-04', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(14, 2, 1, NULL, '2025-12-05', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(15, 2, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(16, 2, 1, NULL, '2025-12-07', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(17, 2, 1, NULL, '2025-12-08', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(18, 2, 1, NULL, '2025-12-09', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(19, 2, 1, NULL, '2025-12-10', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(20, 2, 1, NULL, '2025-12-11', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:19:36'),
(21, 3, 1, NULL, '2025-12-02', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(22, 3, 1, NULL, '2025-12-03', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(23, 3, 1, NULL, '2025-12-04', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(24, 3, 1, NULL, '2025-12-05', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(25, 3, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(26, 3, 1, NULL, '2025-12-07', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(27, 3, 1, NULL, '2025-12-08', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(28, 3, 1, NULL, '2025-12-09', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(29, 3, 1, NULL, '2025-12-10', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(30, 3, 1, NULL, '2025-12-11', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:07'),
(31, 4, 1, NULL, '2025-12-02', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(32, 4, 1, NULL, '2025-12-03', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(33, 4, 1, NULL, '2025-12-04', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(34, 4, 1, NULL, '2025-12-05', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(35, 4, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(36, 4, 1, NULL, '2025-12-07', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(37, 4, 1, NULL, '2025-12-08', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(38, 4, 1, NULL, '2025-12-09', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(39, 4, 1, NULL, '2025-12-10', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(40, 4, 1, NULL, '2025-12-11', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:20:42'),
(41, 5, 1, NULL, '2025-12-02', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:21:12'),
(42, 5, 1, NULL, '2025-12-03', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:21:12'),
(43, 5, 1, NULL, '2025-12-04', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:21:12'),
(44, 5, 1, NULL, '2025-12-05', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:21:12'),
(45, 5, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:21:12'),
(46, 6, 1, NULL, '2025-12-02', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(47, 6, 1, NULL, '2025-12-03', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(48, 6, 1, NULL, '2025-12-04', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(49, 6, 1, NULL, '2025-12-05', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(50, 6, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(51, 6, 1, NULL, '2025-12-07', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(52, 6, 1, NULL, '2025-12-08', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(53, 6, 1, NULL, '2025-12-09', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(54, 6, 1, NULL, '2025-12-10', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(55, 6, 1, NULL, '2025-12-11', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:22:39'),
(56, 7, 1, NULL, '2025-12-02', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:24:17'),
(57, 7, 1, NULL, '2025-12-03', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:24:17'),
(58, 7, 1, NULL, '2025-12-04', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:24:17'),
(59, 7, 1, NULL, '2025-12-05', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:24:17'),
(60, 7, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:24:17'),
(61, 8, 1, NULL, '2025-12-02', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:28:36'),
(62, 8, 1, NULL, '2025-12-03', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:28:36'),
(63, 8, 1, NULL, '2025-12-04', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:28:36'),
(64, 8, 1, NULL, '2025-12-05', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:28:36'),
(65, 8, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-02 12:28:36'),
(66, 8, 1, NULL, '2025-12-04', '10:30:00', 'physio', 'scheduled', '2025-12-03 18:18:52'),
(67, 9, 1, NULL, '2025-12-05', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(68, 9, 1, NULL, '2025-12-06', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(69, 9, 1, NULL, '2025-12-07', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(70, 9, 1, NULL, '2025-12-08', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(71, 9, 1, NULL, '2025-12-09', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(72, 9, 1, NULL, '2025-12-10', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(73, 9, 1, NULL, '2025-12-11', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(74, 9, 1, NULL, '2025-12-12', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(75, 9, 1, NULL, '2025-12-13', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(76, 9, 1, NULL, '2025-12-14', '15:00:00', 'speech_therapy', 'scheduled', '2025-12-05 18:05:48'),
(77, 9, 1, NULL, '2025-12-06', '10:30:00', 'physio', 'scheduled', '2025-12-06 10:02:22'),
(78, 10, 1, NULL, '2025-12-06', '09:00:00', 'physio', 'scheduled', '2025-12-06 19:47:26'),
(79, 10, 1, NULL, '2025-12-07', '09:00:00', 'physio', 'scheduled', '2025-12-06 19:47:26'),
(80, 10, 1, NULL, '2025-12-08', '09:00:00', 'physio', 'scheduled', '2025-12-06 19:47:26'),
(81, 10, 1, NULL, '2025-12-09', '09:00:00', 'physio', 'scheduled', '2025-12-06 19:47:26'),
(82, 10, 1, NULL, '2025-12-10', '09:00:00', 'physio', 'scheduled', '2025-12-06 19:47:26'),
(83, 11, 1, NULL, '2025-12-10', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(84, 11, 1, NULL, '2025-12-11', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(85, 11, 1, NULL, '2025-12-12', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(86, 11, 1, NULL, '2025-12-13', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(87, 11, 1, NULL, '2025-12-14', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(88, 11, 1, NULL, '2025-12-15', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(89, 11, 1, NULL, '2025-12-16', '18:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(90, 11, 1, NULL, '2025-12-17', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(91, 11, 1, NULL, '2025-12-18', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(92, 11, 1, NULL, '2025-12-19', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(93, 11, 1, NULL, '2025-12-20', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(94, 11, 1, NULL, '2025-12-21', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(95, 11, 1, NULL, '2025-12-22', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(96, 11, 1, NULL, '2025-12-23', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(97, 11, 1, NULL, '2025-12-24', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(98, 11, 1, NULL, '2025-12-25', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(99, 11, 1, NULL, '2025-12-26', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(100, 11, 1, NULL, '2025-12-27', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(101, 11, 1, NULL, '2025-12-28', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(102, 11, 1, NULL, '2025-12-29', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(103, 11, 1, NULL, '2025-12-30', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:21:01'),
(104, 12, 1, NULL, '2025-12-10', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(105, 12, 1, NULL, '2025-12-11', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(106, 12, 1, NULL, '2025-12-12', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(107, 12, 1, NULL, '2025-12-13', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(108, 12, 1, NULL, '2025-12-14', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(109, 12, 1, NULL, '2025-12-15', '15:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(110, 12, 1, NULL, '2025-12-16', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(111, 12, 1, NULL, '2025-12-17', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(112, 12, 1, NULL, '2025-12-18', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(113, 12, 1, NULL, '2025-12-19', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(114, 12, 1, NULL, '2025-12-20', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(115, 12, 1, NULL, '2025-12-21', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(116, 12, 1, NULL, '2025-12-22', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(117, 12, 1, NULL, '2025-12-23', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(118, 12, 1, NULL, '2025-12-24', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(119, 12, 1, NULL, '2025-12-25', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(120, 12, 1, NULL, '2025-12-26', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(121, 12, 1, NULL, '2025-12-27', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(122, 12, 1, NULL, '2025-12-28', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(123, 12, 1, NULL, '2025-12-29', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(124, 12, 1, NULL, '2025-12-30', '09:00:00', 'physio', 'scheduled', '2025-12-10 17:33:35'),
(125, 13, 1, NULL, '2025-12-10', '12:00:00', 'physio', 'scheduled', '2025-12-10 19:24:11'),
(126, 13, 1, NULL, '2025-12-11', '12:00:00', 'physio', 'scheduled', '2025-12-10 19:28:48'),
(127, 14, 1, NULL, '2025-12-12', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(128, 14, 1, NULL, '2025-12-13', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(129, 14, 1, NULL, '2025-12-14', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(130, 14, 1, NULL, '2025-12-15', '12:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(131, 14, 1, NULL, '2025-12-16', '12:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(132, 14, 1, NULL, '2025-12-17', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(133, 14, 1, NULL, '2025-12-18', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(134, 14, 1, NULL, '2025-12-19', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(135, 14, 1, NULL, '2025-12-20', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(136, 14, 1, NULL, '2025-12-21', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(137, 14, 1, NULL, '2025-12-22', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(138, 14, 1, NULL, '2025-12-23', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(139, 14, 1, NULL, '2025-12-24', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(140, 14, 1, NULL, '2025-12-25', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(141, 14, 1, NULL, '2025-12-26', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(142, 14, 1, NULL, '2025-12-27', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(143, 14, 1, NULL, '2025-12-28', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(144, 14, 1, NULL, '2025-12-29', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(145, 14, 1, NULL, '2025-12-30', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(146, 14, 1, NULL, '2025-12-31', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(147, 14, 1, NULL, '2026-01-01', '09:00:00', 'physio', 'scheduled', '2025-12-12 20:51:33'),
(148, 15, 1, NULL, '2025-12-15', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(149, 15, 1, NULL, '2025-12-16', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(150, 15, 1, NULL, '2025-12-17', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(151, 15, 1, NULL, '2025-12-18', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(152, 15, 1, NULL, '2025-12-19', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(153, 15, 1, NULL, '2025-12-20', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(154, 15, 1, NULL, '2025-12-21', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(155, 15, 1, NULL, '2025-12-22', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(156, 15, 1, NULL, '2025-12-23', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(157, 15, 1, NULL, '2025-12-24', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(158, 15, 1, NULL, '2025-12-25', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(159, 15, 1, NULL, '2025-12-26', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(160, 15, 1, NULL, '2025-12-27', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(161, 15, 1, NULL, '2025-12-28', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(162, 15, 1, NULL, '2025-12-29', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(163, 15, 1, NULL, '2025-12-30', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(164, 15, 1, NULL, '2025-12-31', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(165, 15, 1, NULL, '2026-01-01', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(166, 15, 1, NULL, '2026-01-02', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(167, 15, 1, NULL, '2026-01-03', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(168, 15, 1, NULL, '2026-01-04', '09:00:00', 'physio', 'scheduled', '2025-12-15 19:17:04'),
(169, 16, 1, NULL, '2025-12-17', '09:00:00', 'physio', 'scheduled', '2025-12-17 09:06:49'),
(170, 13, 1, NULL, '2026-01-02', '09:00:00', 'physio', 'scheduled', '2026-01-02 10:11:15'),
(171, 17, 1, NULL, '2026-01-04', '09:00:00', 'physio', 'scheduled', '2026-01-04 17:16:22'),
(173, 19, 1, 2, '2026-01-07', '09:00:00', 'physio', 'scheduled', '2026-01-06 22:47:23'),
(174, 20, 1, NULL, '2026-01-18', '09:00:00', 'physio', 'scheduled', '2026-01-18 14:50:55'),
(175, 20, 1, NULL, '2026-01-19', '09:00:00', 'physio', 'scheduled', '2026-01-18 14:50:55'),
(176, 20, 1, NULL, '2026-01-20', '09:00:00', 'physio', 'scheduled', '2026-01-18 14:50:55'),
(177, 20, 1, NULL, '2026-01-21', '09:00:00', 'physio', 'scheduled', '2026-01-18 14:50:55'),
(178, 20, 1, NULL, '2026-01-22', '09:00:00', 'physio', 'scheduled', '2026-01-18 14:50:55'),
(179, 21, 1, 2, '2026-01-24', '09:00:00', 'physio', 'scheduled', '2026-01-23 21:17:50'),
(180, 22, 1, 2, '2026-01-31', '09:00:00', 'heart', 'scheduled', '2026-01-31 06:16:22'),
(181, 23, 1, 2, '2026-01-31', '11:00:00', 'heart', 'scheduled', '2026-01-31 06:18:16');

-- --------------------------------------------------------

--
-- Table structure for table `patient_feedback`
--

CREATE TABLE `patient_feedback` (
  `feedback_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `feedback_type` enum('Good','Average','Bad') NOT NULL DEFAULT 'Good',
  `patient_status_snapshot` enum('active','completed','discontinued') NOT NULL,
  `comments` text DEFAULT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_feedback`
--

INSERT INTO `patient_feedback` (`feedback_id`, `patient_id`, `branch_id`, `feedback_type`, `patient_status_snapshot`, `comments`, `created_by_employee_id`, `created_at`) VALUES
(1, 11, 1, 'Good', 'completed', 'testing', 2, '2025-12-19 22:22:29'),
(2, 16, 1, 'Bad', 'active', '', 2, '2025-12-19 22:26:29');

-- --------------------------------------------------------

--
-- Table structure for table `patient_master`
--

CREATE TABLE `patient_master` (
  `master_patient_id` bigint(20) UNSIGNED NOT NULL,
  `patient_uid` varchar(20) NOT NULL COMMENT 'The human-readable YYMMDD-S.No ID',
  `full_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `age` varchar(50) DEFAULT NULL,
  `first_registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `first_registered_branch_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_master`
--

INSERT INTO `patient_master` (`master_patient_id`, `patient_uid`, `full_name`, `phone_number`, `gender`, `age`, `first_registered_at`, `first_registered_branch_id`) VALUES
(1, '2512021', 'Kumar gopal krishna', '7766905366', 'Male', '55', '2025-12-02 10:51:05', 1),
(2, '2512022', 'Ponam kumari', '9473037876', 'Female', '50', '2025-12-02 10:52:12', 1),
(3, '2512023', 'Bandhana singh', '9801121814', 'Female', '60', '2025-12-02 10:53:33', 1),
(4, '2512025', 'Bhavya singh', '9931289759', 'Female', '1', '2025-12-02 10:55:47', 1),
(5, '2512026', 'Sangita singhaniya', '7781095941', 'Female', '1', '2025-12-02 10:57:19', 1),
(6, '2512027', 'Sweety kumari', '9508006378', 'Female', '45', '2025-12-02 10:58:36', 1),
(7, '2512028', 'Kamini sukhla', '9801734004', 'Female', '60', '2025-12-02 11:02:07', 1),
(8, '2512029', 'Sandeep suman', '8797568590', 'Male', '25', '2025-12-02 11:09:47', 1),
(9, '25120210', 'Kiran devi', '8102635424', 'Female', '40', '2025-12-02 11:11:16', 1),
(10, '25120211', 'Aryan kumar', '8877875165', 'Male', '1', '2025-12-02 11:13:42', 1),
(11, '25120212', 'Mahi noor', '926221615', 'Female', '2', '2025-12-02 11:16:15', 1),
(12, '25120213', 'Anchal kumari', '7645864984', 'Female', '29', '2025-12-02 11:17:28', 1),
(13, '25120214', 'Satyam kumar', '9199596520', 'Male', '1', '2025-12-02 11:18:59', 1),
(14, '25120215', 'Riyansh Raj', '9572950061', 'Male', '5', '2025-12-02 11:21:38', 1),
(15, '25120216', 'D N Singh', '8292802562', 'Male', '70', '2025-12-02 11:23:06', 1),
(16, '25120217', 'Pushpa singh', '9608021243', 'Female', '60', '2025-12-02 11:24:17', 1),
(17, '25120218', 'Ekra khatun', '8218014201', 'Female', '1', '2025-12-02 11:25:47', 1),
(18, '25120219', 'Sana Akhtar', '6202539853', 'Female', '4', '2025-12-02 11:32:57', 1),
(19, '25120220', 'Dimple bharti', '9304024182', 'Female', '35', '2025-12-02 11:34:09', 1),
(20, '2512051', 'Sumit', '7729281910', 'Male', '22', '2025-12-05 10:57:06', 1),
(21, '2512061', 'Sumit', '7739182939', 'Male', '22', '2025-12-06 07:14:38', 1),
(22, '2512071', 'Test', '7789928393', 'Male', '22', '2025-12-06 19:41:29', 1),
(23, '2512101', 'Sumit Sinha', '7739208200', 'Male', '24', '2025-12-10 17:16:46', 1),
(24, '2512102', 'Test', '4656524465', 'Male', '22', '2025-12-10 17:28:04', 1),
(25, '2512111', 'Priyanshu', '7394394339', 'Male', '24', '2025-12-10 19:23:10', 1),
(26, '2512131', 'Test', '7338784737', 'Male', '22', '2025-12-12 20:51:06', 1),
(27, '2512151', 'Test', '7939489384', 'Male', '15days', '2025-12-15 09:48:07', 1),
(28, '2512171', 'Ishan Mishra', '737437333', 'Male', '23', '2025-12-17 09:06:15', 1),
(31, '2512191', 'test', '8929928829', 'Male', '20', '2025-12-19 14:47:22', 1),
(32, '2512241', 'Sakshi', '7839928039', 'Female', '20', '2025-12-24 16:01:34', 1),
(33, '2601051', 'test', '1234567890', 'Male', '20', '2026-01-05 06:37:44', 1),
(34, '2601181', 'Ravi', '1111111111', 'Male', '22', '2026-01-18 14:50:06', 1),
(35, '2601231', 'Sumit', '1234566789', 'Male', '23', '2026-01-22 19:03:41', 1),
(36, '2601301', 'Sagar', '8938493437', 'Male', '24', '2026-01-30 07:15:22', 1);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `processed_by_employee_id` int(11) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `mode` varchar(255) DEFAULT 'cash',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `patient_id`, `branch_id`, `processed_by_employee_id`, `payment_date`, `amount`, `mode`, `remarks`, `created_at`) VALUES
(1, 1, NULL, NULL, '2025-12-02', 600.00, 'cash', 'Initial advance payment', '2025-12-02 12:19:05'),
(2, 2, NULL, NULL, '2025-12-02', 600.00, 'cash', 'Initial advance payment', '2025-12-02 12:19:36'),
(3, 3, NULL, NULL, '2025-12-02', 600.00, 'cash', 'Initial advance payment', '2025-12-02 12:20:07'),
(4, 4, NULL, NULL, '2025-12-02', 1000.00, 'upi', 'Initial advance payment', '2025-12-02 12:20:42'),
(5, 5, NULL, NULL, '2025-12-02', 600.00, 'upi', 'Initial advance payment', '2025-12-02 12:21:12'),
(6, 6, NULL, NULL, '2025-12-02', 500.00, 'upi', 'Initial advance payment', '2025-12-02 12:22:39'),
(7, 7, NULL, NULL, '2025-12-02', 1000.00, 'upi', 'Initial advance payment', '2025-12-02 12:24:17'),
(8, 6, NULL, 2, '2025-12-02', 10.00, 'cash', '', '2025-12-02 12:25:45'),
(9, 8, NULL, NULL, '2025-12-02', 500.00, 'cash', 'Initial advance payment', '2025-12-02 12:28:36'),
(10, 8, NULL, 2, '2025-12-02', 4.00, 'cash', '', '2025-12-02 12:29:05'),
(11, 6, NULL, 2, '2025-12-03', 4500.00, 'cash', 'Advance for new plan (Advance)', '2025-12-03 15:31:10'),
(12, 9, NULL, NULL, '2025-12-05', 3500.00, 'upi', 'Initial advance payment', '2025-12-05 18:05:48'),
(13, 10, NULL, NULL, '2025-12-06', 4000.00, 'cash', 'Initial advance payment', '2025-12-06 19:47:26'),
(14, 10, NULL, 2, '2025-12-10', 500.00, 'cash', 'test', '2025-12-10 11:38:54'),
(15, 12, NULL, 2, '2025-12-10', 20000.00, 'upi', 'Dues Payment', '2025-12-10 17:34:39'),
(16, 13, NULL, NULL, '2025-12-10', 600.00, 'upi', 'Initial advance payment', '2025-12-10 19:24:11'),
(17, 13, NULL, 2, '2025-12-15', 600.00, 'cash', '', '2025-12-15 09:14:47'),
(18, 15, NULL, 2, '2025-12-16', 10000.00, 'upi', 'Dues Payment', '2025-12-15 19:19:04'),
(19, 13, NULL, 2, '2025-12-19', 1200.00, 'cash', 'Daily attendance marked', '2025-12-18 20:21:25'),
(20, 16, NULL, 2, '2025-12-19', 1800.00, 'cash', 'Daily attendance marked', '2025-12-18 20:33:38'),
(21, 11, NULL, 2, '2025-12-20', 2142.86, 'cash', 'Package attendance marked', '2025-12-19 22:27:38'),
(22, 13, NULL, 2, '2025-12-25', 600.00, 'cash', 'Daily attendance marked', '2025-12-25 09:32:59'),
(23, 16, NULL, 2, '2025-12-26', 1200.00, 'cash', 'Daily attendance marked', '2025-12-25 19:49:03'),
(24, 16, NULL, 1, '2025-12-28', 600.00, 'cash', 'Daily attendance marked', '2025-12-27 23:23:47'),
(25, 14, NULL, 1, '2025-12-28', 4285.71, 'cash', 'Package attendance marked', '2025-12-27 23:23:57'),
(26, 16, NULL, 1, '2026-01-04', 600.00, 'cash', 'Daily attendance marked', '2026-01-04 16:35:58'),
(27, 17, NULL, NULL, '2026-01-04', 750.00, 'UPI-BOI', 'Initial advance payment', '2026-01-04 17:16:22'),
(28, 19, NULL, 2, '2026-01-07', 1200.00, 'CASH, upi-hdfc, cheque, net_banking', 'Initial advance payment', '2026-01-06 22:47:23'),
(29, 17, NULL, 1, '2026-01-11', 750.00, 'cash', 'Daily attendance marked', '2026-01-11 16:42:52'),
(30, 20, NULL, NULL, '2026-01-18', 4500.00, 'CASH', 'Initial advance payment', '2026-01-18 14:50:55'),
(31, 21, NULL, 2, '2026-01-24', 750.00, 'CASH', 'Initial advance payment', '2026-01-23 21:17:50'),
(32, 19, NULL, 2, '2026-01-30', 6000.00, 'cash', 'Advance attendance marked', '2026-01-30 14:45:16'),
(33, 17, NULL, 2, '2026-01-30', 1500.00, 'cash', 'Daily attendance marked', '2026-01-30 14:45:45'),
(34, 16, NULL, 2, '2026-01-30', 600.00, 'cash', '', '2026-01-30 14:56:15'),
(35, 5, NULL, 2, '2026-01-30', 3000.00, 'cash', 'Advance attendance marked', '2026-01-30 14:57:22'),
(36, 14, NULL, 2, '2026-01-30', 1428.58, 'Cash', '', '2026-01-30 15:42:42'),
(37, 11, NULL, 2, '2026-01-30', 1071.43, 'UPI - HDFC', '', '2026-01-30 15:50:41'),
(38, 13, NULL, 2, '2026-01-30', 600.00, 'Cash', 'Dues Payment', '2026-01-30 16:18:20'),
(39, 21, NULL, 2, '2026-01-31', 10.00, 'Cash', 'Dues Payment', '2026-01-31 04:25:01'),
(40, 22, NULL, 2, '2026-01-31', 2000.00, 'CASH', 'Initial advance payment', '2026-01-31 06:16:22'),
(41, 23, NULL, 2, '2026-01-31', 2000.00, 'CASH', 'Initial advance payment', '2026-01-31 06:18:16'),
(42, 23, 1, 2, '2026-01-31', 30000.00, 'UPI - HDFC', 'Advance for New Plan', '2026-01-31 06:54:47'),
(43, 23, NULL, 2, '2026-01-31', 18000.00, 'UPI - HDFC', '', '2026-01-31 07:43:33'),
(44, 19, NULL, 2, '2026-01-31', 1200.00, 'Cash', '', '2026-01-31 07:44:08'),
(45, 17, NULL, 2, '2026-01-31', 750.00, 'UPI - HDFC', '', '2026-01-31 07:44:20');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `method_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `method_name` varchar(50) NOT NULL,
  `method_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`method_id`, `branch_id`, `method_name`, `method_code`, `is_active`, `display_order`, `created_at`) VALUES
(1, 2, 'Cash', 'cash', 1, 1, '2025-12-17 19:30:58'),
(2, 1, 'Cash', 'CASH', 1, 1, '2025-12-17 19:30:58'),
(3, 5, 'Cash', 'cash', 1, 1, '2025-12-17 19:30:58'),
(7, 2, 'UPI - HDFC', 'upi-hdfc', 1, 3, '2025-12-17 19:30:58'),
(8, 1, 'UPI - HDFC', 'upi-hdfc', 1, 3, '2025-12-17 19:30:58'),
(9, 5, 'UPI - HDFC', 'upi-hdfc', 1, 3, '2025-12-17 19:30:58'),
(10, 2, 'Card', 'card', 0, 4, '2025-12-17 19:30:58'),
(11, 1, 'Card', 'card', 0, 4, '2025-12-17 19:30:58'),
(12, 5, 'Card', 'card', 0, 4, '2025-12-17 19:30:58'),
(13, 2, 'Cheque', 'cheque', 1, 5, '2025-12-17 19:30:58'),
(14, 1, 'Cheque', 'cheque', 1, 5, '2025-12-17 19:30:58'),
(15, 5, 'Cheque', 'cheque', 1, 5, '2025-12-17 19:30:58'),
(16, 2, 'Other', 'other', 1, 6, '2025-12-17 19:30:58'),
(17, 1, 'Other', 'other', 1, 6, '2025-12-17 19:30:58'),
(18, 5, 'Other', 'other', 1, 6, '2025-12-17 19:30:58'),
(19, 1, 'Test', 'TEST', 0, 7, '2025-12-19 14:29:10'),
(20, 1, 'Internet Banking', 'net_banking', 1, 5, '2026-01-05 18:31:48'),
(21, 1, 'Credit Card HDFC', 'cc_hdfc', 1, 10, '2026-01-05 18:31:48'),
(22, 1, 'Credit Card SBI', 'cc_sbi', 1, 11, '2026-01-05 18:31:48'),
(23, 2, 'Internet Banking', 'net_banking', 1, 5, '2026-01-05 18:31:48'),
(24, 2, 'Credit Card HDFC', 'cc_hdfc', 1, 10, '2026-01-05 18:31:48'),
(25, 2, 'Credit Card SBI', 'cc_sbi', 1, 11, '2026-01-05 18:31:48'),
(26, 5, 'Internet Banking', 'net_banking', 1, 5, '2026-01-05 18:31:48'),
(27, 5, 'Credit Card HDFC', 'cc_hdfc', 1, 10, '2026-01-05 18:31:48'),
(28, 5, 'Credit Card SBI', 'cc_sbi', 1, 11, '2026-01-05 18:31:48');

-- --------------------------------------------------------

--
-- Table structure for table `payment_splits`
--

CREATE TABLE `payment_splits` (
  `id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_splits`
--

INSERT INTO `payment_splits` (`id`, `payment_id`, `payment_method`, `amount`, `created_at`) VALUES
(1, 27, 'UPI-BOI', 750.00, '2026-01-04 17:16:22'),
(2, 28, 'CASH', 500.00, '2026-01-06 22:47:23'),
(3, 28, 'upi-hdfc', 250.00, '2026-01-06 22:47:23'),
(4, 28, 'cheque', 450.00, '2026-01-06 22:47:23'),
(5, 30, 'CASH', 4500.00, '2026-01-18 14:50:55'),
(6, 31, 'CASH', 750.00, '2026-01-23 21:17:50'),
(7, 40, 'CASH', 2000.00, '2026-01-31 06:16:22'),
(8, 41, 'CASH', 2000.00, '2026-01-31 06:18:16');

-- --------------------------------------------------------

--
-- Table structure for table `quick_inquiry`
--

CREATE TABLE `quick_inquiry` (
  `inquiry_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `age` varchar(50) DEFAULT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `inquiry_type` varchar(50) DEFAULT NULL COMMENT 'e.g., physio, speech_therapy',
  `communication_type` varchar(50) DEFAULT NULL COMMENT 'e.g., phone, web, email',
  `referralSource` varchar(50) DEFAULT 'self',
  `referred_by` varchar(255) DEFAULT NULL,
  `chief_complain` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) NOT NULL,
  `review` text DEFAULT NULL,
  `expected_visit_date` date DEFAULT NULL,
  `status` enum('visited','cancelled','pending') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `next_followup_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quick_inquiry`
--

INSERT INTO `quick_inquiry` (`inquiry_id`, `branch_id`, `created_by_employee_id`, `name`, `age`, `gender`, `inquiry_type`, `communication_type`, `referralSource`, `referred_by`, `chief_complain`, `phone_number`, `review`, `expected_visit_date`, `status`, `created_at`, `next_followup_date`) VALUES
(1, 1, 2, 'Test', '22', 'Male', 'physio', 'by_visit', 'doctor_referral', NULL, 'radiating_pain', '7389928393', 'none', '2025-12-07', 'visited', '2025-12-06 19:43:47', NULL),
(2, 1, 2, 'Mahi', '20', 'Female', 'physio', 'by_visit', 'web_search', NULL, 'radiating_pain', '7934398439', 'desktop app test', '2025-12-24', 'visited', '2025-12-24 17:11:18', '2026-01-24'),
(3, 1, 2, 'Sumit', '22', 'Male', 'physio', 'Walk-in', 'doctor_referral', NULL, 'radiating_pain', '8923829382', 'Testing', '2026-01-31', 'visited', '2026-01-30 07:13:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `referral_partners`
--

CREATE TABLE `referral_partners` (
  `partner_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `referral_partners`
--

INSERT INTO `referral_partners` (`partner_id`, `name`, `phone`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Self', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(2, 'Dr A k Singh MD (Ped)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(3, 'Dr G R Johar  D (Ortho)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(4, 'Dr Kamran fazal MD,DCH', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(5, 'Dr Md khalil Ahemad MD (Ped)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(6, 'Dr R K Sinha MD (Ped)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(7, 'Dr Amitabh singh D (Ortho)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(8, 'Me', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(9, 'Dr A K Bhagat MD (Phych)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(10, 'Dr. Pankaj Kumar MCh (Neuro Surgery)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(11, 'Dr Sheentanshu shekhar D (Ortho)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(12, 'Dr P B Mishra MD (Ped)', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55'),
(13, 'JLNMCH Bhagalpur', NULL, 'active', '2025-12-17 09:37:55', '2025-12-17 09:37:55');

-- --------------------------------------------------------

--
-- Table structure for table `referral_rates`
--

CREATE TABLE `referral_rates` (
  `rate_id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `service_type` enum('registration','test') NOT NULL,
  `service_item_name` varchar(100) DEFAULT NULL COMMENT 'Specific test name or NULL for general registration',
  `commission_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `referral_rates`
--

INSERT INTO `referral_rates` (`rate_id`, `partner_id`, `service_type`, `service_item_name`, `commission_amount`, `created_at`) VALUES
(7, 1, 'registration', NULL, 200.00, '2025-12-17 12:25:35'),
(8, 1, 'test', 'bera', 500.00, '2025-12-17 12:25:35'),
(9, 1, 'test', 'ECG', 500.00, '2025-12-17 12:25:35'),
(10, 1, 'test', 'eeg', 500.00, '2025-12-17 12:25:35'),
(11, 1, 'test', 'EGG', 500.00, '2025-12-17 12:25:35'),
(12, 1, 'test', 'emg', 500.00, '2025-12-17 12:25:35'),
(13, 1, 'test', 'ncv', 500.00, '2025-12-17 12:25:35'),
(14, 1, 'test', 'rns', 500.00, '2025-12-17 12:25:35'),
(15, 1, 'test', 'vep', 500.00, '2025-12-17 12:25:35'),
(16, 2, 'registration', NULL, 200.00, '2025-12-17 12:25:35'),
(17, 2, 'test', 'bera', 500.00, '2025-12-17 12:25:35'),
(18, 2, 'test', 'ECG', 500.00, '2025-12-17 12:25:35'),
(19, 2, 'test', 'eeg', 500.00, '2025-12-17 12:25:35'),
(20, 2, 'test', 'EGG', 500.00, '2025-12-17 12:25:35'),
(21, 2, 'test', 'emg', 500.00, '2025-12-17 12:25:35'),
(22, 2, 'test', 'ncv', 500.00, '2025-12-17 12:25:35'),
(23, 2, 'test', 'rns', 500.00, '2025-12-17 12:25:35'),
(24, 2, 'test', 'vep', 500.00, '2025-12-17 12:25:35'),
(25, 3, 'registration', NULL, 200.00, '2025-12-17 12:25:35'),
(26, 3, 'test', 'bera', 500.00, '2025-12-17 12:25:35'),
(27, 3, 'test', 'ECG', 500.00, '2025-12-17 12:25:35'),
(28, 3, 'test', 'eeg', 500.00, '2025-12-17 12:25:35'),
(29, 3, 'test', 'EGG', 500.00, '2025-12-17 12:25:35'),
(30, 3, 'test', 'emg', 500.00, '2025-12-17 12:25:35'),
(31, 3, 'test', 'ncv', 500.00, '2025-12-17 12:25:35'),
(32, 3, 'test', 'rns', 500.00, '2025-12-17 12:25:35'),
(33, 3, 'test', 'vep', 500.00, '2025-12-17 12:25:35'),
(34, 4, 'registration', NULL, 200.00, '2025-12-17 12:25:35'),
(35, 4, 'test', 'bera', 500.00, '2025-12-17 12:25:35'),
(36, 4, 'test', 'ECG', 500.00, '2025-12-17 12:25:35'),
(37, 4, 'test', 'eeg', 500.00, '2025-12-17 12:25:35'),
(38, 4, 'test', 'EGG', 500.00, '2025-12-17 12:25:35'),
(39, 4, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(40, 4, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(41, 4, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(42, 4, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(43, 5, 'registration', NULL, 200.00, '2025-12-17 12:25:36'),
(44, 5, 'test', 'bera', 500.00, '2025-12-17 12:25:36'),
(45, 5, 'test', 'ECG', 500.00, '2025-12-17 12:25:36'),
(46, 5, 'test', 'eeg', 500.00, '2025-12-17 12:25:36'),
(47, 5, 'test', 'EGG', 500.00, '2025-12-17 12:25:36'),
(48, 5, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(49, 5, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(50, 5, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(51, 5, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(52, 6, 'registration', NULL, 200.00, '2025-12-17 12:25:36'),
(53, 6, 'test', 'bera', 500.00, '2025-12-17 12:25:36'),
(54, 6, 'test', 'ECG', 500.00, '2025-12-17 12:25:36'),
(55, 6, 'test', 'eeg', 500.00, '2025-12-17 12:25:36'),
(56, 6, 'test', 'EGG', 500.00, '2025-12-17 12:25:36'),
(57, 6, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(58, 6, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(59, 6, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(60, 6, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(61, 7, 'registration', NULL, 200.00, '2025-12-17 12:25:36'),
(62, 7, 'test', 'bera', 500.00, '2025-12-17 12:25:36'),
(63, 7, 'test', 'ECG', 500.00, '2025-12-17 12:25:36'),
(64, 7, 'test', 'eeg', 500.00, '2025-12-17 12:25:36'),
(65, 7, 'test', 'EGG', 500.00, '2025-12-17 12:25:36'),
(66, 7, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(67, 7, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(68, 7, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(69, 7, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(70, 8, 'registration', NULL, 200.00, '2025-12-17 12:25:36'),
(71, 8, 'test', 'bera', 500.00, '2025-12-17 12:25:36'),
(72, 8, 'test', 'ECG', 500.00, '2025-12-17 12:25:36'),
(73, 8, 'test', 'eeg', 500.00, '2025-12-17 12:25:36'),
(74, 8, 'test', 'EGG', 500.00, '2025-12-17 12:25:36'),
(75, 8, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(76, 8, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(77, 8, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(78, 8, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(79, 9, 'registration', NULL, 200.00, '2025-12-17 12:25:36'),
(80, 9, 'test', 'bera', 500.00, '2025-12-17 12:25:36'),
(81, 9, 'test', 'ECG', 500.00, '2025-12-17 12:25:36'),
(82, 9, 'test', 'eeg', 500.00, '2025-12-17 12:25:36'),
(83, 9, 'test', 'EGG', 500.00, '2025-12-17 12:25:36'),
(84, 9, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(85, 9, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(86, 9, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(87, 9, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(97, 11, 'registration', NULL, 200.00, '2025-12-17 12:25:36'),
(98, 11, 'test', 'bera', 500.00, '2025-12-17 12:25:36'),
(99, 11, 'test', 'ECG', 500.00, '2025-12-17 12:25:36'),
(100, 11, 'test', 'eeg', 500.00, '2025-12-17 12:25:36'),
(101, 11, 'test', 'EGG', 500.00, '2025-12-17 12:25:36'),
(102, 11, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(103, 11, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(104, 11, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(105, 11, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(106, 12, 'registration', NULL, 200.00, '2025-12-17 12:25:36'),
(107, 12, 'test', 'bera', 500.00, '2025-12-17 12:25:36'),
(108, 12, 'test', 'ECG', 500.00, '2025-12-17 12:25:36'),
(109, 12, 'test', 'eeg', 500.00, '2025-12-17 12:25:36'),
(110, 12, 'test', 'EGG', 500.00, '2025-12-17 12:25:36'),
(111, 12, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(112, 12, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(113, 12, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(114, 12, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(115, 13, 'registration', NULL, 200.00, '2025-12-17 12:25:36'),
(116, 13, 'test', 'bera', 500.00, '2025-12-17 12:25:36'),
(117, 13, 'test', 'ECG', 500.00, '2025-12-17 12:25:36'),
(118, 13, 'test', 'eeg', 500.00, '2025-12-17 12:25:36'),
(119, 13, 'test', 'EGG', 500.00, '2025-12-17 12:25:36'),
(120, 13, 'test', 'emg', 500.00, '2025-12-17 12:25:36'),
(121, 13, 'test', 'ncv', 500.00, '2025-12-17 12:25:36'),
(122, 13, 'test', 'rns', 500.00, '2025-12-17 12:25:36'),
(123, 13, 'test', 'vep', 500.00, '2025-12-17 12:25:36'),
(133, 10, 'registration', NULL, 300.00, '2025-12-18 18:17:47'),
(134, 10, 'test', 'bera', 600.00, '2025-12-18 18:17:47'),
(135, 10, 'test', 'ECG', 600.00, '2025-12-18 18:17:47'),
(136, 10, 'test', 'eeg', 600.00, '2025-12-18 18:17:47'),
(137, 10, 'test', 'EGG', 600.00, '2025-12-18 18:17:47'),
(138, 10, 'test', 'emg', 600.00, '2025-12-18 18:17:47'),
(139, 10, 'test', 'ncv', 600.00, '2025-12-18 18:17:47'),
(140, 10, 'test', 'rns', 600.00, '2025-12-18 18:17:47'),
(141, 10, 'test', 'vep', 600.00, '2025-12-18 18:17:47');

-- --------------------------------------------------------

--
-- Table structure for table `referral_sources`
--

CREATE TABLE `referral_sources` (
  `source_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `source_name` varchar(100) NOT NULL,
  `source_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `referral_sources`
--

INSERT INTO `referral_sources` (`source_id`, `branch_id`, `source_name`, `source_code`, `is_active`, `display_order`, `created_at`) VALUES
(1, 1, 'Doctor Referral', 'doctor_referral', 1, 1, '2025-12-17 21:24:37'),
(2, 1, 'Web Search', 'web_search', 1, 2, '2025-12-17 21:24:37'),
(3, 1, 'Social Media', 'social_media', 1, 3, '2025-12-17 21:24:37'),
(4, 1, 'Returning Patient', 'returning_patient', 1, 4, '2025-12-17 21:24:37'),
(5, 1, 'Local Event', 'local_event', 1, 5, '2025-12-17 21:24:37'),
(6, 1, 'Advertisement', 'advertisement', 1, 6, '2025-12-17 21:24:37'),
(7, 1, 'Employee', 'employee', 1, 7, '2025-12-17 21:24:37'),
(8, 1, 'Family', 'family', 1, 8, '2025-12-17 21:24:37'),
(9, 1, 'Self', 'self', 1, 9, '2025-12-17 21:24:37'),
(10, 1, 'Other', 'other', 1, 10, '2025-12-17 21:24:37'),
(11, 2, 'Doctor Referral', 'doctor_referral', 1, 1, '2025-12-17 21:24:37'),
(12, 2, 'Web Search', 'web_search', 1, 2, '2025-12-17 21:24:37'),
(13, 2, 'Social Media', 'social_media', 1, 3, '2025-12-17 21:24:37'),
(14, 2, 'Returning Patient', 'returning_patient', 1, 4, '2025-12-17 21:24:37'),
(15, 2, 'Local Event', 'local_event', 1, 5, '2025-12-17 21:24:37'),
(16, 2, 'Advertisement', 'advertisement', 1, 6, '2025-12-17 21:24:37'),
(17, 2, 'Employee', 'employee', 1, 7, '2025-12-17 21:24:37'),
(18, 2, 'Family', 'family', 1, 8, '2025-12-17 21:24:37'),
(19, 2, 'Self', 'self', 1, 9, '2025-12-17 21:24:37'),
(20, 2, 'Other', 'other', 1, 10, '2025-12-17 21:24:37'),
(21, 5, 'Doctor Referral', 'doctor_referral', 1, 1, '2025-12-17 21:24:37'),
(22, 5, 'Web Search', 'web_search', 1, 2, '2025-12-17 21:24:37'),
(23, 5, 'Social Media', 'social_media', 1, 3, '2025-12-17 21:24:37'),
(24, 5, 'Returning Patient', 'returning_patient', 1, 4, '2025-12-17 21:24:37'),
(25, 5, 'Local Event', 'local_event', 1, 5, '2025-12-17 21:24:37'),
(26, 5, 'Advertisement', 'advertisement', 1, 6, '2025-12-17 21:24:37'),
(27, 5, 'Employee', 'employee', 1, 7, '2025-12-17 21:24:37'),
(28, 5, 'Family', 'family', 1, 8, '2025-12-17 21:24:37'),
(29, 5, 'Self', 'self', 1, 9, '2025-12-17 21:24:37'),
(30, 5, 'Other', 'other', 1, 10, '2025-12-17 21:24:37');

-- --------------------------------------------------------

--
-- Table structure for table `registration`
--

CREATE TABLE `registration` (
  `registration_id` int(11) NOT NULL,
  `master_patient_id` bigint(20) UNSIGNED DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `inquiry_id` int(11) DEFAULT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `patient_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `age` varchar(50) DEFAULT NULL,
  `chief_complain` varchar(255) DEFAULT NULL,
  `referralSource` varchar(50) DEFAULT 'self',
  `reffered_by` text DEFAULT NULL,
  `occupation` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `consultation_type` varchar(50) DEFAULT 'in_clinic',
  `appointment_date` date DEFAULT NULL,
  `appointment_time` time DEFAULT NULL,
  `consultation_amount` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'cash',
  `remarks` text DEFAULT NULL,
  `doctor_notes` text DEFAULT NULL,
  `prescription` text DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `status` enum('Pending','Consulted','Closed') DEFAULT 'Pending',
  `refund_status` enum('no','initiated','completed') NOT NULL DEFAULT 'no',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `patient_photo_path` varchar(255) DEFAULT NULL,
  `referral_partner_id` int(11) DEFAULT NULL,
  `commission_amount` decimal(10,2) DEFAULT 0.00,
  `commission_status` enum('pending','paid') DEFAULT 'pending',
  `approval_status` enum('pending','approved','rejected') DEFAULT 'approved'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration`
--

INSERT INTO `registration` (`registration_id`, `master_patient_id`, `branch_id`, `inquiry_id`, `created_by_employee_id`, `patient_name`, `phone_number`, `email`, `gender`, `age`, `chief_complain`, `referralSource`, `reffered_by`, `occupation`, `address`, `consultation_type`, `appointment_date`, `appointment_time`, `consultation_amount`, `payment_method`, `remarks`, `doctor_notes`, `prescription`, `follow_up_date`, `status`, `refund_status`, `created_at`, `updated_at`, `patient_photo_path`, `referral_partner_id`, `commission_amount`, `commission_status`, `approval_status`) VALUES
(1, 1, 1, NULL, 2, 'Kumar gopal krishna', '7766905366', '', 'Male', '55', 'radiating_pain', 'self', 'Self', '', 'Barari', 'in-clinic', '2025-12-14', '11:00:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 10:51:05', '2025-12-17 10:00:35', NULL, 1, 200.00, 'pending', 'approved'),
(2, 2, 1, NULL, 2, 'Ponam kumari', '9473037876', '', 'Female', '50', 'neck_pain', 'self', 'Self', '', 'Choti khanjarpur', 'in-clinic', '2026-01-30', '11:00:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 10:52:12', '2026-01-30 07:30:56', NULL, 1, 200.00, 'pending', 'approved'),
(3, 3, 1, NULL, 2, 'Bandhana singh', '9801121814', '', 'Female', '60', 'low_back_pain', 'self', 'Self', '', 'Kahalgoan', 'in-clinic', '2025-12-15', '10:00:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 10:53:33', '2025-12-17 10:00:35', NULL, 1, 200.00, 'pending', 'approved'),
(4, 3, 1, NULL, 2, 'Gauri shankar singh', '9801121814', '', 'Male', '65', 'back_pain', 'self', 'Self', '', 'Kahalgoan', 'in-clinic', '2025-12-14', '09:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 10:54:27', '2025-12-17 10:00:35', NULL, 1, 200.00, 'pending', 'approved'),
(5, 4, 1, NULL, 2, 'Bhavya singh', '9931289759', '', 'Female', '1', 'other', 'doctor_referral', 'Dr A k Singh MD (Ped)', '', 'Lavanya', 'in-clinic', '2025-12-16', '10:00:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 10:55:47', '2025-12-17 12:25:35', NULL, 2, 200.00, 'pending', 'approved'),
(6, 5, 1, NULL, 2, 'Sangita singhaniya', '7781095941', '', 'Female', '1', 'other', 'self', 'Self', '', 'Khalifabhag', 'in-clinic', '2026-01-23', '12:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 10:57:19', '2026-01-22 22:46:10', NULL, 1, 200.00, 'pending', 'approved'),
(7, 6, 1, NULL, 2, 'Sweety kumari', '9508006378', '', 'Female', '45', 'neck_pain', 'self', 'Self', '', 'Vikramshila', 'in-clinic', '2025-12-14', '10:00:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 10:58:36', '2025-12-17 10:00:35', NULL, 1, 200.00, 'pending', 'approved'),
(8, 7, 1, NULL, 2, 'Kamini sukhla', '9801734004', '', 'Female', '60', 'other', 'self', 'Self', '', 'Adampur', 'in-clinic', '2026-01-23', '14:00:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:02:07', '2026-01-22 22:46:30', NULL, 1, 200.00, 'pending', 'approved'),
(9, 8, 1, NULL, 2, 'Sandeep suman', '8797568590', '', 'Male', '25', 'low_back_pain', 'doctor_referral', 'Dr G R Johar  D (Ortho)', '', 'Jagdishpur', 'in-clinic', '2026-01-30', '10:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:09:47', '2026-01-30 07:30:53', NULL, 3, 200.00, 'pending', 'approved'),
(10, 9, 1, NULL, 2, 'Kiran devi', '8102635424', '', 'Female', '40', 'low_back_pain', 'self', 'Self', '', 'Naugachia', 'in-clinic', '2025-12-02', '13:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:11:16', '2025-12-17 10:00:35', NULL, 1, 200.00, 'pending', 'approved'),
(11, 10, 1, NULL, 2, 'Aryan kumar', '8877875165', '', 'Male', '1', 'other', 'doctor_referral', 'Dr Kamran fazal MD,DCH', '', 'Munger', 'in-clinic', '2025-12-15', '10:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:13:42', '2025-12-17 12:25:35', NULL, 4, 200.00, 'pending', 'approved'),
(12, 11, 1, NULL, 2, 'Mahi noor', '926221615', '', 'Female', '2', 'other', 'doctor_referral', 'Dr Md khalil Ahemad MD (Ped)', '', 'Sanoula', 'in-clinic', '2025-12-14', '10:30:00', 600.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:16:15', '2025-12-17 12:25:36', NULL, 5, 200.00, 'pending', 'approved'),
(13, 12, 1, NULL, 2, 'Anchal kumari', '7645864984', '', 'Female', '29', 'neck_pain', 'self', 'Self', '', 'Kathalbari', 'in-clinic', '2025-12-15', '11:00:00', 600.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:17:28', '2025-12-17 10:00:35', NULL, 1, 200.00, 'pending', 'approved'),
(14, 13, 1, NULL, 2, 'Satyam kumar', '9199596520', '', 'Male', '1', 'other', 'doctor_referral', 'Dr R K Sinha MD (Ped)', '', 'Rajoun', 'in-clinic', '2025-12-02', '15:30:00', 600.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:18:59', '2025-12-17 12:25:36', NULL, 6, 200.00, 'pending', 'approved'),
(15, 14, 1, NULL, 2, 'Riyansh Raj', '9572950061', '', 'Male', '5', 'other', 'doctor_referral', 'Dr Amitabh singh D (Ortho)', '', 'Sultanganj', 'in-clinic', '2026-01-23', '13:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:21:38', '2026-01-22 22:46:21', NULL, 7, 200.00, 'pending', 'approved'),
(16, 15, 1, NULL, 2, 'D N Singh', '8292802562', '', 'Male', '70', 'neck_pain', 'self', 'Self', '', 'Bhagalpur', 'in-clinic', '2025-12-15', '11:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:23:06', '2025-12-17 10:00:35', NULL, 1, 200.00, 'pending', 'approved'),
(17, 16, 1, NULL, 2, 'Pushpa singh', '9608021243', '', 'Female', '60', 'other', 'self', 'Self', '', 'Sarai', 'in-clinic', '2026-01-30', '11:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:24:17', '2026-01-30 07:30:58', NULL, 1, 200.00, 'pending', 'approved'),
(18, 17, 1, NULL, 2, 'Ekra khatun', '8218014201', '', 'Female', '1', 'other', 'doctor_referral', 'Dr R K Sinha MD (Ped)', '', 'Ratanganj', 'in-clinic', '2025-12-25', '13:00:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:25:47', '2025-12-24 19:56:31', NULL, 6, 200.00, 'pending', 'approved'),
(19, 18, 1, NULL, 2, 'Sana Akhtar', '6202539853', '', 'Female', '4', 'other', 'self', 'Self', '', 'Kisandaspur', 'in-clinic', '2026-01-23', '13:00:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:32:57', '2026-01-22 22:46:16', NULL, 1, 200.00, 'pending', 'approved'),
(20, 19, 1, NULL, 2, 'Dimple bharti', '9304024182', '', 'Female', '35', 'neck_pain', 'self', 'Self', '', 'Lodipur', 'in-clinic', '2025-12-14', '11:30:00', 0.00, 'other', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-02 11:34:09', '2026-01-23 01:05:52', NULL, 1, 200.00, 'pending', 'approved'),
(21, 20, 1, NULL, 2, 'Sumit', '7729281910', '', 'Male', '22', 'Leg Pain', 'doctor_referral', 'Self', 'Student', 'Noida', 'in-clinic', '2025-12-05', '10:00:00', 600.00, 'cash', 'testing', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-05 10:57:06', '2025-12-17 10:00:35', NULL, 1, 200.00, 'pending', 'approved'),
(22, 21, 1, NULL, 2, 'Sumit', '7739182939', '', 'Male', '22', 'Testing', 'social_media', 'Dr R K Sinha MD (Ped)', 'Student', 'noida', 'in-clinic', '2025-12-16', '09:30:00', 600.00, 'cash', 'test', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-06 07:14:38', '2025-12-17 12:25:36', NULL, 6, 200.00, 'pending', 'approved'),
(23, 22, 1, NULL, 2, 'Test', '7789928393', '', 'Male', '22', 'Pain', 'returning_patient', 'Me', 'Student', 'delhi', 'in-clinic', '2025-12-12', '09:00:00', 600.00, 'cash', 'very bad', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-06 19:41:29', '2025-12-17 12:25:36', NULL, 8, 200.00, 'pending', 'approved'),
(24, 23, 1, NULL, 2, 'Sumit Sinha', '7739208200', '', 'Male', '24', 'Spine', 'returning_patient', 'Dr A k Singh MD (Ped)', 'Student', 'noida', 'in-clinic', '2025-12-15', '09:00:00', 600.00, 'cash', 'very bad', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-10 17:16:46', '2025-12-24 18:21:50', 'uploads/patient_photos/reg_24_1765387592.jpeg', 2, 200.00, 'pending', 'approved'),
(25, 24, 1, NULL, 2, 'Sonu', '4656524465', '', 'Male', '22', 'neck_pain', 'web_search', 'Self', '', '', 'in-clinic', '2025-12-15', '09:30:00', 600.00, 'card', '', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-10 17:28:04', '2025-12-17 10:00:35', 'uploads/patient_photos/reg_25_1765387684.jpeg', 1, 200.00, 'pending', 'approved'),
(26, 25, 1, NULL, 2, 'Priyanshu', '7394394339', '', 'Male', '24', 'Leg pain', 'returning_patient', 'Self', '', '', 'in-clinic', '2025-12-14', '09:00:00', 600.00, 'cash', 'none', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-10 19:23:10', '2025-12-17 10:00:35', 'uploads/patient_photos/reg_26_1765394590.jpeg', 1, 200.00, 'pending', 'approved'),
(27, 26, 1, NULL, 2, 'John Doe', '7338784737', '', 'Male', '22', 'neck_pain', 'social_media', 'Dr A K Bhagat MD (Phych)', '', '', 'in-clinic', '2025-12-13', '09:00:00', 600.00, 'upi-boi', '', NULL, NULL, NULL, 'Pending', 'no', '2025-12-12 20:51:06', '2026-01-23 01:06:01', NULL, 9, 200.00, 'pending', 'approved'),
(28, 27, 1, NULL, 2, 'Test', '7939489384', '', 'Male', '15days', 'neck_pain', 'local_event', 'Self', '', '', 'in-clinic', '2025-12-15', '12:00:00', 600.00, 'cash', '', NULL, NULL, NULL, 'Pending', 'no', '2025-12-15 09:48:07', '2026-01-23 01:05:59', NULL, 1, 200.00, 'pending', 'approved'),
(29, 28, 1, NULL, 2, 'Ishan Mishra', '737437333', '', 'Male', '23', 'spine problem', 'advertisement', 'Self', 'student', 'Noida', 'in-clinic', '2026-01-30', '12:00:00', 600.00, 'cash', 'spine injury due to too much sex', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-17 09:06:15', '2026-01-30 07:31:02', 'uploads/patient_photos/reg_29_1765962375.jpeg', 1, 200.00, 'pending', 'approved'),
(30, 31, 1, NULL, 2, 'test', '8929928829', '', 'Male', '20', 'neck_pain', 'self', 'Me', 'test', '', 'in_clinic', '2025-12-24', '09:30:00', 600.00, 'TEST', '', NULL, NULL, NULL, 'Closed', 'initiated', '2025-12-19 14:47:22', '2025-12-25 19:33:01', NULL, 8, 200.00, 'pending', 'approved'),
(31, 32, 1, NULL, 2, 'Sakshi', '7839928039', '', 'Female', '20', 'neck_pain', 'social_media', 'Self', 'student', 'Bihar', 'in_clinic', '2026-01-01', '09:00:00', 600.00, 'Cash', 'desktop app test.', NULL, NULL, NULL, 'Consulted', 'no', '2025-12-24 16:01:34', '2026-01-02 10:48:01', NULL, 1, 200.00, 'pending', 'approved'),
(32, 33, 1, NULL, 2, 'test', '1234567890', '', 'Male', '20', 'leg_pain, back_pain', 'doctor_referral', 'Dr A K Bhagat MD (Phych)', '', '', 'in_clinic', '2026-01-23', '11:00:00', 600.00, 'CASH, UPI-BOI', '', NULL, NULL, NULL, 'Closed', 'no', '2026-01-05 06:37:44', '2026-01-24 19:06:38', NULL, 9, 200.00, 'pending', 'approved'),
(33, 34, 1, NULL, 2, 'Ravi', '1111111111', '', 'Male', '22', 'leg_pain', 'social_media', 'Dr A k Singh MD (Ped)', '', 'noida', 'in_clinic', '2026-01-30', '10:00:00', 500.00, 'Cash', 'none', NULL, NULL, NULL, 'Pending', 'no', '2026-01-18 14:50:06', '2026-01-30 07:30:49', NULL, 2, 200.00, 'pending', 'pending'),
(34, 35, 1, NULL, 2, 'Sumit', '1234566789', '', 'Male', '23', 'leg_pain', 'social_media', 'Me', 'Student', 'noida', 'in_clinic', '2026-01-30', '09:00:00', 0.00, '', 'none', NULL, NULL, NULL, 'Pending', 'no', '2026-01-22 19:03:41', '2026-01-30 07:30:24', NULL, 8, 200.00, 'pending', 'pending'),
(35, 36, 1, NULL, 2, 'Sagar', '8938493437', '', 'Male', '24', 'back_pain', 'social_media', 'Dr G R Johar  D (Ortho)', 'Student', 'Noida', 'in_clinic', '2026-01-30', '09:30:00', 0.00, 'cash', 'none', NULL, NULL, NULL, 'Consulted', 'no', '2026-01-30 07:15:22', '2026-01-31 06:17:58', 'admin/desktop/server/uploads/patient_photos/reg_35_1769757322799.jpeg', 3, 200.00, 'pending', 'approved');

-- --------------------------------------------------------

--
-- Table structure for table `registration_payments`
--

CREATE TABLE `registration_payments` (
  `id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `registration_payments`
--

INSERT INTO `registration_payments` (`id`, `registration_id`, `payment_method`, `amount`, `created_at`) VALUES
(1, 32, 'CASH', 400.00, '2026-01-05 06:37:44'),
(2, 33, 'CASH', 750.00, '2026-01-18 14:50:06');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'admin'),
(3, 'developer'),
(2, 'reception');

-- --------------------------------------------------------

--
-- Table structure for table `role_login_keys`
--

CREATE TABLE `role_login_keys` (
  `id` int(11) NOT NULL,
  `key_name` varchar(100) NOT NULL COMMENT 'A descriptive name for the key, e.g., "Admin Master Key"',
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores master keys for role-based logins.';

-- --------------------------------------------------------

--
-- Table structure for table `service_tracks`
--

CREATE TABLE `service_tracks` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `button_label` varchar(255) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `theme_color` varchar(50) DEFAULT NULL,
  `fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fields`)),
  `pricing` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pricing`)),
  `scheduling` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`scheduling`)),
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_tracks`
--

INSERT INTO `service_tracks` (`id`, `name`, `button_label`, `icon`, `theme_color`, `fields`, `pricing`, `scheduling`, `permissions`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 'Physio', 'Physio3', 'Bone', '#212bc0', '[]', '{\"enabled\":true,\"model\":\"fixed-rate\",\"plans\":[{\"id\":\"0.8650003747084758\",\"icon\":\"HandHelping\",\"name\":\"Daily\",\"subtitle\":\"daily plan\",\"rate\":950,\"days\":1},{\"id\":\"0.7636522361758571\",\"icon\":\"HeartPulse\",\"name\":\"Advanced\",\"subtitle\":\"Advanced plan\",\"rate\":1000,\"days\":1},{\"id\":\"0.30808030445657664\",\"icon\":\"FlaskConical\",\"name\":\"RSDT\",\"subtitle\":\"Package\",\"rate\":2000,\"days\":20}],\"fixedRate\":0}', '{\"enabled\":true,\"slotInterval\":45,\"slotCapacity\":3,\"startTime\":\"09:00\",\"endTime\":\"18:00\"}', '{\"allowDiscount\":true,\"maxDiscountPercent\":20,\"requireDiscountApproval\":true,\"allowedPaymentMethods\":[\"Cash\",\"UPI\",\"CASH\",\"upi-hdfc\",\"cheque\",\"net_banking\",\"other\"],\"allowSplitPayment\":false}', 1, '2026-01-23 07:56:40', '2026-01-24 19:01:55'),
(3, 'Heart', 'heart', 'HeartPulse', '#c64600', '[]', '{\"enabled\":true,\"model\":\"fixed-rate\",\"plans\":[{\"id\":\"0.5956066537390072\",\"icon\":\"Clock\",\"name\":\"Daily\",\"subtitle\":\"daily payment\",\"rate\":2000,\"days\":1},{\"id\":\"0.029061961180821383\",\"icon\":\"Syringe\",\"name\":\"heart surgery\",\"subtitle\":\"surgery\",\"rate\":50000,\"days\":1}],\"fixedRate\":0}', '{\"enabled\":true,\"slotInterval\":120,\"slotCapacity\":1,\"startTime\":\"09:00\",\"endTime\":\"18:00\"}', '{\"allowDiscount\":true,\"maxDiscountPercent\":20,\"requireDiscountApproval\":true,\"allowedPaymentMethods\":[\"Cash\",\"UPI\",\"CASH\",\"upi-hdfc\",\"cheque\",\"net_banking\",\"other\"],\"allowSplitPayment\":true}', 1, '2026-01-27 10:45:16', '2026-01-27 10:45:16');

-- --------------------------------------------------------

--
-- Table structure for table `system_issues`
--

CREATE TABLE `system_issues` (
  `issue_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `reported_by` int(11) NOT NULL,
  `description` text NOT NULL,
  `status` enum('pending','in_progress','completed') DEFAULT 'pending',
  `release_schedule` enum('immediate','nightly','next_release') DEFAULT 'next_release',
  `release_date` datetime DEFAULT NULL,
  `admin_response` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_issues`
--

INSERT INTO `system_issues` (`issue_id`, `branch_id`, `reported_by`, `description`, `status`, `release_schedule`, `release_date`, `admin_response`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'testing', 'in_progress', 'next_release', '2025-12-04 00:00:00', 'OK', '2025-12-03 18:34:03', '2025-12-03 19:53:17'),
(2, 1, 2, 'Another testing', 'completed', 'next_release', NULL, '', '2025-12-03 18:44:02', '2025-12-03 19:53:48'),
(3, 1, 2, 'another test', 'pending', 'next_release', NULL, NULL, '2025-12-03 18:50:13', '2025-12-03 18:50:13'),
(4, 1, 2, 'test', 'pending', 'next_release', NULL, NULL, '2025-12-06 16:24:44', '2025-12-06 16:24:44');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `updated_at`, `updated_by`) VALUES
('allowed_dev_ips', '[]', '2026-01-21 13:19:59', NULL),
('maintenance_message', 'The system is currently undergoing scheduled maintenance. Please try again later.', '2026-01-21 13:19:59', NULL),
('maintenance_mode', '0', '2026-01-21 13:19:59', NULL),
('min_app_version', '1.0.0', '2026-01-21 13:19:59', NULL),
('min_auth_version', '1', '2026-01-23 06:57:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tests`
--

CREATE TABLE `tests` (
  `test_id` int(11) NOT NULL,
  `test_uid` varchar(20) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `inquiry_id` int(11) DEFAULT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `visit_date` date NOT NULL,
  `assigned_test_date` date NOT NULL,
  `patient_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `age` varchar(50) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `parents` text DEFAULT NULL,
  `relation` text DEFAULT NULL,
  `alternate_phone_no` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `limb` varchar(50) DEFAULT 'none',
  `test_name` varchar(100) NOT NULL,
  `referred_by` varchar(100) DEFAULT NULL,
  `test_done_by` varchar(100) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `advance_amount` decimal(10,2) DEFAULT 0.00,
  `due_amount` decimal(10,2) DEFAULT 0.00,
  `discount` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'cash',
  `payment_status` enum('pending','partial','paid') DEFAULT 'pending',
  `refund_status` enum('no','initiated','completed') NOT NULL DEFAULT 'no',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `test_status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `referral_partner_id` int(11) DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') DEFAULT 'approved'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tests`
--

INSERT INTO `tests` (`test_id`, `test_uid`, `branch_id`, `patient_id`, `inquiry_id`, `created_by_employee_id`, `visit_date`, `assigned_test_date`, `patient_name`, `phone_number`, `gender`, `age`, `dob`, `parents`, `relation`, `alternate_phone_no`, `address`, `limb`, `test_name`, `referred_by`, `test_done_by`, `total_amount`, `advance_amount`, `due_amount`, `discount`, `payment_method`, `payment_status`, `refund_status`, `created_at`, `updated_at`, `test_status`, `referral_partner_id`, `approval_status`) VALUES
(1, '25120201', 1, NULL, NULL, 2, '2025-12-02', '2025-12-02', 'Aryan kumar', '7632039813', 'Male', '19', '2025-12-02', NULL, NULL, NULL, NULL, NULL, 'eeg', 'Dr. Pankaj Kumar MCh (Neuro Surgery)', 'sayan', 2000.00, 2000.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 11:48:37', '2025-12-17 09:37:55', 'completed', 10, 'approved'),
(2, '25120202', 1, NULL, NULL, 2, '2025-12-02', '2025-12-02', 'Suraj kumar', '9708592264', 'Male', '25', '2025-12-02', NULL, NULL, NULL, NULL, NULL, 'eeg', 'Dr A K Bhagat MD (Phych)', 'sayan', 2000.00, 2000.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 11:49:54', '2025-12-17 09:37:55', 'completed', 9, 'approved'),
(3, '25120203', 1, NULL, NULL, 2, '2025-12-02', '2025-12-02', 'Aakash mishra', '9801556177', 'Male', '26', '2025-12-02', NULL, NULL, NULL, NULL, 'upper_limb', 'ncv', 'Dr Sheentanshu shekhar D (Ortho)', 'pancham', 3000.00, 3000.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 11:52:08', '2025-12-17 09:37:55', 'completed', 11, 'approved'),
(4, '25120204', 1, NULL, NULL, 2, '2025-12-02', '2025-12-02', 'Sri raj', '7352311627', 'Male', '0', NULL, NULL, NULL, NULL, NULL, NULL, 'eeg', 'Dr A k Singh MD (Ped)', 'sayan', 2000.00, 2000.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 11:54:34', '2025-12-17 09:37:55', 'completed', 2, 'approved'),
(5, '25120205', 1, NULL, NULL, 2, '2025-12-02', '2025-12-02', 'Binod Prasad singh', '7368034526', 'Male', '70', '2025-12-02', NULL, NULL, NULL, NULL, NULL, 'eeg', 'Dr P B Mishra MD (Ped)', 'ashish', 2000.00, 1800.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 11:56:19', '2025-12-17 09:37:55', 'completed', 12, 'approved'),
(6, '25120206', 1, NULL, NULL, 2, '2025-12-02', '2025-12-02', 'Ankita kumari', '8271949016', 'Female', '5', '2025-12-02', NULL, NULL, NULL, NULL, NULL, 'eeg', 'JLNMCH Bhagalpur', 'sayan', 2000.00, 2000.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 11:57:42', '2025-12-17 09:37:55', 'completed', 13, 'approved'),
(7, '25120207', 1, NULL, NULL, 2, '2025-12-02', '2025-12-02', 'Rajnesh kumar', '9693822951', 'Male', '26', NULL, NULL, NULL, NULL, NULL, NULL, 'eeg', 'Dr. Pankaj Kumar MCh (Neuro Surgery)', 'ashish', 2000.00, 2000.00, 0.00, NULL, 'upi-boi', 'paid', 'no', '2025-12-02 11:58:48', '2025-12-17 12:26:13', 'completed', 10, 'approved'),
(14, '25120301', 1, NULL, NULL, 2, '2025-12-03', '2025-12-03', 'Test', '1122334455', 'Male', '22', NULL, NULL, NULL, NULL, NULL, 'both', 'eeg', 'Self', 'pancham', 2000.00, 2000.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 19:47:42', '2025-12-17 09:37:55', 'pending', 1, 'approved'),
(15, '25120302', 1, NULL, NULL, 2, '2025-12-03', '2025-12-03', 'Test', '1122334455', 'Male', '22', NULL, NULL, NULL, NULL, NULL, 'both', 'ncv', 'Self', 'pancham', 2000.00, 2000.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 19:47:42', '2025-12-17 09:37:55', 'pending', 1, 'approved'),
(16, '25120303', 1, NULL, NULL, 2, '2025-12-03', '2025-12-03', 'Test', '1122334455', 'Male', '22', NULL, NULL, NULL, NULL, NULL, 'both', 'bera', 'Self', 'pancham', 2500.00, 2500.00, 0.00, NULL, 'cash', 'paid', 'no', '2025-12-02 19:47:42', '2025-12-17 09:37:55', 'pending', 1, 'approved'),
(17, '25120304', 1, NULL, NULL, 2, '2025-12-03', '2025-12-03', 'Test', '1122334455', 'Male', '22', NULL, NULL, NULL, NULL, NULL, 'both', 'ECG', 'Self', 'pancham', 2000.00, 221.00, 1779.00, NULL, 'cash', 'pending', 'no', '2025-12-02 19:47:42', '2025-12-17 09:37:55', 'pending', 1, 'approved'),
(18, '25120305', 1, NULL, NULL, 2, '2025-12-03', '2025-12-03', 'Test2', '1234567890', 'Female', '20', NULL, NULL, NULL, NULL, NULL, 'both', 'EEG, NCV, EMG, EGG', 'Self', 'ashish', 14000.00, 11089.00, 2911.00, 0.00, 'upi-boi', 'partial', 'no', '2025-12-02 20:01:40', '2025-12-17 09:37:55', 'completed', 1, 'approved'),
(19, '25120306', 1, 4, NULL, NULL, '2025-12-03', '2025-12-03', 'Kamini sukhla', '9801734004', 'Female', '60', NULL, NULL, NULL, NULL, NULL, 'upper_limb', 'emg', 'Self', 'pancham', 2000.00, 2000.00, 0.00, 0.00, 'cash', 'paid', 'no', '2025-12-03 09:34:47', '2025-12-17 09:37:55', 'pending', 1, 'approved'),
(20, '25120501', 1, NULL, NULL, 2, '2025-12-05', '2025-12-05', 'Sumit', '7739208312', 'Male', '22', NULL, '', '', '', NULL, 'upper_limb', 'EEG, NCV, ECG', 'Self', 'pancham', 5500.00, 5500.00, 0.00, 0.00, 'upi-boi', 'paid', 'no', '2025-12-05 11:01:30', '2025-12-17 09:37:55', 'completed', 1, 'approved'),
(21, '25120701', 1, NULL, NULL, 2, '2025-12-07', '2025-12-07', 'Another Test', '', 'Male', '22', '2002-12-28', 'SK', 'Father', '', NULL, 'both', 'EEG, NCV, EMG, RNS, BERA, VEP, EGG', 'Me', 'ashish', 15500.00, 15500.00, 0.00, 0.00, 'upi-boi', 'paid', 'no', '2025-12-06 19:43:22', '2025-12-17 09:37:55', 'completed', 8, 'approved'),
(22, '25121601', 1, 15, NULL, NULL, '2025-12-16', '2025-12-16', 'Test', '7939489384', 'Male', '', NULL, NULL, NULL, NULL, NULL, NULL, 'eeg', 'Self', 'achal', 2000.00, 2000.00, 0.00, 0.00, 'cash', 'paid', 'no', '2025-12-15 19:21:52', '2025-12-17 09:37:55', 'completed', 1, 'approved'),
(23, '25122401', 1, NULL, NULL, 2, '2025-12-24', '2025-12-24', 'Saskhi', '7839128938', 'Female', '20', NULL, NULL, NULL, NULL, NULL, 'lower_limb', 'EEG, EMG', 'Self', 'Achal', 4500.00, 3500.00, 800.00, 200.00, 'UPI-BOI', 'partial', 'no', '2025-12-24 16:17:54', '2025-12-24 16:17:54', 'pending', 1, 'approved'),
(24, '26010201', 1, NULL, NULL, 1, '2026-01-02', '2026-01-02', 'Sumit', '', 'Male', '20', NULL, NULL, NULL, NULL, NULL, 'lower_limb', 'EEG, NCV', 'Dr Pranav', 'Achal', 4000.00, 3500.00, 0.00, 500.00, 'UPI-BOI', 'paid', 'no', '2026-01-02 10:08:24', '2026-01-02 10:09:31', 'completed', NULL, 'approved'),
(25, '26011401', 1, NULL, NULL, 2, '2026-01-14', '2026-01-14', 'test', '1111111111', 'Male', '22', NULL, NULL, NULL, NULL, 'test', 'upper_limb', 'NCV, BERA', 'Me', 'Ashish', 4200.00, 4000.00, 0.00, 200.00, 'upi-hdfc', 'paid', 'no', '2026-01-22 19:31:08', '2026-01-22 22:02:03', 'pending', 8, 'approved'),
(26, '26012301', 1, NULL, NULL, 2, '2026-01-23', '2026-01-23', 'Priya', '', 'Female', '23', NULL, NULL, NULL, NULL, 'Noida', 'upper_limb', 'NCV', 'Me', 'Ashish', 2000.00, 0.00, 2000.00, 0.00, '', 'pending', 'no', '2026-01-22 19:31:08', '2026-01-22 22:01:58', 'pending', 8, 'approved'),
(27, '26012302', 1, NULL, NULL, 2, '2026-01-23', '2026-01-23', 'Anshu', '', 'Female', '20', NULL, NULL, NULL, NULL, 'Delhi', 'both', 'EMG', 'Me', 'Pancham', 2500.00, 0.00, 2500.00, 0.00, '', 'pending', 'no', '2026-01-22 19:34:08', '2026-01-22 20:39:22', 'pending', 8, 'approved'),
(30, '26012303', 1, NULL, NULL, 2, '2026-01-23', '2026-01-23', 'dis', '', 'Female', '20', NULL, NULL, NULL, NULL, 'discount', NULL, 'EMG', 'Dr A K Bhagat MD (Phych)', 'Pancham', 2500.00, 2000.00, 0.00, 500.00, 'CASH', 'paid', 'no', '2026-01-22 22:11:34', '2026-01-22 22:30:05', 'pending', 9, 'approved'),
(31, '26013001', 1, NULL, NULL, 2, '2026-01-30', '2026-01-30', 'Sagar', '', 'Male', '24', NULL, NULL, NULL, NULL, 'Noida', 'both', 'NCV, EMG', 'Dr Amitabh singh D (Ortho)', 'Ashish', 4500.00, 0.00, 4500.00, 0.00, 'cash', 'pending', 'no', '2026-01-30 07:14:09', '2026-01-30 07:14:09', 'pending', 7, 'pending'),
(32, '26013101', 1, 20, NULL, 2, '2026-01-31', '2026-01-31', 'Ravi', '1111111111', 'Male', '22', NULL, NULL, NULL, NULL, NULL, NULL, 'NCV', 'Dr A k Singh MD (Ped)', '', 2000.00, 0.00, 2000.00, 0.00, 'cash', 'pending', 'no', '2026-01-31 05:31:22', '2026-01-31 05:31:22', 'pending', 2, 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `tests_lists`
--

CREATE TABLE `tests_lists` (
  `test_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `test_name` varchar(100) NOT NULL,
  `default_amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `test_inquiry`
--

CREATE TABLE `test_inquiry` (
  `inquiry_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `testname` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `reffered_by` varchar(100) DEFAULT NULL,
  `mobile_number` varchar(20) NOT NULL,
  `limb` varchar(100) DEFAULT NULL,
  `test_done_by` varchar(100) DEFAULT NULL,
  `assigned_test_date` date DEFAULT NULL,
  `expected_visit_date` date DEFAULT NULL,
  `status` enum('visited','cancelled','pending') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `test_inquiry`
--

INSERT INTO `test_inquiry` (`inquiry_id`, `branch_id`, `created_by_employee_id`, `name`, `testname`, `address`, `reffered_by`, `mobile_number`, `limb`, `test_done_by`, `assigned_test_date`, `expected_visit_date`, `status`, `created_at`) VALUES
(1, 1, 2, 'ANother test', 'vep', NULL, 'Me', '7933493493', NULL, NULL, NULL, '2025-12-07', 'visited', '2025-12-06 19:44:07'),
(2, 1, 2, 'Mahi', 'eeg', NULL, 'Self', '8398938438', NULL, NULL, NULL, '2026-01-24', 'visited', '2025-12-24 17:11:50'),
(3, 1, 2, 'Sumit', 'emg', NULL, 'test', '8934938433', NULL, NULL, NULL, '2026-01-31', 'visited', '2026-01-30 07:13:22');

-- --------------------------------------------------------

--
-- Table structure for table `test_items`
--

CREATE TABLE `test_items` (
  `item_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL COMMENT '\r\n',
  `created_by_employee_id` int(11) DEFAULT NULL,
  `assigned_test_date` date NOT NULL,
  `test_name` varchar(100) NOT NULL,
  `limb` varchar(50) DEFAULT NULL,
  `referred_by` varchar(100) DEFAULT NULL,
  `test_done_by` varchar(100) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `advance_amount` decimal(10,2) DEFAULT 0.00,
  `due_amount` decimal(10,2) DEFAULT 0.00,
  `discount` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'cash',
  `test_status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
  `refund_status` enum('no','initiated','completed') NOT NULL DEFAULT 'no',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `referral_partner_id` int(11) DEFAULT NULL,
  `commission_amount` decimal(10,2) DEFAULT 0.00,
  `commission_status` enum('pending','paid') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `test_items`
--

INSERT INTO `test_items` (`item_id`, `test_id`, `created_by_employee_id`, `assigned_test_date`, `test_name`, `limb`, `referred_by`, `test_done_by`, `total_amount`, `advance_amount`, `due_amount`, `discount`, `payment_method`, `test_status`, `payment_status`, `refund_status`, `created_at`, `referral_partner_id`, `commission_amount`, `commission_status`) VALUES
(1, 18, 2, '2025-12-03', 'eeg', 'both', 'Self', 'ashish', 2000.00, 2000.00, 0.00, NULL, 'upi-boi', 'completed', 'partial', 'no', '2025-12-02 20:01:40', 1, 500.00, 'pending'),
(2, 18, 2, '2025-12-03', 'ncv', 'both', 'Self', 'ashish', 2000.00, 2000.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-02 20:01:40', 1, 500.00, 'pending'),
(3, 18, 2, '2025-12-03', 'emg', 'both', 'Self', 'ashish', 2500.00, 2500.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-02 20:01:40', 1, 500.00, 'pending'),
(4, 18, 2, '2025-12-03', 'EGG', 'both', 'Self', 'ashish', 2500.00, 289.00, 2211.00, NULL, 'upi-boi', 'completed', 'partial', 'no', '2025-12-02 20:01:40', 1, 500.00, 'pending'),
(5, 18, NULL, '2025-12-03', 'ncv', 'upper_limb', 'self', 'achal', 2000.00, 1800.00, 200.00, 0.00, 'cash', 'completed', 'pending', 'no', '2025-12-02 20:24:26', 1, 500.00, 'pending'),
(6, 18, NULL, '2025-12-03', 'bera', 'both', 'self', 'sayan', 3000.00, 2500.00, 500.00, 0.00, 'cash', 'completed', 'pending', 'no', '2025-12-02 20:30:26', 1, 500.00, 'pending'),
(7, 20, 2, '2025-12-05', 'eeg', 'upper_limb', 'Self', 'pancham', 2000.00, 2000.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-05 11:01:30', 1, 500.00, 'pending'),
(8, 20, 2, '2025-12-05', 'ncv', 'upper_limb', 'Self', 'pancham', 1500.00, 1500.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-05 11:01:30', 1, 500.00, 'pending'),
(9, 20, 2, '2025-12-05', 'ECG', 'upper_limb', 'Self', 'pancham', 2000.00, 2000.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-05 11:01:30', 1, 500.00, 'paid'),
(10, 21, 2, '2025-12-07', 'eeg', 'both', 'Me', 'ashish', 2000.00, 2000.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-06 19:43:22', 8, 500.00, 'pending'),
(11, 21, 2, '2025-12-07', 'ncv', 'both', 'Me', 'ashish', 3000.00, 3000.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-06 19:43:22', 8, 500.00, 'pending'),
(12, 21, 2, '2025-12-07', 'emg', 'both', 'Me', 'ashish', 2500.00, 2500.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-06 19:43:22', 8, 500.00, 'pending'),
(13, 21, 2, '2025-12-07', 'rns', 'both', 'Me', 'ashish', 1500.00, 1500.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-06 19:43:22', 8, 500.00, 'pending'),
(14, 21, 2, '2025-12-07', 'bera', 'both', 'Me', 'ashish', 3000.00, 3000.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-06 19:43:22', 8, 500.00, 'pending'),
(15, 21, 2, '2025-12-07', 'vep', 'both', 'Me', 'ashish', 1500.00, 1500.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-06 19:43:22', 8, 500.00, 'pending'),
(16, 21, 2, '2025-12-07', 'EGG', 'both', 'Me', 'ashish', 2000.00, 2000.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-06 19:43:22', 8, 500.00, 'pending'),
(17, 1, 2, '2025-12-02', 'eeg', NULL, 'Dr. Pankaj Kumar MCh (Neuro Surgery)', 'sayan', 2000.00, 2000.00, 0.00, NULL, 'cash', 'completed', 'paid', 'no', '2025-12-02 11:48:37', 10, 600.00, 'pending'),
(18, 2, 2, '2025-12-02', 'eeg', NULL, 'Dr A K Bhagat MD (Phych)', 'sayan', 2000.00, 2000.00, 0.00, NULL, 'cash', 'completed', 'paid', 'no', '2025-12-02 11:49:54', 9, 500.00, 'pending'),
(19, 3, 2, '2025-12-02', 'ncv', 'upper_limb', 'Dr Sheentanshu shekhar D (Ortho)', 'pancham', 3000.00, 3000.00, 0.00, NULL, 'cash', 'completed', 'paid', 'no', '2025-12-02 11:52:08', 11, 500.00, 'pending'),
(20, 4, 2, '2025-12-02', 'eeg', NULL, 'Dr A k Singh MD (Ped)', 'sayan', 2000.00, 2000.00, 0.00, NULL, 'cash', 'completed', 'paid', 'no', '2025-12-02 11:54:34', 2, 500.00, 'pending'),
(21, 5, 2, '2025-12-02', 'eeg', NULL, 'Dr P B Mishra MD (Ped)', 'ashish', 2000.00, 1800.00, 0.00, NULL, 'cash', 'completed', 'paid', 'no', '2025-12-02 11:56:19', 12, 500.00, 'pending'),
(22, 6, 2, '2025-12-02', 'eeg', NULL, 'JLNMCH Bhagalpur', 'sayan', 2000.00, 2000.00, 0.00, NULL, 'cash', 'completed', 'paid', 'no', '2025-12-02 11:57:42', 13, 500.00, 'pending'),
(23, 7, 2, '2025-12-02', 'eeg', NULL, 'Dr. Pankaj Kumar MCh (Neuro Surgery)', 'ashish', 2000.00, 2000.00, 0.00, NULL, 'upi-boi', 'completed', 'paid', 'no', '2025-12-02 11:58:48', 10, 600.00, 'pending'),
(24, 14, 2, '2025-12-03', 'eeg', 'both', 'Self', 'pancham', 2000.00, 2000.00, 0.00, NULL, 'cash', 'pending', 'paid', 'no', '2025-12-02 19:47:42', 1, 500.00, 'pending'),
(25, 15, 2, '2025-12-03', 'ncv', 'both', 'Self', 'pancham', 2000.00, 2000.00, 0.00, NULL, 'cash', 'pending', 'paid', 'no', '2025-12-02 19:47:42', 1, 500.00, 'pending'),
(26, 16, 2, '2025-12-03', 'bera', 'both', 'Self', 'pancham', 2500.00, 2500.00, 0.00, NULL, 'cash', 'pending', 'paid', 'no', '2025-12-02 19:47:42', 1, 500.00, 'pending'),
(27, 17, 2, '2025-12-03', 'ECG', 'both', 'Self', 'pancham', 2000.00, 221.00, 1779.00, NULL, 'cash', 'pending', 'pending', 'no', '2025-12-02 19:47:42', 1, 500.00, 'pending'),
(28, 19, NULL, '2025-12-03', 'emg', 'upper_limb', 'Self', 'pancham', 2000.00, 2000.00, 0.00, 0.00, 'cash', 'pending', 'paid', 'no', '2025-12-03 09:34:47', 1, 500.00, 'pending'),
(29, 22, NULL, '2025-12-16', 'eeg', NULL, 'Self', 'achal', 2000.00, 2000.00, 0.00, 0.00, 'cash', 'completed', 'paid', 'no', '2025-12-15 19:21:52', 1, 500.00, 'pending'),
(30, 23, 2, '2025-12-24', 'eeg', 'lower_limb', 'Self', 'Achal', 2000.00, 2000.00, 0.00, 0.00, 'UPI-BOI', 'pending', 'paid', 'no', '2025-12-24 16:17:54', 1, 500.00, 'pending'),
(31, 23, 2, '2025-12-24', 'emg', 'lower_limb', 'Self', 'Achal', 2500.00, 1500.00, 800.00, 200.00, 'UPI-BOI', 'pending', 'partial', 'no', '2025-12-24 16:17:54', 1, 500.00, 'pending'),
(32, 24, 1, '2026-01-02', 'eeg', 'lower_limb', 'Dr Pranav', 'Achal', 2000.00, 2000.00, 0.00, 0.00, 'UPI-BOI', 'completed', 'paid', 'no', '2026-01-02 10:08:24', NULL, 0.00, 'pending'),
(33, 24, 1, '2026-01-02', 'ncv', 'lower_limb', 'Dr Pranav', 'Achal', 2000.00, 1500.00, 0.00, 500.00, 'UPI-BOI', 'completed', 'paid', 'no', '2026-01-02 10:08:24', NULL, 0.00, 'pending'),
(34, 25, 2, '2026-01-14', 'ncv', 'upper_limb', 'Me', 'Ashish', 2000.00, 2000.00, 0.00, 0.00, 'upi-hdfc', 'pending', 'paid', 'no', '2026-01-14 12:26:10', 8, 500.00, 'pending'),
(35, 25, 2, '2026-01-14', 'bera', 'upper_limb', 'Me', 'Ashish', 2200.00, 2000.00, 0.00, 200.00, 'upi-hdfc', 'pending', 'paid', 'no', '2026-01-14 12:26:10', 8, 500.00, 'pending'),
(36, 26, 2, '2026-01-23', 'ncv', 'upper_limb', 'Me', 'Ashish', 2000.00, 0.00, 2000.00, 0.00, '', 'pending', 'pending', 'no', '2026-01-22 19:31:08', 8, 500.00, 'pending'),
(37, 27, 2, '2026-01-23', 'emg', 'both', 'Me', 'Pancham', 2500.00, 0.00, 2500.00, 0.00, '', 'pending', 'pending', 'no', '2026-01-22 19:34:08', 8, 500.00, 'pending'),
(38, 30, 2, '2026-01-23', 'emg', NULL, 'Dr A K Bhagat MD (Phych)', 'Pancham', 2500.00, 2000.00, 0.00, 500.00, 'CASH', 'pending', 'paid', 'no', '2026-01-22 22:11:34', 9, 500.00, 'pending'),
(39, 31, 2, '2026-01-30', 'ncv', 'both', 'Dr Amitabh singh D (Ortho)', 'Ashish', 2000.00, 0.00, 2000.00, 0.00, 'cash', 'pending', 'pending', 'no', '2026-01-30 07:14:09', 7, 500.00, 'pending'),
(40, 31, 2, '2026-01-30', 'emg', 'both', 'Dr Amitabh singh D (Ortho)', 'Ashish', 2500.00, 0.00, 2500.00, 0.00, 'cash', 'pending', 'pending', 'no', '2026-01-30 07:14:09', 7, 500.00, 'pending'),
(41, 32, 2, '2026-01-31', 'NCV', NULL, 'Dr A k Singh MD (Ped)', '', 2000.00, 0.00, 2000.00, 0.00, 'cash', 'pending', 'pending', 'no', '2026-01-31 05:31:22', 2, 500.00, 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `test_payments`
--

CREATE TABLE `test_payments` (
  `id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `test_payments`
--

INSERT INTO `test_payments` (`id`, `test_id`, `payment_method`, `amount`, `created_at`) VALUES
(1, 24, 'CASH', 2000.00, '2026-01-02 10:08:24'),
(2, 24, 'UPI-BOI', 1000.00, '2026-01-02 10:08:24'),
(3, 25, 'CASH', 2000.00, '2026-01-14 12:26:10'),
(4, 25, 'upi-hdfc', 2000.00, '2026-01-14 12:26:10'),
(5, 30, 'CASH', 2000.00, '2026-01-22 22:11:34');

-- --------------------------------------------------------

--
-- Table structure for table `test_staff`
--

CREATE TABLE `test_staff` (
  `staff_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `staff_name` varchar(100) NOT NULL,
  `job_title` varchar(100) DEFAULT 'Technician',
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `test_staff`
--

INSERT INTO `test_staff` (`staff_id`, `branch_id`, `staff_name`, `job_title`, `is_active`, `display_order`, `created_at`) VALUES
(1, 2, 'Achal', 'Technician', 1, 1, '2025-12-17 19:44:14'),
(2, 1, 'Achal', 'Technician', 0, 1, '2025-12-17 19:44:14'),
(3, 5, 'Achal', 'Technician', 1, 1, '2025-12-17 19:44:14'),
(4, 2, 'Ashish', 'Technician', 1, 2, '2025-12-17 19:44:14'),
(5, 1, 'Ashish', 'Technician', 1, 2, '2025-12-17 19:44:14'),
(6, 5, 'Ashish', 'Technician', 1, 2, '2025-12-17 19:44:14'),
(7, 2, 'Pancham', 'Technician', 1, 3, '2025-12-17 19:44:14'),
(8, 1, 'Pancham', 'Technician', 1, 3, '2025-12-17 19:44:14'),
(9, 5, 'Pancham', 'Technician', 1, 3, '2025-12-17 19:44:14'),
(10, 2, 'Sayan', 'Technician', 1, 4, '2025-12-17 19:44:14'),
(11, 1, 'Sayan', 'Technician', 1, 4, '2025-12-17 19:44:14'),
(12, 5, 'Sayan', 'Technician', 1, 4, '2025-12-17 19:44:14');

-- --------------------------------------------------------

--
-- Table structure for table `test_types`
--

CREATE TABLE `test_types` (
  `test_type_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `test_name` varchar(100) NOT NULL,
  `test_code` varchar(50) NOT NULL,
  `default_cost` decimal(10,2) DEFAULT 0.00,
  `requires_limb_selection` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `test_types`
--

INSERT INTO `test_types` (`test_type_id`, `branch_id`, `test_name`, `test_code`, `default_cost`, `requires_limb_selection`, `is_active`, `display_order`, `created_at`) VALUES
(1, 2, 'EEG', 'eeg', 1500.00, 0, 1, 1, '2025-12-17 19:54:29'),
(2, 1, 'EEGs', 'eeg', 2000.00, 0, 0, 1, '2025-12-17 19:54:29'),
(3, 5, 'EEG', 'eeg', 1500.00, 0, 1, 1, '2025-12-17 19:54:29'),
(4, 2, 'NCV', 'ncv', 2000.00, 1, 1, 2, '2025-12-17 19:54:29'),
(5, 1, 'NCV', 'ncv', 2000.00, 1, 1, 2, '2025-12-17 19:54:29'),
(6, 5, 'NCV', 'ncv', 2000.00, 1, 1, 2, '2025-12-17 19:54:29'),
(7, 2, 'EMG', 'emg', 2500.00, 1, 1, 3, '2025-12-17 19:54:29'),
(8, 1, 'EMG', 'emg', 2500.00, 1, 1, 3, '2025-12-17 19:54:29'),
(9, 5, 'EMG', 'emg', 2500.00, 1, 1, 3, '2025-12-17 19:54:29'),
(10, 2, 'RNS', 'rns', 1800.00, 0, 1, 4, '2025-12-17 19:54:29'),
(11, 1, 'RNS', 'rns', 1800.00, 0, 1, 4, '2025-12-17 19:54:29'),
(12, 5, 'RNS', 'rns', 1800.00, 0, 1, 4, '2025-12-17 19:54:29'),
(13, 2, 'BERA', 'bera', 2200.00, 0, 1, 5, '2025-12-17 19:54:29'),
(14, 1, 'BERA', 'bera', 2200.00, 0, 1, 5, '2025-12-17 19:54:29'),
(15, 5, 'BERA', 'bera', 2200.00, 0, 1, 5, '2025-12-17 19:54:29'),
(16, 2, 'VEP', 'vep', 1900.00, 0, 1, 6, '2025-12-17 19:54:29'),
(17, 1, 'VEP', 'vep', 1900.00, 0, 1, 6, '2025-12-17 19:54:29'),
(18, 5, 'VEP', 'vep', 1900.00, 0, 1, 6, '2025-12-17 19:54:29'),
(19, 2, 'Other', 'other', 0.00, 0, 1, 7, '2025-12-17 19:54:29'),
(20, 1, 'Other', 'other', 0.00, 0, 1, 7, '2025-12-17 19:54:29'),
(21, 5, 'Other', 'other', 0.00, 0, 1, 7, '2025-12-17 19:54:29');

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `token_id` bigint(20) UNSIGNED NOT NULL,
  `token_uid` varchar(20) NOT NULL COMMENT 'Human-readable token ID, e.g., T251010-01',
  `branch_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `created_by_employee_id` int(11) DEFAULT NULL,
  `service_type` varchar(50) NOT NULL COMMENT 'e.g., physio, speech_therapy, occupational_therapy',
  `token_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tokens`
--

INSERT INTO `tokens` (`token_id`, `token_uid`, `branch_id`, `patient_id`, `created_by_employee_id`, `service_type`, `token_date`, `created_at`) VALUES
(1, 'T251213-01', 1, 13, 2, 'physio', '2025-12-13', '2025-12-12 18:54:09'),
(2, 'T251216-01', 1, 15, 2, 'physio', '2025-12-16', '2025-12-15 19:17:51'),
(3, 'T251217-01', 1, 16, 2, 'physio', '2025-12-17', '2025-12-17 09:07:50'),
(4, 'T251217-02', 1, 15, 2, 'physio', '2025-12-17', '2025-12-17 16:09:23'),
(5, 'T251217-03', 1, 14, 2, 'physio', '2025-12-17', '2025-12-17 16:11:54'),
(6, 'T251217-04', 1, 13, 2, 'physio', '2025-12-17', '2025-12-17 16:17:52'),
(7, 'T251218-01', 1, 16, 2, 'physio', '2025-12-18', '2025-12-18 18:05:29'),
(8, 'T251219-01', 1, 15, 2, 'physio', '2025-12-19', '2025-12-18 20:15:27'),
(9, 'T251219-02', 1, 13, 2, 'physio', '2025-12-19', '2025-12-18 20:21:37'),
(10, 'T251219-03', 1, 10, 2, 'physio', '2025-12-19', '2025-12-18 20:23:06'),
(11, 'T251219-04', 1, 9, 2, 'speech_therapy', '2025-12-19', '2025-12-18 20:24:07'),
(12, 'T251219-05', 1, 16, 2, 'physio', '2025-12-19', '2025-12-18 20:33:44'),
(13, 'T251225-01', 1, 16, 2, 'physio', '2025-12-25', '2025-12-25 08:40:24'),
(14, 'T251225-02', 1, 15, 2, 'physio', '2025-12-25', '2025-12-25 09:19:54'),
(15, 'T251225-03', 1, 12, 2, 'physio', '2025-12-25', '2025-12-25 09:30:40'),
(16, 'T251225-04', 1, 13, 2, 'physio', '2025-12-25', '2025-12-25 09:33:07'),
(17, 'T251225-05', 1, 14, 2, 'physio', '2025-12-25', '2025-12-25 09:35:31'),
(18, 'T251225-06', 1, 11, 2, 'physio', '2025-12-25', '2025-12-25 09:42:50'),
(19, 'T251225-07', 1, 10, 2, 'physio', '2025-12-25', '2025-12-25 09:59:22'),
(20, 'T251225-08', 1, 9, 2, 'speech_therapy', '2025-12-25', '2025-12-25 10:02:51'),
(21, 'T251225-09', 1, 8, 2, 'physio', '2025-12-25', '2025-12-25 10:05:02'),
(22, 'T251231-01', 1, 16, 1, 'physio', '2025-12-31', '2025-12-31 17:13:57'),
(23, 'T260101-01', 1, 16, 1, 'physio', '2026-01-01', '2026-01-01 11:26:50'),
(24, 'T260111-01', 1, 15, 2, 'physio', '2026-01-11', '2026-01-11 16:24:00'),
(25, 'T260111-02', 1, 16, 2, 'physio', '2026-01-11', '2026-01-11 16:24:09'),
(26, 'T260111-03', 1, 17, 1, 'physio', '2026-01-11', '2026-01-11 16:42:58'),
(27, 'T260118-01', 1, 10, 2, 'physio', '2026-01-18', '2026-01-18 07:35:15'),
(28, 'T-260130-01', 1, 21, NULL, 'physio', '2026-01-30', '2026-01-30 14:26:35'),
(29, 'T260130-02', 1, 20, 2, 'physio', '2026-01-30', '2026-01-30 14:28:20'),
(30, 'T-260130-03', 1, 12, NULL, 'physio', '2026-01-30', '2026-01-30 14:42:50'),
(31, 'T260130-04', 1, 19, 2, 'physio', '2026-01-30', '2026-01-30 14:45:29'),
(32, 'T260130-05', 1, 17, 2, 'physio', '2026-01-30', '2026-01-30 14:45:50'),
(33, 'T-260130-06', 1, 6, NULL, 'physio', '2026-01-30', '2026-01-30 14:49:10'),
(34, 'T-260130-07', 1, 5, NULL, 'physio', '2026-01-30', '2026-01-30 14:57:48'),
(35, 'T-260130-08', 1, 15, NULL, 'physio', '2026-01-30', '2026-01-30 15:31:00'),
(36, 'T-260130-09', 1, 14, NULL, 'physio', '2026-01-30', '2026-01-30 15:44:52'),
(37, 'T-260130-10', 1, 11, NULL, 'physio', '2026-01-30', '2026-01-30 15:50:47');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`) VALUES
(1),
(2);

-- --------------------------------------------------------

--
-- Table structure for table `user_device_tokens`
--

CREATE TABLE `user_device_tokens` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `platform` varchar(20) DEFAULT 'android',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `api_tokens`
--
ALTER TABLE `api_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_employee_expires` (`employee_id`,`expires_at`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_appointments_branch` (`branch_id`);

--
-- Indexes for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_appt_requests_branch` (`branch_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `fk_attendance_employee` (`marked_by_employee_id`);

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_branch_id` (`branch_id`),
  ADD KEY `idx_target` (`target_table`,`target_id`),
  ADD KEY `fk_audit_log_employee` (`employee_id`);

--
-- Indexes for table `blocked_ips`
--
ALTER TABLE `blocked_ips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ip_address` (`ip_address`),
  ADD KEY `ip_address_2` (`ip_address`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`branch_id`),
  ADD KEY `fk_branch_owner_employee` (`admin_employee_id`);

--
-- Indexes for table `branch_budgets`
--
ALTER TABLE `branch_budgets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branch_id` (`branch_id`,`effective_from_date`),
  ADD KEY `created_by_user_id` (`created_by_user_id`),
  ADD KEY `fk_branch_budgets_employee` (`created_by_employee_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `fk_chat_sender_employee` (`sender_employee_id`),
  ADD KEY `fk_chat_receiver_employee` (`receiver_employee_id`);

--
-- Indexes for table `chief_complaints`
--
ALTER TABLE `chief_complaints`
  ADD PRIMARY KEY (`complaint_id`),
  ADD UNIQUE KEY `unique_complaint_per_branch` (`branch_id`,`complaint_code`);

--
-- Indexes for table `clinic_settings`
--
ALTER TABLE `clinic_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `unique_setting` (`branch_id`,`setting_key`);

--
-- Indexes for table `consultation_types`
--
ALTER TABLE `consultation_types`
  ADD PRIMARY KEY (`consultation_id`),
  ADD UNIQUE KEY `unique_consultation_per_branch` (`branch_id`,`consultation_code`);

--
-- Indexes for table `daily_patient_counter`
--
ALTER TABLE `daily_patient_counter`
  ADD PRIMARY KEY (`entry_date`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `uq_employee_email` (`email`),
  ADD UNIQUE KEY `user_email` (`user_email`),
  ADD KEY `fk_employees_branch` (`branch_id`),
  ADD KEY `fk_employees_role` (`role_id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expense_id`),
  ADD UNIQUE KEY `uk_branch_voucher` (`branch_id`,`voucher_no`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_authorized_by_user_id` (`authorized_by_user_id`),
  ADD KEY `approved_by_user_id` (`approved_by_user_id`),
  ADD KEY `fk_expense_employee` (`employee_id`),
  ADD KEY `fk_expense_approved_by_employee` (`approved_by_employee_id`),
  ADD KEY `fk_expense_authorized_by_employee` (`authorized_by_employee_id`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `inquiry_followups`
--
ALTER TABLE `inquiry_followups`
  ADD PRIMARY KEY (`followup_id`);

--
-- Indexes for table `inquiry_service_types`
--
ALTER TABLE `inquiry_service_types`
  ADD PRIMARY KEY (`service_id`),
  ADD UNIQUE KEY `unique_service_per_branch` (`branch_id`,`service_code`);

--
-- Indexes for table `issue_attachments`
--
ALTER TABLE `issue_attachments`
  ADD PRIMARY KEY (`attachment_id`),
  ADD KEY `issue_id` (`issue_id`);

--
-- Indexes for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `limb_types`
--
ALTER TABLE `limb_types`
  ADD PRIMARY KEY (`limb_type_id`),
  ADD UNIQUE KEY `unique_limb_per_branch` (`branch_id`,`limb_code`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `username` (`username`),
  ADD KEY `ip` (`ip`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notification_branch` (`branch_id`),
  ADD KEY `fk_notification_employee` (`employee_id`),
  ADD KEY `fk_notification_created_by_employee` (`created_by_employee_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`patient_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `registration_id` (`registration_id`),
  ADD KEY `idx_master_patient_id` (`master_patient_id`),
  ADD KEY `fk_discount_approver` (`discount_approved_by`),
  ADD KEY `fk_patients_created_by_employee` (`created_by_employee_id`),
  ADD KEY `fk_patients_discount_approver_employee` (`discount_approved_by_employee_id`),
  ADD KEY `fk_service_track` (`service_track_id`);

--
-- Indexes for table `patients_treatment`
--
ALTER TABLE `patients_treatment`
  ADD PRIMARY KEY (`treatment_id`),
  ADD KEY `fk_patient_treatment` (`patient_id`),
  ADD KEY `fk_patients_treatment_employee` (`created_by_employee_id`);

--
-- Indexes for table `patient_appointments`
--
ALTER TABLE `patient_appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_branch_id_date_service` (`branch_id`,`appointment_date`,`service_type`),
  ADD KEY `fk_patient_appointments_employee` (`created_by_employee_id`);

--
-- Indexes for table `patient_feedback`
--
ALTER TABLE `patient_feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `fk_feedback_patient` (`patient_id`),
  ADD KEY `fk_feedback_branch` (`branch_id`),
  ADD KEY `fk_feedback_employee` (`created_by_employee_id`);

--
-- Indexes for table `patient_master`
--
ALTER TABLE `patient_master`
  ADD PRIMARY KEY (`master_patient_id`),
  ADD UNIQUE KEY `patient_uid` (`patient_uid`),
  ADD KEY `idx_phone_number` (`phone_number`),
  ADD KEY `first_registered_branch_id` (`first_registered_branch_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `fk_payments_employee` (`processed_by_employee_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`method_id`),
  ADD UNIQUE KEY `unique_method_per_branch` (`branch_id`,`method_code`);

--
-- Indexes for table `payment_splits`
--
ALTER TABLE `payment_splits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_id` (`payment_id`);

--
-- Indexes for table `quick_inquiry`
--
ALTER TABLE `quick_inquiry`
  ADD PRIMARY KEY (`inquiry_id`),
  ADD KEY `fk_quick_inquiry_branch` (`branch_id`),
  ADD KEY `fk_quick_inquiry_employee` (`created_by_employee_id`);

--
-- Indexes for table `referral_partners`
--
ALTER TABLE `referral_partners`
  ADD PRIMARY KEY (`partner_id`);

--
-- Indexes for table `referral_rates`
--
ALTER TABLE `referral_rates`
  ADD PRIMARY KEY (`rate_id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Indexes for table `referral_sources`
--
ALTER TABLE `referral_sources`
  ADD PRIMARY KEY (`source_id`),
  ADD UNIQUE KEY `unique_source_per_branch` (`branch_id`,`source_code`);

--
-- Indexes for table `registration`
--
ALTER TABLE `registration`
  ADD PRIMARY KEY (`registration_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `fk_registration_inquiry` (`inquiry_id`),
  ADD KEY `idx_master_patient_id` (`master_patient_id`),
  ADD KEY `fk_registration_employee` (`created_by_employee_id`);

--
-- Indexes for table `registration_payments`
--
ALTER TABLE `registration_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `registration_id` (`registration_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `role_login_keys`
--
ALTER TABLE `role_login_keys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key_name` (`key_name`);

--
-- Indexes for table `service_tracks`
--
ALTER TABLE `service_tracks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_issues`
--
ALTER TABLE `system_issues`
  ADD PRIMARY KEY (`issue_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `tests`
--
ALTER TABLE `tests`
  ADD PRIMARY KEY (`test_id`),
  ADD UNIQUE KEY `test_uid_unique` (`test_uid`),
  ADD KEY `fk_tests_inquiry` (`inquiry_id`),
  ADD KEY `fk_tests_employee` (`created_by_employee_id`);

--
-- Indexes for table `tests_lists`
--
ALTER TABLE `tests_lists`
  ADD PRIMARY KEY (`test_id`),
  ADD KEY `fk_tests_lists_branch` (`branch_id`);

--
-- Indexes for table `test_inquiry`
--
ALTER TABLE `test_inquiry`
  ADD PRIMARY KEY (`inquiry_id`),
  ADD KEY `fk_test_inquiry_branch` (`branch_id`),
  ADD KEY `fk_test_inquiry_employee` (`created_by_employee_id`);

--
-- Indexes for table `test_items`
--
ALTER TABLE `test_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `fk_test_items_test_id` (`test_id`),
  ADD KEY `fk_test_items_employee` (`created_by_employee_id`);

--
-- Indexes for table `test_payments`
--
ALTER TABLE `test_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `test_id` (`test_id`);

--
-- Indexes for table `test_staff`
--
ALTER TABLE `test_staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD KEY `idx_branch_active` (`branch_id`,`is_active`);

--
-- Indexes for table `test_types`
--
ALTER TABLE `test_types`
  ADD PRIMARY KEY (`test_type_id`),
  ADD UNIQUE KEY `unique_test_per_branch` (`branch_id`,`test_code`);

--
-- Indexes for table `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `uq_token_uid` (`token_uid`),
  ADD KEY `idx_branch_id` (`branch_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `fk_token_created_by_employee` (`created_by_employee_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_device_tokens`
--
ALTER TABLE `user_device_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_token` (`token`),
  ADD UNIQUE KEY `unique_emp_token` (`employee_id`,`token`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `api_tokens`
--
ALTER TABLE `api_tokens`
  MODIFY `token_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=284;

--
-- AUTO_INCREMENT for table `blocked_ips`
--
ALTER TABLE `blocked_ips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `branch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `branch_budgets`
--
ALTER TABLE `branch_budgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `message_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=112;

--
-- AUTO_INCREMENT for table `chief_complaints`
--
ALTER TABLE `chief_complaints`
  MODIFY `complaint_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `clinic_settings`
--
ALTER TABLE `clinic_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `consultation_types`
--
ALTER TABLE `consultation_types`
  MODIFY `consultation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `inquiry_followups`
--
ALTER TABLE `inquiry_followups`
  MODIFY `followup_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `inquiry_service_types`
--
ALTER TABLE `inquiry_service_types`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `issue_attachments`
--
ALTER TABLE `issue_attachments`
  MODIFY `attachment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `job_applications`
--
ALTER TABLE `job_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `limb_types`
--
ALTER TABLE `limb_types`
  MODIFY `limb_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=156;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `patients_treatment`
--
ALTER TABLE `patients_treatment`
  MODIFY `treatment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `patient_appointments`
--
ALTER TABLE `patient_appointments`
  MODIFY `appointment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=182;

--
-- AUTO_INCREMENT for table `patient_feedback`
--
ALTER TABLE `patient_feedback`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `patient_master`
--
ALTER TABLE `patient_master`
  MODIFY `master_patient_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `method_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `payment_splits`
--
ALTER TABLE `payment_splits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `quick_inquiry`
--
ALTER TABLE `quick_inquiry`
  MODIFY `inquiry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `referral_partners`
--
ALTER TABLE `referral_partners`
  MODIFY `partner_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `referral_rates`
--
ALTER TABLE `referral_rates`
  MODIFY `rate_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=142;

--
-- AUTO_INCREMENT for table `referral_sources`
--
ALTER TABLE `referral_sources`
  MODIFY `source_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `registration`
--
ALTER TABLE `registration`
  MODIFY `registration_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `registration_payments`
--
ALTER TABLE `registration_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `role_login_keys`
--
ALTER TABLE `role_login_keys`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `service_tracks`
--
ALTER TABLE `service_tracks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_issues`
--
ALTER TABLE `system_issues`
  MODIFY `issue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tests`
--
ALTER TABLE `tests`
  MODIFY `test_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `tests_lists`
--
ALTER TABLE `tests_lists`
  MODIFY `test_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `test_inquiry`
--
ALTER TABLE `test_inquiry`
  MODIFY `inquiry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `test_items`
--
ALTER TABLE `test_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `test_payments`
--
ALTER TABLE `test_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `test_staff`
--
ALTER TABLE `test_staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `test_types`
--
ALTER TABLE `test_types`
  MODIFY `test_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `token_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_device_tokens`
--
ALTER TABLE `user_device_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `api_tokens`
--
ALTER TABLE `api_tokens`
  ADD FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `fk_appointments_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON UPDATE CASCADE;

--
-- Constraints for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  ADD CONSTRAINT `fk_appt_requests_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON UPDATE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`),
  ADD CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`marked_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `fk_audit_log_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_log_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `fk_branch_owner_employee` FOREIGN KEY (`admin_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `branch_budgets`
--
ALTER TABLE `branch_budgets`
  ADD CONSTRAINT `branch_budgets_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `branch_budgets_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_branch_budgets_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_receiver_employee` FOREIGN KEY (`receiver_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_chat_sender_employee` FOREIGN KEY (`sender_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `chief_complaints`
--
ALTER TABLE `chief_complaints`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `clinic_settings`
--
ALTER TABLE `clinic_settings`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE;

--
-- Constraints for table `consultation_types`
--
ALTER TABLE `consultation_types`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employees_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_expense_approved_by_employee` FOREIGN KEY (`approved_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_expense_authorized_by` FOREIGN KEY (`authorized_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_expense_authorized_by_employee` FOREIGN KEY (`authorized_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_expense_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `fk_expense_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_expense_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inquiry_service_types`
--
ALTER TABLE `inquiry_service_types`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `issue_attachments`
--
ALTER TABLE `issue_attachments`
  ADD FOREIGN KEY (`issue_id`) REFERENCES `system_issues` (`issue_id`) ON DELETE CASCADE;

--
-- Constraints for table `limb_types`
--
ALTER TABLE `limb_types`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notification_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notification_created_by_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notification_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `fk_discount_approver` FOREIGN KEY (`discount_approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_patients_created_by_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_patients_discount_approver_employee` FOREIGN KEY (`discount_approved_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_patients_master_patient` FOREIGN KEY (`master_patient_id`) REFERENCES `patient_master` (`master_patient_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_service_track` FOREIGN KEY (`service_track_id`) REFERENCES `service_tracks` (`id`),
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `patients_ibfk_2` FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`);

--
-- Constraints for table `patients_treatment`
--
ALTER TABLE `patients_treatment`
  ADD CONSTRAINT `fk_patient_treatment` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_patients_treatment_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `patient_appointments`
--
ALTER TABLE `patient_appointments`
  ADD CONSTRAINT `fk_patient_appointments_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patient_appointments_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_patient_appointments_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_master`
--
ALTER TABLE `patient_master`
  ADD CONSTRAINT `patient_master_ibfk_1` FOREIGN KEY (`first_registered_branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_employee` FOREIGN KEY (`processed_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`);

--
-- Constraints for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `payment_splits`
--
ALTER TABLE `payment_splits`
  ADD FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE;

--
-- Constraints for table `quick_inquiry`
--
ALTER TABLE `quick_inquiry`
  ADD CONSTRAINT `fk_quick_inquiry_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_quick_inquiry_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `referral_rates`
--
ALTER TABLE `referral_rates`
  ADD FOREIGN KEY (`partner_id`) REFERENCES `referral_partners` (`partner_id`) ON DELETE CASCADE;

--
-- Constraints for table `referral_sources`
--
ALTER TABLE `referral_sources`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `registration`
--
ALTER TABLE `registration`
  ADD CONSTRAINT `fk_registration_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_registration_inquiry` FOREIGN KEY (`inquiry_id`) REFERENCES `quick_inquiry` (`inquiry_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_registration_master_patient` FOREIGN KEY (`master_patient_id`) REFERENCES `patient_master` (`master_patient_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `registration_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `registration_payments`
--
ALTER TABLE `registration_payments`
  ADD FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`) ON DELETE CASCADE;

--
-- Constraints for table `tests`
--
ALTER TABLE `tests`
  ADD CONSTRAINT `fk_tests_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tests_inquiry` FOREIGN KEY (`inquiry_id`) REFERENCES `test_inquiry` (`inquiry_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tests_lists`
--
ALTER TABLE `tests_lists`
  ADD CONSTRAINT `fk_tests_lists_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `test_inquiry`
--
ALTER TABLE `test_inquiry`
  ADD CONSTRAINT `fk_test_inquiry_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_test_inquiry_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `test_items`
--
ALTER TABLE `test_items`
  ADD CONSTRAINT `fk_test_items_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `test_items_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `tests` (`test_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `test_payments`
--
ALTER TABLE `test_payments`
  ADD FOREIGN KEY (`test_id`) REFERENCES `tests` (`test_id`) ON DELETE CASCADE;

--
-- Constraints for table `test_staff`
--
ALTER TABLE `test_staff`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `test_types`
--
ALTER TABLE `test_types`
  ADD FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `tokens`
--
ALTER TABLE `tokens`
  ADD CONSTRAINT `fk_token_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_token_created_by_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_token_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE;
COMMIT;


SET FOREIGN_KEY_CHECKS = 1;


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

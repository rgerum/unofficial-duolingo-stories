-- --------------------------------------------------------
-- Host:                         localhost
-- Server Version:               10.3.22-MariaDB - MariaDB Server
-- Server Betriebssystem:        Linux
-- HeidiSQL Version:             11.0.0.5919
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Exportiere Datenbank Struktur für carex_stories
CREATE DATABASE IF NOT EXISTS `carex_stories` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `carex_stories`;

-- Exportiere Struktur von Tabelle carex_stories.course
CREATE TABLE IF NOT EXISTS `course` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `learningLanguage` int(11) NOT NULL DEFAULT 0,
  `fromLanguage` int(11) NOT NULL DEFAULT 0,
  `public` tinyint(4) NOT NULL DEFAULT 0,
  `official` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle carex_stories.image
CREATE TABLE IF NOT EXISTS `image` (
  `id` char(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` char(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gilded` char(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locked` char(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active_color` char(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gilded_color` char(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle carex_stories.language
CREATE TABLE IF NOT EXISTS `language` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET latin1 NOT NULL,
  `short` varchar(5) COLLATE utf8_unicode_ci NOT NULL,
  `flag` float DEFAULT NULL,
  `public` int(11) NOT NULL DEFAULT 0,
  `flag_file` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `speaker` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `rtl` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle carex_stories.story
CREATE TABLE IF NOT EXISTS `story` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `duo_id` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8 NOT NULL,
  `set_id` int(11) DEFAULT NULL,
  `set_index` int(11) DEFAULT NULL,
  `xp` int(11) NOT NULL DEFAULT 0,
  `cefr` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  `name_base` varchar(255) CHARACTER SET utf8 NOT NULL,
  `lang` int(11) NOT NULL,
  `lang_base` int(11) NOT NULL,
  `author` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `change_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `text` mediumtext CHARACTER SET utf8 NOT NULL,
  `public` tinyint(4) DEFAULT 0,
  `image` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `image_done` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `image_locked` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `discussion` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `json` mediumtext CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1074 DEFAULT CHARSET=latin1;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle carex_stories.story_done
CREATE TABLE IF NOT EXISTS `story_done` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `story_id` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91293 DEFAULT CHARSET=latin1;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle carex_stories.user
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) CHARACTER SET latin1 NOT NULL,
  `password` varchar(100) CHARACTER SET latin1 NOT NULL,
  `email` varchar(100) CHARACTER SET latin1 NOT NULL,
  `regdate` timestamp NOT NULL DEFAULT current_timestamp(),
  `role` int(11) NOT NULL DEFAULT 0,
  `admin` int(11) NOT NULL DEFAULT 0,
  `activated` tinyint(4) NOT NULL DEFAULT 0,
  `activation_link` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=652 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Daten Export vom Benutzer nicht ausgewählt

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

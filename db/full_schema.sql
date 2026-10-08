
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `accounts_physiotherapistprofile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts_physiotherapistprofile` (
  `id` char(32) NOT NULL,
  `prof_status` varchar(80) NOT NULL,
  `workplace` varchar(200) NOT NULL,
  `experience_years` smallint(5) unsigned DEFAULT NULL CHECK (`experience_years` >= 0),
  `license_number` varchar(80) NOT NULL,
  `website` varchar(300) NOT NULL,
  `linkedin` varchar(300) NOT NULL,
  `expertise` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`expertise`)),
  `languages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`languages`)),
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `accounts_physiothera_user_id_c58c10e8_fk_accounts_` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `accounts_studentprofile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts_studentprofile` (
  `id` char(32) NOT NULL,
  `university` varchar(200) NOT NULL,
  `academic_year` varchar(40) NOT NULL,
  `graduation_year` smallint(5) unsigned DEFAULT NULL CHECK (`graduation_year` >= 0),
  `interests` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`interests`)),
  `languages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`languages`)),
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `accounts_studentprofile_user_id_04a48d2e_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `accounts_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts_user` (
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `id` char(32) NOT NULL,
  `email` varchar(254) NOT NULL,
  `first_name` varchar(120) NOT NULL,
  `last_name` varchar(120) NOT NULL,
  `phone` varchar(40) NOT NULL,
  `country` varchar(80) NOT NULL,
  `city` varchar(120) NOT NULL,
  `profile_type` varchar(20) NOT NULL,
  `role` varchar(20) NOT NULL,
  `status` varchar(12) NOT NULL,
  `email_verified` tinyint(1) NOT NULL,
  `locale` varchar(2) NOT NULL,
  `avatar_url` varchar(500) NOT NULL,
  `bio` longtext NOT NULL,
  `premium` tinyint(1) NOT NULL,
  `newsletter` tinyint(1) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `last_login_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `user_role_status_idx` (`role`,`status`),
  KEY `accounts_user_country_056a8c55` (`country`),
  KEY `accounts_user_created_at_04bd66b9` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `accounts_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts_user_groups` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` char(32) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_user_groups_user_id_group_id_59c0b32f_uniq` (`user_id`,`group_id`),
  KEY `accounts_user_groups_group_id_bd11a704_fk_auth_group_id` (`group_id`),
  CONSTRAINT `accounts_user_groups_group_id_bd11a704_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `accounts_user_groups_user_id_52b62117_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `accounts_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts_user_user_permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` char(32) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_user_user_permi_user_id_permission_id_2ab516c2_uniq` (`user_id`,`permission_id`),
  KEY `accounts_user_user_p_permission_id_113bb443_fk_auth_perm` (`permission_id`),
  CONSTRAINT `accounts_user_user_p_permission_id_113bb443_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `accounts_user_user_p_user_id_e4f0a161_fk_accounts_` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `accounts_usersettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts_usersettings` (
  `id` char(32) NOT NULL,
  `notif_new_resources` tinyint(1) NOT NULL,
  `notif_new_courses` tinyint(1) NOT NULL,
  `notif_webinars` tinyint(1) NOT NULL,
  `notif_newsletter` tinyint(1) NOT NULL,
  `notif_product` tinyint(1) NOT NULL,
  `public_profile` tinyint(1) NOT NULL,
  `show_email` tinyint(1) NOT NULL,
  `allow_analytics` tinyint(1) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `accounts_usersettings_user_id_3952da55_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_certificate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_certificate` (
  `id` char(32) NOT NULL,
  `reference` varchar(64) NOT NULL,
  `issued_at` datetime(6) NOT NULL,
  `pdf_url` varchar(800) NOT NULL,
  `course_id` char(32) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  UNIQUE KEY `certificate_unique` (`user_id`,`course_id`),
  KEY `activity_certificate_course_id_46470f26_fk_content_course_id` (`course_id`),
  CONSTRAINT `activity_certificate_course_id_46470f26_fk_content_course_id` FOREIGN KEY (`course_id`) REFERENCES `content_course` (`id`),
  CONSTRAINT `activity_certificate_user_id_dc6d6dfa_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_download`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_download` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `resource_id` char(32) DEFAULT NULL,
  `tool_id` char(32) DEFAULT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `download_user_idx` (`user_id`,`created_at`),
  KEY `activity_download_resource_id_41e45905_fk_content_resource_id` (`resource_id`),
  KEY `activity_download_tool_id_e66066fa_fk_content_clinicaltool_id` (`tool_id`),
  CONSTRAINT `activity_download_resource_id_41e45905_fk_content_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`),
  CONSTRAINT `activity_download_tool_id_e66066fa_fk_content_clinicaltool_id` FOREIGN KEY (`tool_id`) REFERENCES `content_clinicaltool` (`id`),
  CONSTRAINT `activity_download_user_id_ec5377a4_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_enrollment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_enrollment` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `course_id` char(32) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollment_unique` (`user_id`,`course_id`),
  KEY `activity_enrollment_course_id_330c03fc_fk_content_course_id` (`course_id`),
  CONSTRAINT `activity_enrollment_course_id_330c03fc_fk_content_course_id` FOREIGN KEY (`course_id`) REFERENCES `content_course` (`id`),
  CONSTRAINT `activity_enrollment_user_id_76f38e54_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_favorite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_favorite` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `course_id` char(32) DEFAULT NULL,
  `exercise_id` char(32) DEFAULT NULL,
  `resource_id` char(32) DEFAULT NULL,
  `tool_id` char(32) DEFAULT NULL,
  `user_id` char(32) NOT NULL,
  `webinar_id` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorite_unique_resource` (`user_id`,`resource_id`),
  UNIQUE KEY `favorite_unique_course` (`user_id`,`course_id`),
  UNIQUE KEY `favorite_unique_webinar` (`user_id`,`webinar_id`),
  UNIQUE KEY `favorite_unique_tool` (`user_id`,`tool_id`),
  UNIQUE KEY `favorite_unique_exercise` (`user_id`,`exercise_id`),
  KEY `favorite_user_idx` (`user_id`,`created_at`),
  KEY `activity_favorite_course_id_d12777c6_fk_content_course_id` (`course_id`),
  KEY `activity_favorite_exercise_id_37445a6d_fk_content_exercise_id` (`exercise_id`),
  KEY `activity_favorite_resource_id_22b77519_fk_content_resource_id` (`resource_id`),
  KEY `activity_favorite_tool_id_8220baa0_fk_content_clinicaltool_id` (`tool_id`),
  KEY `activity_favorite_webinar_id_62d22261_fk_content_webinar_id` (`webinar_id`),
  CONSTRAINT `activity_favorite_course_id_d12777c6_fk_content_course_id` FOREIGN KEY (`course_id`) REFERENCES `content_course` (`id`),
  CONSTRAINT `activity_favorite_exercise_id_37445a6d_fk_content_exercise_id` FOREIGN KEY (`exercise_id`) REFERENCES `content_exercise` (`id`),
  CONSTRAINT `activity_favorite_resource_id_22b77519_fk_content_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`),
  CONSTRAINT `activity_favorite_tool_id_8220baa0_fk_content_clinicaltool_id` FOREIGN KEY (`tool_id`) REFERENCES `content_clinicaltool` (`id`),
  CONSTRAINT `activity_favorite_user_id_2612b372_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`),
  CONSTRAINT `activity_favorite_webinar_id_62d22261_fk_content_webinar_id` FOREIGN KEY (`webinar_id`) REFERENCES `content_webinar` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_lessonprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_lessonprogress` (
  `id` char(32) NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `lesson_id` char(32) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lesson_progress_unique` (`user_id`,`lesson_id`),
  KEY `activity_lessonprogress_lesson_id_9368d412_fk_content_lesson_id` (`lesson_id`),
  CONSTRAINT `activity_lessonprogress_lesson_id_9368d412_fk_content_lesson_id` FOREIGN KEY (`lesson_id`) REFERENCES `content_lesson` (`id`),
  CONSTRAINT `activity_lessonprogress_user_id_63a08d5f_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_notification` (
  `id` char(32) NOT NULL,
  `kind` varchar(40) NOT NULL,
  `title` varchar(300) NOT NULL,
  `body` longtext NOT NULL,
  `url` varchar(500) NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_user_idx` (`user_id`,`read_at`),
  CONSTRAINT `activity_notification_user_id_444b68b5_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_quizattempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_quizattempt` (
  `id` char(32) NOT NULL,
  `score` smallint(5) unsigned NOT NULL CHECK (`score` >= 0),
  `total` smallint(5) unsigned NOT NULL CHECK (`total` >= 0),
  `passed` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `quiz_id` char(32) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `attempt_user_quiz_idx` (`user_id`,`quiz_id`),
  KEY `activity_quizattempt_quiz_id_e88b956a_fk_content_quiz_id` (`quiz_id`),
  CONSTRAINT `activity_quizattempt_quiz_id_e88b956a_fk_content_quiz_id` FOREIGN KEY (`quiz_id`) REFERENCES `content_quiz` (`id`),
  CONSTRAINT `activity_quizattempt_user_id_ab12141f_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_resourceview`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_resourceview` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `resource_id` char(32) NOT NULL,
  `user_id` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `view_resource_idx` (`resource_id`,`created_at`),
  KEY `activity_resourceview_user_id_4bf85010_fk_accounts_user_id` (`user_id`),
  CONSTRAINT `activity_resourcevie_resource_id_3d7c5615_fk_content_r` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`),
  CONSTRAINT `activity_resourceview_user_id_4bf85010_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_review` (
  `id` char(32) NOT NULL,
  `rating` smallint(5) unsigned NOT NULL CHECK (`rating` >= 0),
  `comment` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `course_id` char(32) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `review_unique` (`user_id`,`course_id`),
  KEY `activity_review_course_id_ac72496b_fk_content_course_id` (`course_id`),
  CONSTRAINT `activity_review_course_id_ac72496b_fk_content_course_id` FOREIGN KEY (`course_id`) REFERENCES `content_course` (`id`),
  CONSTRAINT `activity_review_user_id_595df6f0_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`),
  CONSTRAINT `review_rating_range` CHECK (`rating` >= 1 and `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_searchhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_searchhistory` (
  `id` char(32) NOT NULL,
  `query` varchar(300) NOT NULL,
  `results` int(10) unsigned NOT NULL CHECK (`results` >= 0),
  `created_at` datetime(6) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `search_user_idx` (`user_id`,`created_at`),
  CONSTRAINT `activity_searchhistory_user_id_4d977b95_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_webinarregistration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_webinarregistration` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `attended_at` datetime(6) DEFAULT NULL,
  `reminded_24h` tinyint(1) NOT NULL,
  `reminded_1h` tinyint(1) NOT NULL,
  `user_id` char(32) NOT NULL,
  `webinar_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `webinar_registration_unique` (`user_id`,`webinar_id`),
  KEY `activity_webinarregi_webinar_id_4356b92c_fk_content_w` (`webinar_id`),
  CONSTRAINT `activity_webinarregi_user_id_83a1c607_fk_accounts_` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`),
  CONSTRAINT `activity_webinarregi_webinar_id_4356b92c_fk_content_w` FOREIGN KEY (`webinar_id`) REFERENCES `content_webinar` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `analytics_analyticsevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analytics_analyticsevent` (
  `id` char(32) NOT NULL,
  `name` varchar(80) NOT NULL,
  `locale` varchar(2) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `created_at` datetime(6) NOT NULL,
  `user_id` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `analytics_analyticsevent_user_id_8dae0d56_fk_accounts_user_id` (`user_id`),
  KEY `analytics_analyticsevent_name_666194a3` (`name`),
  KEY `event_name_idx` (`name`,`created_at`),
  CONSTRAINT `analytics_analyticsevent_user_id_8dae0d56_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_author`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_author` (
  `id` char(32) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `first_name` varchar(120) NOT NULL,
  `last_name` varchar(120) NOT NULL,
  `title` varchar(200) NOT NULL,
  `bio` longtext NOT NULL,
  `country` varchar(80) NOT NULL,
  `city` varchar(120) NOT NULL,
  `avatar_url` varchar(500) NOT NULL,
  `expertise` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`expertise`)),
  `user_id` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `content_author_user_id_d9d2949a_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_clinicaltool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_clinicaltool` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `published` tinyint(1) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `search_text` longtext NOT NULL,
  `name` varchar(300) NOT NULL,
  `subtitle` varchar(300) NOT NULL,
  `description` longtext NOT NULL,
  `type` varchar(16) NOT NULL,
  `purpose` longtext NOT NULL,
  `indications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`indications`)),
  `contraindications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`contraindications`)),
  `equipment` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`equipment`)),
  `procedure` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`procedure`)),
  `scoring` longtext NOT NULL,
  `interpretation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`interpretation`)),
  `psychometrics` longtext NOT NULL,
  `references` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`references`)),
  `access` varchar(8) NOT NULL,
  `file_url` varchar(800) NOT NULL,
  `file_format` varchar(12) NOT NULL,
  `file_size_kb` int(10) unsigned DEFAULT NULL CHECK (`file_size_kb` >= 0),
  `download_count` int(10) unsigned NOT NULL CHECK (`download_count` >= 0),
  `region_id` varchar(64) DEFAULT NULL,
  `specialty_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `tool_filter_idx` (`type`,`region_id`,`published`),
  KEY `content_clinicaltool_region_id_a900820e_fk_taxonomie` (`region_id`),
  KEY `content_clinicaltool_specialty_id_189cd0c7_fk_taxonomie` (`specialty_id`),
  KEY `content_clinicaltool_created_at_ff07a5cd` (`created_at`),
  KEY `content_clinicaltool_published_92733ccc` (`published`),
  KEY `content_clinicaltool_type_7cb0b3db` (`type`),
  CONSTRAINT `content_clinicaltool_region_id_a900820e_fk_taxonomie` FOREIGN KEY (`region_id`) REFERENCES `taxonomies_bodyregion` (`id`),
  CONSTRAINT `content_clinicaltool_specialty_id_189cd0c7_fk_taxonomie` FOREIGN KEY (`specialty_id`) REFERENCES `taxonomies_specialty` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_clinicaltool_pathologies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_clinicaltool_pathologies` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `clinicaltool_id` char(32) NOT NULL,
  `pathology_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_clinicaltool_pat_clinicaltool_id_patholog_05e58632_uniq` (`clinicaltool_id`,`pathology_id`),
  KEY `content_clinicaltool_pathology_id_24df888a_fk_content_p` (`pathology_id`),
  CONSTRAINT `content_clinicaltool_clinicaltool_id_5412db50_fk_content_c` FOREIGN KEY (`clinicaltool_id`) REFERENCES `content_clinicaltool` (`id`),
  CONSTRAINT `content_clinicaltool_pathology_id_24df888a_fk_content_p` FOREIGN KEY (`pathology_id`) REFERENCES `content_pathology` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_course` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `published` tinyint(1) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `search_text` longtext NOT NULL,
  `title` varchar(300) NOT NULL,
  `subtitle` varchar(300) NOT NULL,
  `description` longtext NOT NULL,
  `objectives` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`objectives`)),
  `audience` longtext NOT NULL,
  `prerequisites` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`prerequisites`)),
  `level` varchar(16) NOT NULL,
  `language` varchar(2) NOT NULL,
  `access` varchar(8) NOT NULL,
  `cover_url` varchar(800) NOT NULL,
  `duration_min` int(10) unsigned NOT NULL CHECK (`duration_min` >= 0),
  `certificate` tinyint(1) NOT NULL,
  `rating_avg` double NOT NULL,
  `rating_count` int(10) unsigned NOT NULL CHECK (`rating_count` >= 0),
  `enrolled_count` int(10) unsigned NOT NULL CHECK (`enrolled_count` >= 0),
  `published_at` datetime(6) DEFAULT NULL,
  `instructor_id` char(32) DEFAULT NULL,
  `region_id` varchar(64) DEFAULT NULL,
  `specialty_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `course_filter_idx` (`published`,`access`,`level`),
  KEY `content_course_instructor_id_63442d1c_fk_content_author_id` (`instructor_id`),
  KEY `content_course_region_id_dba23ff5_fk_taxonomies_bodyregion_id` (`region_id`),
  KEY `content_course_specialty_id_b2a5a64e_fk_taxonomies_specialty_id` (`specialty_id`),
  KEY `content_course_created_at_53cfc36b` (`created_at`),
  KEY `content_course_published_354bb297` (`published`),
  CONSTRAINT `content_course_instructor_id_63442d1c_fk_content_author_id` FOREIGN KEY (`instructor_id`) REFERENCES `content_author` (`id`),
  CONSTRAINT `content_course_region_id_dba23ff5_fk_taxonomies_bodyregion_id` FOREIGN KEY (`region_id`) REFERENCES `taxonomies_bodyregion` (`id`),
  CONSTRAINT `content_course_specialty_id_b2a5a64e_fk_taxonomies_specialty_id` FOREIGN KEY (`specialty_id`) REFERENCES `taxonomies_specialty` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_course_pathologies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_course_pathologies` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `course_id` char(32) NOT NULL,
  `pathology_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_course_pathologies_course_id_pathology_id_8d41957d_uniq` (`course_id`,`pathology_id`),
  KEY `content_course_patho_pathology_id_cfda085d_fk_content_p` (`pathology_id`),
  CONSTRAINT `content_course_patho_course_id_f5af20c0_fk_content_c` FOREIGN KEY (`course_id`) REFERENCES `content_course` (`id`),
  CONSTRAINT `content_course_patho_pathology_id_cfda085d_fk_content_p` FOREIGN KEY (`pathology_id`) REFERENCES `content_pathology` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_course_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_course_tags` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `course_id` char(32) NOT NULL,
  `tag_id` varchar(96) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_course_tags_course_id_tag_id_e3a3ad88_uniq` (`course_id`,`tag_id`),
  KEY `content_course_tags_tag_id_8bfc6b82_fk_taxonomies_tag_slug` (`tag_id`),
  CONSTRAINT `content_course_tags_course_id_cf4abdb5_fk_content_course_id` FOREIGN KEY (`course_id`) REFERENCES `content_course` (`id`),
  CONSTRAINT `content_course_tags_tag_id_8bfc6b82_fk_taxonomies_tag_slug` FOREIGN KEY (`tag_id`) REFERENCES `taxonomies_tag` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_coursemodule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_coursemodule` (
  `id` char(32) NOT NULL,
  `title` varchar(300) NOT NULL,
  `position` int(10) unsigned NOT NULL CHECK (`position` >= 0),
  `course_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `module_order_idx` (`course_id`,`position`),
  CONSTRAINT `content_coursemodule_course_id_02e4cfde_fk_content_course_id` FOREIGN KEY (`course_id`) REFERENCES `content_course` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_exercise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_exercise` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `published` tinyint(1) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `search_text` longtext NOT NULL,
  `name` varchar(300) NOT NULL,
  `goal` longtext NOT NULL,
  `objective` varchar(40) NOT NULL,
  `difficulty` varchar(12) NOT NULL,
  `target_muscles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`target_muscles`)),
  `equipment` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`equipment`)),
  `steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`steps`)),
  `sets` varchar(80) NOT NULL,
  `reps` varchar(80) NOT NULL,
  `hold` varchar(80) NOT NULL,
  `frequency` varchar(80) NOT NULL,
  `progression` longtext NOT NULL,
  `regression` longtext NOT NULL,
  `precautions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`precautions`)),
  `video_url` varchar(800) NOT NULL,
  `image_url` varchar(800) NOT NULL,
  `references` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`references`)),
  `region_id` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `exercise_filter_idx` (`region_id`,`objective`,`difficulty`),
  KEY `content_exercise_created_at_8597db58` (`created_at`),
  KEY `content_exercise_published_7d3d0168` (`published`),
  KEY `content_exercise_objective_bd2f5e81` (`objective`),
  CONSTRAINT `content_exercise_region_id_810f21ed_fk_taxonomies_bodyregion_id` FOREIGN KEY (`region_id`) REFERENCES `taxonomies_bodyregion` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_exercise_pathologies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_exercise_pathologies` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `exercise_id` char(32) NOT NULL,
  `pathology_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_exercise_patholo_exercise_id_pathology_id_030f0d0c_uniq` (`exercise_id`,`pathology_id`),
  KEY `content_exercise_pat_pathology_id_ddf43cbf_fk_content_p` (`pathology_id`),
  CONSTRAINT `content_exercise_pat_exercise_id_53e5f7d6_fk_content_e` FOREIGN KEY (`exercise_id`) REFERENCES `content_exercise` (`id`),
  CONSTRAINT `content_exercise_pat_pathology_id_ddf43cbf_fk_content_p` FOREIGN KEY (`pathology_id`) REFERENCES `content_pathology` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_exercise_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_exercise_tags` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `exercise_id` char(32) NOT NULL,
  `tag_id` varchar(96) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_exercise_tags_exercise_id_tag_id_1f053a7d_uniq` (`exercise_id`,`tag_id`),
  KEY `content_exercise_tags_tag_id_d709a815_fk_taxonomies_tag_slug` (`tag_id`),
  CONSTRAINT `content_exercise_tag_exercise_id_5f2f355b_fk_content_e` FOREIGN KEY (`exercise_id`) REFERENCES `content_exercise` (`id`),
  CONSTRAINT `content_exercise_tags_tag_id_d709a815_fk_taxonomies_tag_slug` FOREIGN KEY (`tag_id`) REFERENCES `taxonomies_tag` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_lesson`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_lesson` (
  `id` char(32) NOT NULL,
  `title` varchar(300) NOT NULL,
  `type` varchar(8) NOT NULL,
  `duration_min` int(10) unsigned NOT NULL CHECK (`duration_min` >= 0),
  `position` int(10) unsigned NOT NULL CHECK (`position` >= 0),
  `content` longtext NOT NULL,
  `video_url` varchar(800) NOT NULL,
  `module_id` char(32) NOT NULL,
  `tool_id` char(32) DEFAULT NULL,
  `resource_id` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `content_lesson_resource_id_7cd17edc_fk_content_resource_id` (`resource_id`),
  KEY `lesson_order_idx` (`module_id`,`position`),
  KEY `content_lesson_tool_id_59ba19f1_fk_content_clinicaltool_id` (`tool_id`),
  CONSTRAINT `content_lesson_module_id_6ff1cdf3_fk_content_coursemodule_id` FOREIGN KEY (`module_id`) REFERENCES `content_coursemodule` (`id`),
  CONSTRAINT `content_lesson_resource_id_7cd17edc_fk_content_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`),
  CONSTRAINT `content_lesson_tool_id_59ba19f1_fk_content_clinicaltool_id` FOREIGN KEY (`tool_id`) REFERENCES `content_clinicaltool` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_pathology`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_pathology` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `search_text` longtext NOT NULL,
  `name` varchar(200) NOT NULL,
  `summary` longtext NOT NULL,
  `epidemiology` longtext NOT NULL,
  `presentation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`presentation`)),
  `red_flags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`red_flags`)),
  `management` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`management`)),
  `key_facts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`key_facts`)),
  `evidence` varchar(200) NOT NULL,
  `aliases` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`aliases`)),
  `published` tinyint(1) NOT NULL,
  `region_id` varchar(64) NOT NULL,
  `specialty_id` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `pathology_taxo_idx` (`region_id`,`specialty_id`),
  KEY `content_pathology_specialty_id_1a75ce00_fk_taxonomie` (`specialty_id`),
  KEY `content_pathology_created_at_b2a16177` (`created_at`),
  KEY `content_pathology_published_0b43b083` (`published`),
  CONSTRAINT `content_pathology_region_id_04ef84f6_fk_taxonomies_bodyregion_id` FOREIGN KEY (`region_id`) REFERENCES `taxonomies_bodyregion` (`id`),
  CONSTRAINT `content_pathology_specialty_id_1a75ce00_fk_taxonomie` FOREIGN KEY (`specialty_id`) REFERENCES `taxonomies_specialty` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_quiz` (
  `id` char(32) NOT NULL,
  `pass_score` smallint(5) unsigned NOT NULL CHECK (`pass_score` >= 0),
  `lesson_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `content_quiz_lesson_id_d78db5cb_fk_content_lesson_id` FOREIGN KEY (`lesson_id`) REFERENCES `content_lesson` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_quizanswer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_quizanswer` (
  `id` char(32) NOT NULL,
  `label` varchar(500) NOT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `position` int(10) unsigned NOT NULL CHECK (`position` >= 0),
  `question_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `content_quizanswer_question_id_a15a75b4_fk_content_q` (`question_id`),
  CONSTRAINT `content_quizanswer_question_id_a15a75b4_fk_content_q` FOREIGN KEY (`question_id`) REFERENCES `content_quizquestion` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_quizquestion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_quizquestion` (
  `id` char(32) NOT NULL,
  `prompt` longtext NOT NULL,
  `position` int(10) unsigned NOT NULL CHECK (`position` >= 0),
  `quiz_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `content_quizquestion_quiz_id_70c99ceb_fk_content_quiz_id` (`quiz_id`),
  CONSTRAINT `content_quizquestion_quiz_id_70c99ceb_fk_content_quiz_id` FOREIGN KEY (`quiz_id`) REFERENCES `content_quiz` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_resource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_resource` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `published` tinyint(1) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `search_text` longtext NOT NULL,
  `title` varchar(300) NOT NULL,
  `subtitle` varchar(300) NOT NULL,
  `description` longtext NOT NULL,
  `abstract` longtext NOT NULL,
  `key_points` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`key_points`)),
  `references` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`references`)),
  `level` varchar(16) NOT NULL,
  `language` varchar(2) NOT NULL,
  `access` varchar(8) NOT NULL,
  `file_url` varchar(800) NOT NULL,
  `file_format` varchar(12) NOT NULL,
  `file_size_kb` int(10) unsigned DEFAULT NULL CHECK (`file_size_kb` >= 0),
  `pages` int(10) unsigned DEFAULT NULL CHECK (`pages` >= 0),
  `views` int(10) unsigned NOT NULL CHECK (`views` >= 0),
  `download_count` int(10) unsigned NOT NULL CHECK (`download_count` >= 0),
  `published_at` datetime(6) DEFAULT NULL,
  `author_id` char(32) DEFAULT NULL,
  `category_id` varchar(64) NOT NULL,
  `region_id` varchar(64) DEFAULT NULL,
  `specialty_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `resource_pub_idx` (`published`,`published_at`),
  KEY `resource_filter_idx` (`category_id`,`region_id`,`specialty_id`,`level`),
  KEY `content_resource_author_id_ca09026c_fk_content_author_id` (`author_id`),
  KEY `content_resource_region_id_b642ee8b_fk_taxonomies_bodyregion_id` (`region_id`),
  KEY `content_resource_specialty_id_1c9b7c0b_fk_taxonomie` (`specialty_id`),
  KEY `content_resource_created_at_8555931c` (`created_at`),
  KEY `content_resource_published_2d006f54` (`published`),
  CONSTRAINT `content_resource_author_id_ca09026c_fk_content_author_id` FOREIGN KEY (`author_id`) REFERENCES `content_author` (`id`),
  CONSTRAINT `content_resource_category_id_543126db_fk_taxonomie` FOREIGN KEY (`category_id`) REFERENCES `taxonomies_resourcecategory` (`id`),
  CONSTRAINT `content_resource_region_id_b642ee8b_fk_taxonomies_bodyregion_id` FOREIGN KEY (`region_id`) REFERENCES `taxonomies_bodyregion` (`id`),
  CONSTRAINT `content_resource_specialty_id_1c9b7c0b_fk_taxonomie` FOREIGN KEY (`specialty_id`) REFERENCES `taxonomies_specialty` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_resource_pathologies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_resource_pathologies` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `resource_id` char(32) NOT NULL,
  `pathology_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_resource_patholo_resource_id_pathology_id_85bdef47_uniq` (`resource_id`,`pathology_id`),
  KEY `content_resource_pat_pathology_id_ac707f58_fk_content_p` (`pathology_id`),
  CONSTRAINT `content_resource_pat_pathology_id_ac707f58_fk_content_p` FOREIGN KEY (`pathology_id`) REFERENCES `content_pathology` (`id`),
  CONSTRAINT `content_resource_pat_resource_id_c8c9f386_fk_content_r` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_resource_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_resource_tags` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `resource_id` char(32) NOT NULL,
  `tag_id` varchar(96) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_resource_tags_resource_id_tag_id_71bf136e_uniq` (`resource_id`,`tag_id`),
  KEY `content_resource_tags_tag_id_ff1f0cdb_fk_taxonomies_tag_slug` (`tag_id`),
  CONSTRAINT `content_resource_tag_resource_id_5a4ed3ac_fk_content_r` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`),
  CONSTRAINT `content_resource_tags_tag_id_ff1f0cdb_fk_taxonomies_tag_slug` FOREIGN KEY (`tag_id`) REFERENCES `taxonomies_tag` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_resourcekeypoint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_resourcekeypoint` (
  `id` char(32) NOT NULL,
  `title` varchar(200) NOT NULL,
  `text` longtext NOT NULL,
  `icon` varchar(20) NOT NULL,
  `position` smallint(5) unsigned NOT NULL CHECK (`position` >= 0),
  `resource_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `content_resourcekeyp_resource_id_53c89766_fk_content_r` (`resource_id`),
  CONSTRAINT `content_resourcekeyp_resource_id_53c89766_fk_content_r` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_resourcereference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_resourcereference` (
  `id` char(32) NOT NULL,
  `citation` varchar(400) NOT NULL,
  `source` varchar(300) NOT NULL,
  `url` varchar(600) NOT NULL,
  `position` smallint(5) unsigned NOT NULL CHECK (`position` >= 0),
  `resource_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `content_resourcerefe_resource_id_c1ec3df3_fk_content_r` (`resource_id`),
  CONSTRAINT `content_resourcerefe_resource_id_c1ec3df3_fk_content_r` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_translation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_translation` (
  `id` char(32) NOT NULL,
  `locale` varchar(2) NOT NULL,
  `field` varchar(32) NOT NULL,
  `value` longtext NOT NULL,
  `course_id` char(32) DEFAULT NULL,
  `exercise_id` char(32) DEFAULT NULL,
  `pathology_id` char(32) DEFAULT NULL,
  `resource_id` char(32) DEFAULT NULL,
  `tool_id` char(32) DEFAULT NULL,
  `webinar_id` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `translation_unique_resource` (`locale`,`field`,`resource_id`),
  UNIQUE KEY `translation_unique_course` (`locale`,`field`,`course_id`),
  UNIQUE KEY `translation_unique_webinar` (`locale`,`field`,`webinar_id`),
  UNIQUE KEY `translation_unique_tool` (`locale`,`field`,`tool_id`),
  UNIQUE KEY `translation_unique_exercise` (`locale`,`field`,`exercise_id`),
  UNIQUE KEY `translation_unique_pathology` (`locale`,`field`,`pathology_id`),
  KEY `content_translation_course_id_b34f2634_fk_content_course_id` (`course_id`),
  KEY `content_translation_exercise_id_acec5667_fk_content_exercise_id` (`exercise_id`),
  KEY `content_translation_pathology_id_aab3782a_fk_content_p` (`pathology_id`),
  KEY `content_translation_resource_id_64f901ac_fk_content_resource_id` (`resource_id`),
  KEY `content_translation_tool_id_4669d39f_fk_content_clinicaltool_id` (`tool_id`),
  KEY `content_translation_webinar_id_3e3cbaec_fk_content_webinar_id` (`webinar_id`),
  CONSTRAINT `content_translation_course_id_b34f2634_fk_content_course_id` FOREIGN KEY (`course_id`) REFERENCES `content_course` (`id`),
  CONSTRAINT `content_translation_exercise_id_acec5667_fk_content_exercise_id` FOREIGN KEY (`exercise_id`) REFERENCES `content_exercise` (`id`),
  CONSTRAINT `content_translation_pathology_id_aab3782a_fk_content_p` FOREIGN KEY (`pathology_id`) REFERENCES `content_pathology` (`id`),
  CONSTRAINT `content_translation_resource_id_64f901ac_fk_content_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `content_resource` (`id`),
  CONSTRAINT `content_translation_tool_id_4669d39f_fk_content_clinicaltool_id` FOREIGN KEY (`tool_id`) REFERENCES `content_clinicaltool` (`id`),
  CONSTRAINT `content_translation_webinar_id_3e3cbaec_fk_content_webinar_id` FOREIGN KEY (`webinar_id`) REFERENCES `content_webinar` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_webinar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_webinar` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `published` tinyint(1) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `search_text` longtext NOT NULL,
  `title` varchar(300) NOT NULL,
  `subtitle` varchar(300) NOT NULL,
  `description` longtext NOT NULL,
  `agenda` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`agenda`)),
  `starts_at` datetime(6) NOT NULL,
  `duration_min` int(10) unsigned NOT NULL CHECK (`duration_min` >= 0),
  `ends_at` datetime(6) DEFAULT NULL,
  `live_url` varchar(800) NOT NULL,
  `replay_url` varchar(800) NOT NULL,
  `access` varchar(8) NOT NULL,
  `certificate` tinyint(1) NOT NULL,
  `registered_count` int(10) unsigned NOT NULL CHECK (`registered_count` >= 0),
  `region_id` varchar(64) DEFAULT NULL,
  `speaker_id` char(32) DEFAULT NULL,
  `specialty_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `webinar_sched_idx` (`published`,`starts_at`),
  KEY `content_webinar_region_id_950de41d_fk_taxonomies_bodyregion_id` (`region_id`),
  KEY `content_webinar_speaker_id_135597d4_fk_content_author_id` (`speaker_id`),
  KEY `content_webinar_specialty_id_c29e15f5_fk_taxonomies_specialty_id` (`specialty_id`),
  KEY `content_webinar_created_at_36a102d5` (`created_at`),
  KEY `content_webinar_published_a5b3ede3` (`published`),
  KEY `content_webinar_ends_at_19ae8f1a` (`ends_at`),
  CONSTRAINT `content_webinar_region_id_950de41d_fk_taxonomies_bodyregion_id` FOREIGN KEY (`region_id`) REFERENCES `taxonomies_bodyregion` (`id`),
  CONSTRAINT `content_webinar_speaker_id_135597d4_fk_content_author_id` FOREIGN KEY (`speaker_id`) REFERENCES `content_author` (`id`),
  CONSTRAINT `content_webinar_specialty_id_c29e15f5_fk_taxonomies_specialty_id` FOREIGN KEY (`specialty_id`) REFERENCES `taxonomies_specialty` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_webinar_pathologies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_webinar_pathologies` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `webinar_id` char(32) NOT NULL,
  `pathology_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_webinar_patholog_webinar_id_pathology_id_4c05fa0e_uniq` (`webinar_id`,`pathology_id`),
  KEY `content_webinar_path_pathology_id_fb6c0052_fk_content_p` (`pathology_id`),
  CONSTRAINT `content_webinar_path_pathology_id_fb6c0052_fk_content_p` FOREIGN KEY (`pathology_id`) REFERENCES `content_pathology` (`id`),
  CONSTRAINT `content_webinar_path_webinar_id_0312074a_fk_content_w` FOREIGN KEY (`webinar_id`) REFERENCES `content_webinar` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `content_webinar_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_webinar_tags` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `webinar_id` char(32) NOT NULL,
  `tag_id` varchar(96) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_webinar_tags_webinar_id_tag_id_a6a56e52_uniq` (`webinar_id`,`tag_id`),
  KEY `content_webinar_tags_tag_id_f00c6b87_fk_taxonomies_tag_slug` (`tag_id`),
  CONSTRAINT `content_webinar_tags_tag_id_f00c6b87_fk_taxonomies_tag_slug` FOREIGN KEY (`tag_id`) REFERENCES `taxonomies_tag` (`slug`),
  CONSTRAINT `content_webinar_tags_webinar_id_5feaea65_fk_content_webinar_id` FOREIGN KEY (`webinar_id`) REFERENCES `content_webinar` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext DEFAULT NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) unsigned NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_accounts_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `promotions_banner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotions_banner` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `starts_at` datetime(6) DEFAULT NULL,
  `ends_at` datetime(6) DEFAULT NULL,
  `position` smallint(5) unsigned NOT NULL CHECK (`position` >= 0),
  `placement` varchar(24) NOT NULL,
  `theme` varchar(12) NOT NULL,
  `eyebrow` varchar(80) NOT NULL,
  `title` varchar(200) NOT NULL,
  `body` varchar(400) NOT NULL,
  `cta_label` varchar(80) NOT NULL,
  `cta_href` varchar(500) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `partner_id` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `banner_placement_idx` (`placement`,`active`),
  KEY `promotions_banner_partner_id_54f530a8_fk_promotions_partner_id` (`partner_id`),
  KEY `promotions_banner_created_at_4ad76e43` (`created_at`),
  KEY `promotions_banner_active_28611b3c` (`active`),
  KEY `promotions_banner_placement_5a3048c0` (`placement`),
  CONSTRAINT `promotions_banner_partner_id_54f530a8_fk_promotions_partner_id` FOREIGN KEY (`partner_id`) REFERENCES `promotions_partner` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `promotions_partner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotions_partner` (
  `id` char(32) NOT NULL,
  `slug` varchar(80) NOT NULL,
  `name` varchar(160) NOT NULL,
  `kind` varchar(20) NOT NULL,
  `logo_url` varchar(500) NOT NULL,
  `url` varchar(500) NOT NULL,
  `position` smallint(5) unsigned NOT NULL CHECK (`position` >= 0),
  `active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `promotions_shelf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotions_shelf` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `starts_at` datetime(6) DEFAULT NULL,
  `ends_at` datetime(6) DEFAULT NULL,
  `position` smallint(5) unsigned NOT NULL CHECK (`position` >= 0),
  `placement` varchar(24) NOT NULL,
  `key` varchar(60) NOT NULL,
  `title` varchar(160) NOT NULL,
  `subtitle` varchar(300) NOT NULL,
  `cta_label` varchar(80) NOT NULL,
  `cta_href` varchar(500) NOT NULL,
  `section` varchar(20) NOT NULL,
  `source` varchar(10) NOT NULL,
  `limit` smallint(5) unsigned NOT NULL CHECK (`limit` >= 0),
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`filters`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `shelf_unique_key_per_placement` (`placement`,`key`),
  KEY `promotions_shelf_created_at_0f67ecfe` (`created_at`),
  KEY `promotions_shelf_active_436c14f1` (`active`),
  KEY `promotions_shelf_placement_f7df5112` (`placement`),
  KEY `promotions_shelf_key_5ea5adf4` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `promotions_shelfitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotions_shelfitem` (
  `id` char(32) NOT NULL,
  `section` varchar(20) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `position` smallint(5) unsigned NOT NULL CHECK (`position` >= 0),
  `shelf_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shelfitem_unique` (`shelf_id`,`section`,`slug`),
  KEY `promotions_shelfitem_slug_f9ec50a7` (`slug`),
  CONSTRAINT `promotions_shelfitem_shelf_id_86243e16_fk_promotions_shelf_id` FOREIGN KEY (`shelf_id`) REFERENCES `promotions_shelf` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `promotions_sponsorship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotions_sponsorship` (
  `id` char(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `starts_at` datetime(6) DEFAULT NULL,
  `ends_at` datetime(6) DEFAULT NULL,
  `position` smallint(5) unsigned NOT NULL CHECK (`position` >= 0),
  `placement` varchar(24) NOT NULL,
  `section` varchar(20) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `label` varchar(40) NOT NULL,
  `note` varchar(200) NOT NULL,
  `weight` smallint(5) unsigned NOT NULL CHECK (`weight` >= 0),
  `audience_filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`audience_filters`)),
  `impressions` int(10) unsigned NOT NULL CHECK (`impressions` >= 0),
  `clicks` int(10) unsigned NOT NULL CHECK (`clicks` >= 0),
  `partner_id` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sponsorship_unique` (`placement`,`section`,`slug`),
  KEY `promotions_sponsorsh_partner_id_460904d2_fk_promotion` (`partner_id`),
  KEY `sponsor_placement_idx` (`placement`,`active`),
  KEY `promotions_sponsorship_created_at_b5ee832b` (`created_at`),
  KEY `promotions_sponsorship_active_8e6ea96c` (`active`),
  KEY `promotions_sponsorship_placement_1ff6239a` (`placement`),
  KEY `promotions_sponsorship_slug_1326dec4` (`slug`),
  CONSTRAINT `promotions_sponsorsh_partner_id_460904d2_fk_promotion` FOREIGN KEY (`partner_id`) REFERENCES `promotions_partner` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subscriptions_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscriptions_plan` (
  `id` char(32) NOT NULL,
  `slug` varchar(64) NOT NULL,
  `name` varchar(200) NOT NULL,
  `tagline` varchar(300) NOT NULL,
  `price_dzd` int(10) unsigned NOT NULL CHECK (`price_dzd` >= 0),
  `interval` varchar(8) NOT NULL,
  `audience` varchar(20) NOT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`features`)),
  `limits` longtext NOT NULL,
  `premium` tinyint(1) NOT NULL,
  `highlighted` tinyint(1) NOT NULL,
  `order` smallint(5) unsigned NOT NULL CHECK (`order` >= 0),
  `published` tinyint(1) NOT NULL,
  `active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subscriptions_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscriptions_subscription` (
  `id` char(32) NOT NULL,
  `status` varchar(12) NOT NULL,
  `motivation` longtext NOT NULL,
  `promo_code` varchar(40) NOT NULL,
  `requested_at` datetime(6) NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `ends_at` datetime(6) DEFAULT NULL,
  `decided_at` datetime(6) DEFAULT NULL,
  `decision_note` longtext NOT NULL,
  `decided_by_id` char(32) DEFAULT NULL,
  `plan_id` char(32) NOT NULL,
  `user_id` char(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_subscr_decided_by_id_685cbbba_fk_accounts_` (`decided_by_id`),
  KEY `subscriptions_subscr_plan_id_2c895107_fk_subscript` (`plan_id`),
  KEY `subscriptions_subscription_status_bcf0b7da` (`status`),
  KEY `subscription_user_idx` (`user_id`,`status`),
  CONSTRAINT `subscriptions_subscr_decided_by_id_685cbbba_fk_accounts_` FOREIGN KEY (`decided_by_id`) REFERENCES `accounts_user` (`id`),
  CONSTRAINT `subscriptions_subscr_plan_id_2c895107_fk_subscript` FOREIGN KEY (`plan_id`) REFERENCES `subscriptions_plan` (`id`),
  CONSTRAINT `subscriptions_subscription_user_id_a353e93d_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `taxonomies_bodyregion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taxonomies_bodyregion` (
  `id` varchar(64) NOT NULL,
  `order` int(10) unsigned NOT NULL CHECK (`order` >= 0),
  PRIMARY KEY (`id`),
  KEY `taxonomies_bodyregion_order_1106a168` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `taxonomies_resourcecategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taxonomies_resourcecategory` (
  `id` varchar(64) NOT NULL,
  `order` int(10) unsigned NOT NULL CHECK (`order` >= 0),
  PRIMARY KEY (`id`),
  KEY `taxonomies_resourcecategory_order_e7168043` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `taxonomies_specialty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taxonomies_specialty` (
  `id` varchar(64) NOT NULL,
  `order` int(10) unsigned NOT NULL CHECK (`order` >= 0),
  PRIMARY KEY (`id`),
  KEY `taxonomies_specialty_order_04494626` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `taxonomies_tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taxonomies_tag` (
  `slug` varchar(96) NOT NULL,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `taxonomies_termlabel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taxonomies_termlabel` (
  `id` char(32) NOT NULL,
  `locale` varchar(2) NOT NULL,
  `label` varchar(200) NOT NULL,
  `body_region_id` varchar(64) DEFAULT NULL,
  `resource_category_id` varchar(64) DEFAULT NULL,
  `specialty_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `termlabel_unique_region` (`locale`,`body_region_id`),
  UNIQUE KEY `termlabel_unique_specialty` (`locale`,`specialty_id`),
  UNIQUE KEY `termlabel_unique_category` (`locale`,`resource_category_id`),
  KEY `taxonomies_termlabel_body_region_id_6fd6e15b_fk_taxonomie` (`body_region_id`),
  KEY `taxonomies_termlabel_resource_category_id_ce8511f8_fk_taxonomie` (`resource_category_id`),
  KEY `taxonomies_termlabel_specialty_id_f7169356_fk_taxonomie` (`specialty_id`),
  CONSTRAINT `taxonomies_termlabel_body_region_id_6fd6e15b_fk_taxonomie` FOREIGN KEY (`body_region_id`) REFERENCES `taxonomies_bodyregion` (`id`),
  CONSTRAINT `taxonomies_termlabel_resource_category_id_ce8511f8_fk_taxonomie` FOREIGN KEY (`resource_category_id`) REFERENCES `taxonomies_resourcecategory` (`id`),
  CONSTRAINT `taxonomies_termlabel_specialty_id_f7169356_fk_taxonomie` FOREIGN KEY (`specialty_id`) REFERENCES `taxonomies_specialty` (`id`),
  CONSTRAINT `termlabel_exactly_one_target` CHECK (`body_region_id` is not null and `resource_category_id` is null and `specialty_id` is null or `body_region_id` is null and `resource_category_id` is null and `specialty_id` is not null or `body_region_id` is null and `resource_category_id` is not null and `specialty_id` is null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


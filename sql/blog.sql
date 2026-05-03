/*
 Navicat Premium Data Transfer

 Source Server         : new
 Source Server Type    : MySQL
 Source Server Version : 80405 (8.4.5)
 Source Host           : localhost:3306
 Source Schema         : blog

 Target Server Type    : MySQL
 Target Server Version : 80405 (8.4.5)
 File Encoding         : 65001

 Date: 13/02/2026 03:29:01
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for blog_likes
-- ----------------------------
DROP TABLE IF EXISTS `blog_likes`;
CREATE TABLE `blog_likes`  (
  `blog_id` bigint NOT NULL,
  `user_id` bigint NULL DEFAULT NULL,
  INDEX `FKojo8uaqhkmbtqa8duxtbq56w3`(`blog_id` ASC) USING BTREE,
  CONSTRAINT `FKojo8uaqhkmbtqa8duxtbq56w3` FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of blog_likes
-- ----------------------------

-- ----------------------------
-- Table structure for blog_tags
-- ----------------------------
DROP TABLE IF EXISTS `blog_tags`;
CREATE TABLE `blog_tags`  (
  `blog_id` bigint NOT NULL,
  `tag_id` bigint NULL DEFAULT NULL,
  INDEX `FKknhfjqf24lyrdbfobo3qm09e6`(`blog_id` ASC) USING BTREE,
  CONSTRAINT `FKknhfjqf24lyrdbfobo3qm09e6` FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of blog_tags
-- ----------------------------

-- ----------------------------
-- Table structure for blogs
-- ----------------------------
DROP TABLE IF EXISTS `blogs`;
CREATE TABLE `blogs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `author_id` bigint NOT NULL,
  `category_id` bigint NULL DEFAULT NULL,
  `collect_count` int NULL DEFAULT NULL,
  `comment_count` int NULL DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `image` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_sticky` bit(1) NULL DEFAULT NULL,
  `likes_count` int NULL DEFAULT NULL,
  `raw_content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `read_time` int NULL DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','SCHEDULED','ARCHIVED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `views` int NULL DEFAULT NULL,
  `visibility` enum('PUBLIC','PRIVATE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `chapter_order` int NULL DEFAULT NULL,
  `publish_at` datetime(6) NULL DEFAULT NULL,
  `series_id` bigint NULL DEFAULT NULL,
  `unpublish_at` datetime(6) NULL DEFAULT NULL,
  `version` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_blog_status_visibility_created`(`status` ASC, `visibility` ASC, `created_at` DESC) USING BTREE,
  INDEX `idx_blog_author_status`(`author_id` ASC, `status` ASC) USING BTREE,
  INDEX `idx_blog_sticky_created`(`is_sticky` DESC, `created_at` DESC) USING BTREE,
  INDEX `idx_blog_category_status`(`category_id` ASC, `status` ASC) USING BTREE,
  INDEX `idx_blog_views`(`views` DESC) USING BTREE,
  INDEX `idx_blog_created_at`(`created_at` DESC) USING BTREE,
  INDEX `idx_blog_series`(`series_id` ASC, `chapter_order` ASC) USING BTREE,
  INDEX `idx_blog_schedule`(`status` ASC, `publish_at` ASC, `unpublish_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of blogs
-- ----------------------------
INSERT INTO `blogs` VALUES (1, 1, NULL, 0, 0, '<p>This is a test blog post content.</p>\n', '2026-02-09 19:29:12.540636', NULL, b'0', 0, 'This is a test blog post content.', 1, 'APPROVED', 'This is a test blog post content.', 'Test Blog Post', 1, 'PUBLIC', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `blogs` VALUES (2, 3, NULL, 0, 1, '<h1>E2E Test Content</h1>\n<p>This post was created by automated testing.</p>\n<ul><li>Point 1</li><li>\n<ul><li>Point 2</li></ul>\n</li><li></li><li>喵喵喵&#xff01;</li></ul>\n', '2026-02-09 19:31:45.651430', NULL, b'0', 0, '# E2E Test Content\n\nThis post was created by automated testing.\n\n- Point 1\n- - Point 2\n- \n- 喵喵喵！', 1, 'APPROVED', 'E2E Test Content\n\nThis post was created by automated testing.\n\n- Point 1\n- - Point 2\n- \n- 喵喵喵！', 'Hello World from E2E Test', 5, 'PUBLIC', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `blogs` VALUES (3, 4, NULL, 0, 0, '<h1>Test Notification</h1>\n<p>This is a post created by <code>test_user_reader</code>.\nLet&#39;s see if notifications work!</p>\n', '2026-02-09 20:20:38.180450', NULL, b'0', 0, '# Test Notification\n\nThis is a post created by `test_user_reader`.\nLet\'s see if notifications work!', 1, 'APPROVED', 'Test Notification\n\nThis is a post created by test_user_reader.\nLet\'s see if notifications work!', 'Reader\'s First Blog Post', 3, 'PUBLIC', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `blogs` VALUES (4, 6, NULL, 0, 0, '<p>private content</p>\n', '2026-02-11 12:14:29.520013', NULL, b'0', 0, 'private content', 1, 'APPROVED', 'private content', '????436', 0, 'PRIVATE', 1, NULL, 1, NULL, 0);
INSERT INTO `blogs` VALUES (5, 6, NULL, 1, 1, '<p>hello world</p>\n', '2026-02-12 00:18:44.988915', NULL, b'0', 0, 'hello world', 1, 'APPROVED', 'hello world', 'notif_test_283', 3, 'PUBLIC', NULL, NULL, NULL, NULL, 5);

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_t8o6pivur7nn124jehx7cygw5`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------

-- ----------------------------
-- Table structure for comment_likes
-- ----------------------------
DROP TABLE IF EXISTS `comment_likes`;
CREATE TABLE `comment_likes`  (
  `comment_id` bigint NOT NULL,
  `user_id` bigint NULL DEFAULT NULL,
  INDEX `FK3wa5u7bs1p1o9hmavtgdgk1go`(`comment_id` ASC) USING BTREE,
  CONSTRAINT `FK3wa5u7bs1p1o9hmavtgdgk1go` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comment_likes
-- ----------------------------

-- ----------------------------
-- Table structure for comment_mentions
-- ----------------------------
DROP TABLE IF EXISTS `comment_mentions`;
CREATE TABLE `comment_mentions`  (
  `comment_id` bigint NOT NULL,
  `user_id` bigint NULL DEFAULT NULL,
  INDEX `FK8gk4oq6ekw42dprikm64qc2u2`(`comment_id` ASC) USING BTREE,
  CONSTRAINT `FK8gk4oq6ekw42dprikm64qc2u2` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comment_mentions
-- ----------------------------

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `author_id` bigint NOT NULL,
  `blog_id` bigint NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `parent_comment_id` bigint NULL DEFAULT NULL,
  `reply_count` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_comment_blog_created`(`blog_id` ASC, `created_at` DESC) USING BTREE,
  INDEX `idx_comment_author`(`author_id` ASC) USING BTREE,
  INDEX `idx_comment_parent`(`parent_comment_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES (1, 3, 2, '浮浮酱的测试评论终于要成功了吗&#xff1f;喵&#xff01;', '2026-02-09 20:15:55.955431', NULL, 0);
INSERT INTO `comments` VALUES (2, 7, 5, 'notify comment', '2026-02-12 00:18:45.114268', NULL, 0);

-- ----------------------------
-- Table structure for draft_tags
-- ----------------------------
DROP TABLE IF EXISTS `draft_tags`;
CREATE TABLE `draft_tags`  (
  `draft_id` bigint NOT NULL,
  `tag_id` bigint NULL DEFAULT NULL,
  INDEX `FK253bhm0xa3yf93e3pxd46r5la`(`draft_id` ASC) USING BTREE,
  CONSTRAINT `FK253bhm0xa3yf93e3pxd46r5la` FOREIGN KEY (`draft_id`) REFERENCES `drafts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of draft_tags
-- ----------------------------

-- ----------------------------
-- Table structure for draft_versions
-- ----------------------------
DROP TABLE IF EXISTS `draft_versions`;
CREATE TABLE `draft_versions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `change_type` enum('AUTO','MANUAL','RESTORE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `draft_id` bigint NOT NULL,
  `snapshot_category_id` bigint NULL DEFAULT NULL,
  `snapshot_tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `snapshot_visibility` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `version_number` int NULL DEFAULT NULL,
  `word_count` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_draft_version_no`(`draft_id` ASC, `version_number` ASC) USING BTREE,
  INDEX `idx_draft_version`(`draft_id` ASC, `version_number` DESC) USING BTREE,
  INDEX `idx_draft_version_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of draft_versions
-- ----------------------------
INSERT INTO `draft_versions` VALUES (1, 'AUTO', 'This is a test blog post content.', '2026-02-09 19:29:11.006537', 1, NULL, NULL, NULL, 'Test Blog Post', 2, 27);
INSERT INTO `draft_versions` VALUES (2, 'AUTO', '# E2E Test Content\n\nThis post was created by automated testing.\n\n- Point 1\n- - Point 2\n- \n- 喵喵喵！', '2026-02-09 19:31:41.698751', 2, NULL, NULL, NULL, 'Hello World from E2E Test', 2, 73);
INSERT INTO `draft_versions` VALUES (3, 'AUTO', '# E2E Test Content\n\nThis post was created by automated testing.\n\n- Point 1\n- - Point 2\n- \n- 喵喵喵！', '2026-02-09 19:31:44.716989', 2, NULL, NULL, NULL, 'Hello World from E2E Test', 3, 73);
INSERT INTO `draft_versions` VALUES (4, 'AUTO', '# Test Notification\n\nThis is a post created by `test_user_reader`.\nLet\'s see if notifications work!', '2026-02-09 20:20:34.023222', 3, NULL, NULL, NULL, 'Reader\'s First Blog Post', 2, 84);
INSERT INTO `draft_versions` VALUES (5, 'AUTO', '# Test Notification\n\nThis is a post created by `test_user_reader`.\nLet\'s see if notifications work!', '2026-02-09 20:20:37.034891', 3, NULL, NULL, NULL, 'Reader\'s First Blog Post', 3, 84);

-- ----------------------------
-- Table structure for drafts
-- ----------------------------
DROP TABLE IF EXISTS `drafts`;
CREATE TABLE `drafts`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `author_id` bigint NOT NULL,
  `blog_id` bigint NULL DEFAULT NULL,
  `category_id` bigint NULL DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `current_version` int NULL DEFAULT NULL,
  `image` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `last_saved_at` datetime(6) NULL DEFAULT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `updated_at` datetime(6) NULL DEFAULT NULL,
  `visibility` enum('PUBLIC','PRIVATE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_draft_author_updated`(`author_id` ASC, `updated_at` DESC) USING BTREE,
  INDEX `idx_draft_blog_id`(`blog_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of drafts
-- ----------------------------
INSERT INTO `drafts` VALUES (1, 1, NULL, NULL, 'This is a test blog post content.', '2026-02-09 19:29:10.999616', 2, NULL, '2026-02-09 19:29:10.997624', 'Test Blog Post', '2026-02-09 19:29:10.999616', 'PUBLIC');
INSERT INTO `drafts` VALUES (2, 3, NULL, NULL, '# E2E Test Content\n\nThis post was created by automated testing.\n\n- Point 1\n- - Point 2\n- \n- 喵喵喵！', '2026-02-09 19:31:41.694763', 3, NULL, '2026-02-09 19:31:44.715994', 'Hello World from E2E Test', '2026-02-09 19:31:44.724975', 'PUBLIC');
INSERT INTO `drafts` VALUES (3, 4, NULL, NULL, '# Test Notification\n\nThis is a post created by `test_user_reader`.\nLet\'s see if notifications work!', '2026-02-09 20:20:34.019236', 3, NULL, '2026-02-09 20:20:37.033896', 'Reader\'s First Blog Post', '2026-02-09 20:20:37.039486', 'PUBLIC');

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `is_read` bit(1) NULL DEFAULT NULL,
  `receiver_id` bigint NOT NULL,
  `sender_id` bigint NOT NULL,
  `type` enum('TEXT','IMAGE','SYSTEM') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_message_chat`(`sender_id` ASC, `receiver_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_message_receiver_unread`(`receiver_id` ASC, `is_read` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------
INSERT INTO `messages` VALUES (1, 'hi from u1', '2026-02-11 12:29:30.531511', b'1', 8, 7, 'TEXT');
INSERT INTO `messages` VALUES (2, 'hi from u3', '2026-02-11 12:29:30.562842', b'0', 8, 9, 'TEXT');

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `is_read` bit(1) NULL DEFAULT NULL,
  `recipient_id` bigint NOT NULL,
  `related_blog_id` bigint NULL DEFAULT NULL,
  `related_comment_id` bigint NULL DEFAULT NULL,
  `sender_id` bigint NULL DEFAULT NULL,
  `type` enum('LIKE','COMMENT','FOLLOW','MENTION','REPLY','SYSTEM') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_notification_recipient_read_created`(`recipient_id` ASC, `is_read` ASC, `created_at` DESC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------
INSERT INTO `notifications` VALUES (1, 'Your blog \"Reader\'s First Blog Post\" has been approved.', '2026-02-09 21:31:40.421135', b'0', 4, 3, NULL, NULL, 'SYSTEM');
INSERT INTO `notifications` VALUES (2, 'Your blog \"Hello World from E2E Test\" has been approved.', '2026-02-09 21:31:41.157390', b'0', 3, 2, NULL, NULL, 'SYSTEM');
INSERT INTO `notifications` VALUES (3, 'Your blog \"Test Blog Post\" has been approved.', '2026-02-09 21:31:41.749265', b'0', 1, 1, NULL, NULL, 'SYSTEM');
INSERT INTO `notifications` VALUES (4, NULL, '2026-02-12 00:13:49.420297', b'0', 6, NULL, NULL, 7, 'FOLLOW');
INSERT INTO `notifications` VALUES (5, NULL, '2026-02-12 00:18:45.119256', b'0', 6, 5, NULL, 7, 'COMMENT');

-- ----------------------------
-- Table structure for operation_logs
-- ----------------------------
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action_type` enum('LOGIN','LOGOUT','REGISTER','PASSWORD_CHANGE','BLOG_CREATE','BLOG_UPDATE','BLOG_DELETE','BLOG_PUBLISH','USER_UPDATE','USER_BAN','USER_UNBAN','USER_DELETE','USER_PROMOTE','USER_DEMOTE','CATEGORY_CREATE','CATEGORY_UPDATE','CATEGORY_DELETE','TAG_CREATE','TAG_UPDATE','TAG_DELETE','COMMENT_CREATE','COMMENT_DELETE','DRAFT_CREATE','DRAFT_UPDATE','DRAFT_DELETE','SYSTEM_CONFIG','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `error_message` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `metadata` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `operator_id` bigint NULL DEFAULT NULL,
  `operator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `success` bit(1) NULL DEFAULT NULL,
  `target_id` bigint NULL DEFAULT NULL,
  `target_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `target_type` enum('USER','BLOG','COMMENT','CATEGORY','TAG','DRAFT','SYSTEM') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_oplog_operator_id`(`operator_id` ASC) USING BTREE,
  INDEX `idx_oplog_action_type`(`action_type` ASC) USING BTREE,
  INDEX `idx_oplog_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_oplog_target_type`(`target_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 42 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of operation_logs
-- ----------------------------
INSERT INTO `operation_logs` VALUES (1, 'LOGIN', '2026-02-11 12:09:53.696481', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (2, 'LOGIN', '2026-02-11 12:10:45.443202', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (3, 'LOGIN', '2026-02-11 12:11:08.879855', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (4, 'REGISTER', '2026-02-11 12:11:34.827976', '用户注册', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (5, 'LOGIN', '2026-02-11 12:13:55.898332', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (6, 'LOGIN', '2026-02-11 12:14:47.801820', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (7, 'REGISTER', '2026-02-11 12:29:29.457506', '用户注册', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (8, 'REGISTER', '2026-02-11 12:29:29.825311', '用户注册', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (9, 'LOGIN', '2026-02-11 12:29:30.378786', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (10, 'LOGIN', '2026-02-11 12:29:30.494093', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (11, 'LOGIN', '2026-02-11 14:04:58.105453', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (12, 'LOGIN', '2026-02-11 14:20:37.339047', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (13, 'LOGIN', '2026-02-11 14:22:21.539870', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (14, 'LOGIN', '2026-02-11 14:50:33.713387', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (15, 'LOGIN', '2026-02-11 14:59:50.404887', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (16, 'LOGIN', '2026-02-11 22:49:53.919596', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (17, 'LOGIN', '2026-02-11 22:51:38.053698', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (18, 'LOGIN', '2026-02-11 23:04:26.278286', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (19, 'LOGIN', '2026-02-11 23:55:08.248043', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (20, 'LOGIN', '2026-02-12 00:05:09.958052', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (21, 'LOGIN', '2026-02-12 00:13:49.379514', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (22, 'LOGIN', '2026-02-12 00:13:49.535577', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (23, 'LOGIN', '2026-02-12 00:18:44.932418', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (24, 'LOGIN', '2026-02-12 00:18:45.095686', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (25, 'LOGIN', '2026-02-12 00:25:53.315347', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (26, 'LOGIN', '2026-02-12 00:36:03.326558', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (27, 'LOGIN', '2026-02-12 00:53:51.007333', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (28, 'LOGIN', '2026-02-12 01:00:14.097044', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (29, 'LOGIN', '2026-02-12 01:04:58.068500', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (30, 'LOGIN', '2026-02-12 01:28:59.125122', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (31, 'LOGIN', '2026-02-12 18:01:48.448585', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (32, 'REGISTER', '2026-02-12 18:01:48.679508', '用户注册', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (33, 'LOGIN', '2026-02-12 18:08:41.119900', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (34, 'LOGIN', '2026-02-12 18:11:53.598781', '用户登录', NULL, '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'1', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456');
INSERT INTO `operation_logs` VALUES (35, 'LOGIN', '2026-02-13 03:24:51.910963', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0');
INSERT INTO `operation_logs` VALUES (36, 'LOGIN', '2026-02-13 03:25:08.112346', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0');
INSERT INTO `operation_logs` VALUES (37, 'LOGIN', '2026-02-13 03:25:13.391108', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0');
INSERT INTO `operation_logs` VALUES (38, 'LOGIN', '2026-02-13 03:25:36.927382', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0');
INSERT INTO `operation_logs` VALUES (39, 'REGISTER', '2026-02-13 03:25:50.924429', '用户注册', '用户名已存在', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0');
INSERT INTO `operation_logs` VALUES (40, 'REGISTER', '2026-02-13 03:25:55.917014', '用户注册', '用户名已存在', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0');
INSERT INTO `operation_logs` VALUES (41, 'LOGIN', '2026-02-13 03:26:42.593864', '用户登录', 'Bad credentials', '0:0:0:0:0:0:0:1', NULL, NULL, 'Anonymous', b'0', NULL, NULL, 'USER', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0');

-- ----------------------------
-- Table structure for reports
-- ----------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_reply` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `description` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `evidence_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `reason` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reporter_id` bigint NOT NULL,
  `resolved_at` datetime(6) NULL DEFAULT NULL,
  `status` enum('PENDING','RESOLVED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `target_id` bigint NOT NULL,
  `target_type` enum('BLOG','COMMENT','USER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_report_status`(`status` ASC, `created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of reports
-- ----------------------------
INSERT INTO `reports` VALUES (1, NULL, '2026-02-12 01:28:59.224680', NULL, NULL, '????', 6, '2026-02-12 01:28:59.224680', NULL, 5, 'BLOG');

-- ----------------------------
-- Table structure for sensitive_words
-- ----------------------------
DROP TABLE IF EXISTS `sensitive_words`;
CREATE TABLE `sensitive_words`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `level` enum('WARN','BLOCK','REVIEW') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `word` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_bjs19wyvvsdx2baxrvi7frds9`(`word` ASC) USING BTREE,
  INDEX `idx_sensitive_word`(`word` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sensitive_words
-- ----------------------------

-- ----------------------------
-- Table structure for series
-- ----------------------------
DROP TABLE IF EXISTS `series`;
CREATE TABLE `series`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `author_id` bigint NOT NULL,
  `cover_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` enum('Ongoing','Completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_series_author_updated`(`author_id` ASC, `updated_at` DESC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of series
-- ----------------------------
INSERT INTO `series` VALUES (1, 6, NULL, '2026-02-11 12:14:29.355325', 'for audit', 'Ongoing', '????448', '2026-02-11 12:14:29.355325');
INSERT INTO `series` VALUES (2, 6, NULL, '2026-02-12 00:36:03.370503', 'bad', 'Ongoing', '', '2026-02-12 00:36:03.370503');
INSERT INTO `series` VALUES (3, 10, NULL, '2026-02-12 18:01:48.886927', 'x', 'Ongoing', '', '2026-02-12 18:01:48.886927');

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `count` int NULL DEFAULT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_hot` bit(1) NULL DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_t48xdq560gs3gap9g7jg36kgc`(`name` ASC) USING BTREE,
  INDEX `idx_tag_name`(`name` ASC) USING BTREE,
  INDEX `idx_tag_count`(`count` DESC) USING BTREE,
  INDEX `idx_tag_hot_count`(`is_hot` DESC, `count` DESC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tags
-- ----------------------------

-- ----------------------------
-- Table structure for user_bookmarks
-- ----------------------------
DROP TABLE IF EXISTS `user_bookmarks`;
CREATE TABLE `user_bookmarks`  (
  `user_id` bigint NOT NULL,
  `blog_id` bigint NULL DEFAULT NULL,
  INDEX `FKhn6ih0jygj6jcsa8e59sbmvnn`(`user_id` ASC) USING BTREE,
  CONSTRAINT `FKhn6ih0jygj6jcsa8e59sbmvnn` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_bookmarks
-- ----------------------------
INSERT INTO `user_bookmarks` VALUES (6, 5);

-- ----------------------------
-- Table structure for user_followers
-- ----------------------------
DROP TABLE IF EXISTS `user_followers`;
CREATE TABLE `user_followers`  (
  `user_id` bigint NOT NULL,
  `follower_id` bigint NULL DEFAULT NULL,
  INDEX `FKox7c2m7d9qhhpu45d83luq19q`(`user_id` ASC) USING BTREE,
  CONSTRAINT `FKox7c2m7d9qhhpu45d83luq19q` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_followers
-- ----------------------------
INSERT INTO `user_followers` VALUES (6, 7);

-- ----------------------------
-- Table structure for user_following
-- ----------------------------
DROP TABLE IF EXISTS `user_following`;
CREATE TABLE `user_following`  (
  `user_id` bigint NOT NULL,
  `following_id` bigint NULL DEFAULT NULL,
  INDEX `FKiauj02dmro0awb3hetthnrlye`(`user_id` ASC) USING BTREE,
  CONSTRAINT `FKiauj02dmro0awb3hetthnrlye` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_following
-- ----------------------------
INSERT INTO `user_following` VALUES (7, 6);

-- ----------------------------
-- Table structure for user_read_history
-- ----------------------------
DROP TABLE IF EXISTS `user_read_history`;
CREATE TABLE `user_read_history`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blog_id` bigint NOT NULL,
  `last_read_at` datetime(6) NULL DEFAULT NULL,
  `progress_percentage` int NULL DEFAULT NULL,
  `scroll_position` int NULL DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_read_history_user_blog`(`user_id` ASC, `blog_id` ASC) USING BTREE,
  INDEX `idx_read_history_user_time`(`user_id` ASC, `last_read_at` DESC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_read_history
-- ----------------------------
INSERT INTO `user_read_history` VALUES (1, 5, '2026-02-12 01:00:57.189115', 42, 360, 6);
INSERT INTO `user_read_history` VALUES (2, 999999, '2026-02-12 01:04:58.124845', 10, 10, 6);
INSERT INTO `user_read_history` VALUES (3, 999999, '2026-02-12 18:01:48.862498', 50, 80, 10);

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `avatar` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `bio` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `is_admin` bit(1) NULL DEFAULT NULL,
  `is_banned` bit(1) NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_r43af9ap4edm43mmtq01oddj6`(`username` ASC) USING BTREE,
  INDEX `idx_user_username`(`username` ASC) USING BTREE,
  INDEX `idx_user_is_admin`(`is_admin` ASC) USING BTREE,
  INDEX `idx_user_is_banned`(`is_banned` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
/*
INSERT INTO `users` VALUES (1, 'https://ui-avatars.com/api/?name=testuser&background=e1dc5f&color=fff&size=128', '这位用户很懒，什么都没写。', '2026-02-09 19:18:27.932429', b'0', b'0', '$2a$10$w6A6H7H4Xf7A3knM2d5gzuS0wQz7iQb8r8m0c9y1rHf3Y8nD6JY0K', 'testuser');
INSERT INTO `users` VALUES (3, 'https://ui-avatars.com/api/?name=test_user_e2e&background=623ab3&color=fff&size=128', '这位用户很懒，什么都没写。', '2026-02-09 19:30:57.234332', b'0', b'0', '$2a$10$w6A6H7H4Xf7A3knM2d5gzuS0wQz7iQb8r8m0c9y1rHf3Y8nD6JY0K', 'test_user_e2e');
INSERT INTO `users` VALUES (4, 'https://ui-avatars.com/api/?name=test_user_reader&background=b85057&color=fff&size=128', '这位用户很懒，什么都没写。', '2026-02-09 20:18:41.780388', b'0', b'0', '$2a$10$w6A6H7H4Xf7A3knM2d5gzuS0wQz7iQb8r8m0c9y1rHf3Y8nD6JY0K', 'test_user_reader');
INSERT INTO `users` VALUES (5, 'http://localhost:8080/uploads/3a67edbd-73cd-424c-b09a-b7bd4f195bd3.jpg', 'System Administrator', '2026-02-09 21:06:09.419793', b'1', b'0', '$2a$10$w6A6H7H4Xf7A3knM2d5gzuS0wQz7iQb8r8m0c9y1rHf3Y8nD6JY0K', 'admin');
INSERT INTO `users` VALUES (6, 'https://ui-avatars.com/api/?name=audit_user_9052&background=b1cc58&color=fff&size=128', '这位用户很懒，什么都没写。', '2026-02-11 12:11:34.787925', b'0', b'0', '$2a$10$OGaDNsF3Iy6F7tLf.zUYkuGWV4A7Koye3fzMBK9elKFpJFyfQo.uy', 'audit_user_9052');
INSERT INTO `users` VALUES (7, 'https://ui-avatars.com/api/?name=msg_u1_1029&background=1a4170&color=fff&size=128', '这位用户很懒，什么都没写。', '2026-02-11 12:29:29.406675', b'0', b'0', '$2a$10$l46W8NTjMtyMosmrKypKm.5yql48V3flsZz3zT0Z9TA1AkQ/iOqVW', 'msg_u1_1029');
INSERT INTO `users` VALUES (8, 'https://ui-avatars.com/api/?name=msg_u2_2425&background=2bafde&color=fff&size=128', '这位用户很懒，什么都没写。', '2026-02-11 12:29:29.655453', b'0', b'0', '$2a$10$l3RQ4b5mFUo5ZeYTMky3dOBFCLBQd0iRbxRn53772pjYs9/ouy3pe', 'msg_u2_2425');
INSERT INTO `users` VALUES (9, 'https://ui-avatars.com/api/?name=msg_u3_1369&background=1bcb7d&color=fff&size=128', '这位用户很懒，什么都没写。', '2026-02-11 12:29:29.810994', b'0', b'0', '$2a$10$wCDxVKXt0BMjq/B9Z.Vjd.9e/CpDnX.HzlmNfV/3GuNOarj8HhR.y', 'msg_u3_1369');
INSERT INTO `users` VALUES (10, 'https://ui-avatars.com/api/?name=audit_user_3455&background=f65758&color=fff&size=128', '这位用户很懒，什么都没写。', '2026-02-12 18:01:48.670896', b'0', b'0', '$2a$10$lW.bLwO3tZ0p9ZyA6nl9u.R7v7/iXaPxTHsTSgP1jvDvcQGXcv5wu', 'audit_user_3455');

*/
INSERT INTO `users` (`id`, `avatar`, `bio`, `created_at`, `is_admin`, `is_banned`, `password`, `username`) VALUES
(1, 'https://ui-avatars.com/api/?name=testuser&background=e1dc5f&color=fff&size=128', 'This user has not written a bio yet.', '2026-02-09 19:18:27.932429', b'0', b'0', '$2a$10$w6A6H7H4Xf7A3knM2d5gzuS0wQz7iQb8r8m0c9y1rHf3Y8nD6JY0K', 'testuser'),
(3, 'https://ui-avatars.com/api/?name=test_user_e2e&background=623ab3&color=fff&size=128', 'This user has not written a bio yet.', '2026-02-09 19:30:57.234332', b'0', b'0', '$2a$10$w6A6H7H4Xf7A3knM2d5gzuS0wQz7iQb8r8m0c9y1rHf3Y8nD6JY0K', 'test_user_e2e'),
(4, 'https://ui-avatars.com/api/?name=test_user_reader&background=b85057&color=fff&size=128', 'This user has not written a bio yet.', '2026-02-09 20:18:41.780388', b'0', b'0', '$2a$10$w6A6H7H4Xf7A3knM2d5gzuS0wQz7iQb8r8m0c9y1rHf3Y8nD6JY0K', 'test_user_reader'),
(5, 'http://localhost:8080/uploads/3a67edbd-73cd-424c-b09a-b7bd4f195bd3.jpg', 'System Administrator', '2026-02-09 21:06:09.419793', b'1', b'0', '$2a$10$w6A6H7H4Xf7A3knM2d5gzuS0wQz7iQb8r8m0c9y1rHf3Y8nD6JY0K', 'admin'),
(6, 'https://ui-avatars.com/api/?name=audit_user_9052&background=b1cc58&color=fff&size=128', 'This user has not written a bio yet.', '2026-02-11 12:11:34.787925', b'0', b'0', '$2a$10$OGaDNsF3Iy6F7tLf.zUYkuGWV4A7Koye3fzMBK9elKFpJFyfQo.uy', 'audit_user_9052'),
(7, 'https://ui-avatars.com/api/?name=msg_u1_1029&background=1a4170&color=fff&size=128', 'This user has not written a bio yet.', '2026-02-11 12:29:29.406675', b'0', b'0', '$2a$10$l46W8NTjMtyMosmrKypKm.5yql48V3flsZz3zT0Z9TA1AkQ/iOqVW', 'msg_u1_1029'),
(8, 'https://ui-avatars.com/api/?name=msg_u2_2425&background=2bafde&color=fff&size=128', 'This user has not written a bio yet.', '2026-02-11 12:29:29.655453', b'0', b'0', '$2a$10$l3RQ4b5mFUo5ZeYTMky3dOBFCLBQd0iRbxRn53772pjYs9/ouy3pe', 'msg_u2_2425'),
(9, 'https://ui-avatars.com/api/?name=msg_u3_1369&background=1bcb7d&color=fff&size=128', 'This user has not written a bio yet.', '2026-02-11 12:29:29.810994', b'0', b'0', '$2a$10$wCDxVKXt0BMjq/B9Z.Vjd.9e/CpDnX.HzlmNfV/3GuNOarj8HhR.y', 'msg_u3_1369'),
(10, 'https://ui-avatars.com/api/?name=audit_user_3455&background=f65758&color=fff&size=128', 'This user has not written a bio yet.', '2026-02-12 18:01:48.670896', b'0', b'0', '$2a$10$lW.bLwO3tZ0p9ZyA6nl9u.R7v7/iXaPxTHsTSgP1jvDvcQGXcv5wu', 'audit_user_3455')
ON DUPLICATE KEY UPDATE
  avatar = VALUES(avatar),
  bio = VALUES(bio),
  created_at = VALUES(created_at),
  is_admin = VALUES(is_admin),
  is_banned = VALUES(is_banned),
  password = VALUES(password),
  username = VALUES(username);

UPDATE `users`
SET `password` = '$2a$10$so5vyhJHMWDSu672cS8wtOt89Snn1InVo7/FHyt3yWPNFBh2d1Asm';

SET FOREIGN_KEY_CHECKS = 1;

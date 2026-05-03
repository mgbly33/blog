-- MySQL Database Schema for Blog System
-- This script creates the blog database and required FULLTEXT indexes
-- Run this after the application has started and Hibernate has created the tables

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blog;

-- Note: Tables will be auto-created by Hibernate ddl-auto=update
-- This script sets up FULLTEXT index which Hibernate cannot create automatically

-- Create FULLTEXT index for blog search (safe to re-run)
-- Check if index already exists before creating to avoid errors
DROP PROCEDURE IF EXISTS create_fulltext_index;
DELIMITER //
CREATE PROCEDURE create_fulltext_index()
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'blogs'
      AND index_name = 'idx_blog_fulltext';

    IF index_exists = 0 THEN
        ALTER TABLE blogs ADD FULLTEXT INDEX idx_blog_fulltext (title, content, summary);
    END IF;
END //
DELIMITER ;

CALL create_fulltext_index();
DROP PROCEDURE IF EXISTS create_fulltext_index;


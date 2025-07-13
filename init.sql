-- Initial database setup for MySQL
-- This file is automatically executed when the MySQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS financedb;
USE financedb;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON financedb.* TO 'financeuser'@'%';
FLUSH PRIVILEGES;
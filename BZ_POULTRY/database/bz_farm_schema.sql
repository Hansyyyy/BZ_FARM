-- BZ Farm Poultry Management System Database Schema
-- Database: bz_farm

CREATE DATABASE IF NOT EXISTS bz_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bz_farm;

-- Users (Admin & Manager login)
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager') DEFAULT 'manager',
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Poultry Flocks
CREATE TABLE flocks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    batch_no VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('layers', 'pullets', 'roosters') NOT NULL,
    breed VARCHAR(255) NOT NULL,
    initial_quantity INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    age_weeks INT UNSIGNED DEFAULT 0,
    date_in DATE NOT NULL,
    mortality INT UNSIGNED DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Feed Inventory
CREATE TABLE feed_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    stock DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(255) DEFAULT 'kg',
    reorder_level DECIMAL(10,2) DEFAULT 0,
    expiry_date DATE NULL,
    last_stock_in DATE NULL,
    cost_per_kg DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Medicine & Vaccine
CREATE TABLE medicine_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    type VARCHAR(255) NULL,
    stock DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(255) DEFAULT 'pcs',
    reorder_level DECIMAL(10,2) DEFAULT 0,
    expiry_date DATE NULL,
    last_stock_in DATE NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- General Inventory
CREATE TABLE inventory_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    stock DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(255) DEFAULT 'pcs',
    reorder_level DECIMAL(10,2) DEFAULT 0,
    location VARCHAR(255) NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Buildings for Egg Production
CREATE TABLE buildings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Stock Transactions (Feed, Medicine, Inventory)
CREATE TABLE stock_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_type VARCHAR(255) NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reference VARCHAR(255) NULL,
    user_id BIGINT UNSIGNED NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_item (item_type, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Egg Production Records
CREATE TABLE egg_productions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    building_id BIGINT UNSIGNED NOT NULL,
    total_eggs INT UNSIGNED NOT NULL,
    good_eggs INT UNSIGNED NOT NULL,
    cracked_eggs INT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Customers
CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Products
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(255) DEFAULT 'tray',
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Sales Transactions
CREATE TABLE sales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(255) NOT NULL UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash', 'credit') DEFAULT 'cash',
    status ENUM('paid', 'unpaid') DEFAULT 'paid',
    sale_date DATE NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Activity Log
CREATE TABLE activities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Generated Reports
CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    generated_by BIGINT UNSIGNED NOT NULL,
    file_path VARCHAR(255) NULL,
    generated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
);

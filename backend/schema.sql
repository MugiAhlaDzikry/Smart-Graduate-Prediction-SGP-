-- schema.sql
-- Run this in the Supabase SQL Editor (tanpa RLS)
-- PENTING: Jalankan setelah membuat project Supabase
--
-- Jika Anda sudah pernah menjalankan schema lama, jalankan SQL ini
-- untuk menambahkan tabel baru tanpa menghapus tabel yang sudah ada.

-- ============================================
-- TABEL AKTIF (digunakan oleh aplikasi)
-- ============================================

-- 1. Users Profile (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL DEFAULT 'supabase_auth',
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'dosen', 'mahasiswa')) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Students Dataset (flat table untuk ML training & dashboard)
--    Menyimpan data gabungan yang di-upload atau ditambahkan via prediksi.
CREATE TABLE IF NOT EXISTS students_dataset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    gender VARCHAR(10) CHECK (gender IN ('L', 'P')),
    major VARCHAR(100) DEFAULT 'Ilmu Komputer',
    semester INTEGER DEFAULT 6,
    gpa DECIMAL(3, 2) NOT NULL,
    credits_completed INTEGER NOT NULL,
    attendance_rate DECIMAL(5, 2),
    financial_status VARCHAR(50) DEFAULT 'Mandiri',
    is_on_time INTEGER DEFAULT 0,
    data_source VARCHAR(20) DEFAULT 'dummy',
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Jika tabel students_dataset sudah ada, jalankan:
-- ALTER TABLE students_dataset ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'dummy';

-- 3. Prediction History (riwayat semua prediksi)
CREATE TABLE IF NOT EXISTS prediction_history (
    id TEXT PRIMARY KEY,
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    nim VARCHAR(20),
    name VARCHAR(255),
    gender VARCHAR(10),
    semester INTEGER,
    gpa DECIMAL(5, 2),
    credits_completed INTEGER,
    attendance_rate DECIMAL(5, 2),
    major VARCHAR(100),
    financial_status VARCHAR(50),
    prediction INTEGER,
    probability_on_time DECIMAL(6, 4),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Training Logs (riwayat training model ML)
CREATE TABLE IF NOT EXISTS training_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_version VARCHAR(50) NOT NULL,
    accuracy DECIMAL(5, 4) NOT NULL,
    precision_score DECIMAL(5, 4) NOT NULL,
    recall DECIMAL(5, 4) NOT NULL,
    f1_score DECIMAL(5, 4) NOT NULL,
    total_samples INTEGER DEFAULT 0,
    features_used JSONB,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Jika tabel training_logs sudah ada dari schema lama dan belum punya
-- kolom total_samples, jalankan baris berikut:
-- ALTER TABLE training_logs ADD COLUMN IF NOT EXISTS total_samples INTEGER DEFAULT 0;
-- ALTER TABLE training_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;


-- ============================================
-- TABEL CADANGAN (untuk pengembangan masa depan)
-- Tabel di bawah ini dipertahankan untuk rencana
-- pengembangan fitur yang lebih granular di masa depan,
-- seperti profil mahasiswa terperinci dan riwayat akademik
-- per semester.
-- ============================================

-- Students (detailed student profiles)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('L', 'P')),
    major VARCHAR(100) NOT NULL,
    admission_year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Academic Records (per-semester records)
CREATE TABLE IF NOT EXISTS academic_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    gpa DECIMAL(3, 2) NOT NULL,
    credits_completed INTEGER NOT NULL,
    attendance_rate DECIMAL(5, 2),
    financial_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Predictions (linked to students)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    prediction_result BOOLEAN NOT NULL,
    probability_on_time DECIMAL(5, 4) NOT NULL,
    risk_factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- USER PERTAMA
-- ============================================
-- LANGKAH 1: Buka Authentication > Users di Supabase Dashboard
-- LANGKAH 2: Klik "Add User" > "Create New User"
-- LANGKAH 3: Isi:
--   Email: admin@kampus.ac.id
--   Password: admin123
--   (centang "Auto Confirm User")
--
-- LANGKAH 4: Jalankan SQL berikut untuk menambahkan profil:
-- INSERT INTO users (email, full_name, role) VALUES
--   ('admin@kampus.ac.id', 'Administrator', 'admin');

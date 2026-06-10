-- schema.sql
-- Run this in the Supabase SQL Editor

-- 1. Users Profile (Extending Supabase Auth if needed, or simple custom users table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'dosen', 'mahasiswa')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('L', 'P')),
    major VARCHAR(100) NOT NULL,
    admission_year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'aktif', -- aktif, lulus, cuti, DO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Academic Records (Features for ML)
CREATE TABLE academic_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    gpa DECIMAL(3, 2) NOT NULL, -- IPK
    credits_completed INTEGER NOT NULL, -- SKS
    attendance_rate DECIMAL(5, 2), -- Persentase kehadiran (0-100)
    extracurricular_score INTEGER, -- 0-100
    financial_status VARCHAR(50), -- beasiswa, mandiri, dll
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Predictions
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    prediction_result BOOLEAN NOT NULL, -- TRUE: Tepat Waktu, FALSE: Terlambat
    probability_on_time DECIMAL(5, 4) NOT NULL,
    risk_factors JSONB, -- Hasil SHAP values untuk Explainability
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Training Logs
CREATE TABLE training_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_version VARCHAR(50) NOT NULL,
    accuracy DECIMAL(5, 4) NOT NULL,
    precision DECIMAL(5, 4) NOT NULL,
    recall DECIMAL(5, 4) NOT NULL,
    f1_score DECIMAL(5, 4) NOT NULL,
    features_used JSONB,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS (Row Level Security) if needed for security
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

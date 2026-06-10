# 🎓 Smart Graduate Predictor (SGP)

Aplikasi berbasis web yang membantu kampus memprediksi kemungkinan mahasiswa lulus tepat waktu menggunakan **Machine Learning (XGBoost)** dan **Explainable AI (SHAP)**.

## ✨ Fitur Utama

- **Dashboard Interaktif** — Visualisasi statistik akademik secara real-time
- **Prediksi Kelulusan** — Prediksi individu maupun batch menggunakan model XGBoost
- **Explainable AI (SHAP)** — Grafik SHAP Values yang menjelaskan faktor-faktor penyebab di balik setiap prediksi
- **Manajemen Data Mahasiswa** — Upload dan kelola data akademik
- **Training Model** — Latih ulang model ML kapan saja dengan dataset terbaru

## 🏗️ Arsitektur Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | React.js, Vite, Tailwind CSS v4, Recharts |
| Backend API | FastAPI (Python), Uvicorn |
| Machine Learning | XGBoost, Scikit-learn, SHAP |
| Database | Supabase (PostgreSQL) |

## 📁 Struktur Proyek

```
prediksi_kelulusan_mahasiswa_tepat_waktu/
├── backend/
│   ├── main.py              # API endpoints (FastAPI)
│   ├── ml_model.py          # Logika ML training & prediksi + SHAP
│   ├── mock_data.py         # Generator dataset dummy
│   ├── database.py          # Konfigurasi koneksi Supabase
│   ├── schema.sql           # Skema tabel database
│   └── .env                 # Environment variables (tidak di-push)
├── frontend/
│   ├── src/
│   │   ├── pages/           # Login, Dashboard, Predictions, Students, Training
│   │   ├── components/      # Sidebar, Navbar
│   │   └── App.jsx          # Routing utama
│   └── vite.config.js
└── .gitignore
```

## 🚀 Cara Menjalankan

### Prasyarat
- Python 3.10+
- Node.js 18+
- Akun Supabase (untuk database)

### 1. Setup Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1     # Windows
pip install fastapi uvicorn pandas numpy scikit-learn xgboost shap openpyxl python-dotenv python-multipart pydantic "python-jose[cryptography]" "passlib[bcrypt]"
```

### 2. Konfigurasi Environment
Buat file `backend/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 3. Jalankan SQL Schema
Buka Supabase SQL Editor dan jalankan isi file `backend/schema.sql` **tanpa RLS**.

### 4. Generate Data & Train Model
```bash
cd backend
python mock_data.py
python ml_model.py
```

### 5. Setup Frontend
```bash
cd frontend
npm install
```

### 6. Jalankan Aplikasi
Buka **2 terminal** terpisah:

**Terminal 1 (Backend):**
```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev -- --port 3000
```

Buka browser: [http://localhost:3000](http://localhost:3000)

## 📊 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/dashboard/stats` | Statistik dashboard |
| POST | `/api/upload` | Upload dataset CSV/Excel |
| POST | `/api/train` | Training model ML |
| POST | `/api/predict` | Prediksi individu |
| POST | `/api/predict/batch` | Prediksi batch |
| GET | `/api/students` | Daftar mahasiswa |
| GET | `/api/training/log` | Log training terakhir |

## 👤 Author

**Mugi Ahla Dzikry**

## 📝 License

Project ini dibuat untuk keperluan akademik.

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import Optional, List
import uuid
import pandas as pd  # type: ignore
import numpy as np  # type: ignore
import os
import io
import json
import pickle
from datetime import datetime
from database import get_supabase

app = FastAPI(
    title="Smart Graduate Predictor API",
    description="API untuk prediksi kelulusan mahasiswa tepat waktu",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Auth Router ───
from auth import router as auth_router
app.include_router(auth_router)

# ─── Paths (model files tetap disimpan lokal) ───
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "features.pkl")


# ─── Helper: Extract user_id from JWT token ───
def get_current_user_id(authorization: str = Header(default="")) -> str:
    """Extract user_id from Supabase JWT token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan")
    token = authorization.replace("Bearer ", "")
    sb = get_supabase()
    try:
        res = sb.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token tidak valid atau sudah expired")
    if not res.user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    return res.user.id


# ─── Schemas ───
class StudentInput(BaseModel):
    nim: str = ""
    name: str = ""
    semester: int = 6
    gpa: float
    credits_completed: int
    attendance_rate: float
    gender: str = "L"
    major: str = "Ilmu Komputer"
    financial_status: str = "Mandiri"


class PredictionResponse(BaseModel):
    prediction: int
    probability_on_time: float
    risk_factors: list


class TrainingResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    total_samples: int
    model_version: str


class DashboardStats(BaseModel):
    total_students: int
    on_time_percentage: float
    high_risk_count: int
    model_accuracy: float


# ─── Helper: Fetch semua data students_dataset dari Supabase sebagai DataFrame ───
def _fetch_students_df(user_id: str = None):
    """Fetch all rows from students_dataset table, handling pagination.
    If user_id is provided, filter by that user's data only."""
    sb = get_supabase()
    all_data = []
    page_size = 1000
    offset = 0
    while True:
        query = sb.table("students_dataset").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        res = query.range(offset, offset + page_size - 1).execute()
        if not res.data:
            break
        all_data.extend(res.data)
        if len(res.data) < page_size:
            break
        offset += page_size

    if not all_data:
        return pd.DataFrame()

    df = pd.DataFrame(all_data)
    # Pastikan tipe data numerik benar (Supabase DECIMAL bisa datang sebagai string)
    numeric_cols = ['semester', 'gpa', 'credits_completed', 'attendance_rate', 'is_on_time']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df


# ─── Helper: Train model ───
def _train_model(user_id: str):
    """Train ML model using data from Supabase students_dataset table."""
    from sklearn.model_selection import train_test_split  # type: ignore
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score  # type: ignore
    try:
        from xgboost import XGBClassifier  # type: ignore
        use_xgb = True
    except ImportError:
        from sklearn.ensemble import RandomForestClassifier  # type: ignore
        use_xgb = False

    df = _fetch_students_df(user_id=user_id)
    if df.empty:
        raise ValueError("Dataset kosong. Upload dataset terlebih dahulu.")

    # Drop kolom non-fitur
    X = df.drop(columns=['id', 'nim', 'name', 'is_on_time', 'created_at', 'data_source', 'user_id'], errors='ignore')
    y = df['is_on_time']

    # One-Hot Encoding
    X = pd.get_dummies(X, columns=['gender', 'major', 'financial_status'], drop_first=True)

    feature_names = X.columns.tolist()
    user_features_path = os.path.join(BASE_DIR, f"features_{user_id}.pkl")
    with open(user_features_path, 'wb') as f:
        pickle.dump(feature_names, f)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if use_xgb:
        model = XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    else:
        model = RandomForestClassifier(n_estimators=100, random_state=42)

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1_score": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "total_samples": len(df),
    }

    user_model_path = os.path.join(BASE_DIR, f"model_{user_id}.pkl")
    with open(user_model_path, 'wb') as f:
        pickle.dump(model, f)

    return metrics


# ─── Helper: Predict ───
def _predict(student_data: dict, user_id: str) -> dict:
    """Predict single student."""
    user_model_path = os.path.join(BASE_DIR, f"model_{user_id}.pkl")
    user_features_path = os.path.join(BASE_DIR, f"features_{user_id}.pkl")

    if not os.path.exists(user_model_path) or not os.path.exists(user_features_path):
        raise ValueError("Model belum dilatih. Silakan upload dataset dan train model terlebih dahulu.")

    with open(user_model_path, 'rb') as f:
        model = pickle.load(f)
    with open(user_features_path, 'rb') as f:
        feature_names = pickle.load(f)

    df = pd.DataFrame([student_data])
    df = pd.get_dummies(df, columns=['gender', 'major', 'financial_status'])

    X_input = pd.DataFrame(columns=feature_names)
    X_input = pd.concat([X_input, df], axis=0).fillna(0)
    X_input = X_input[feature_names].astype(float)

    probability = float(model.predict_proba(X_input)[0][1])
    prediction = int(model.predict(X_input)[0])

    # SHAP
    shap_dict = {}
    try:
        import shap  # type: ignore
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_input)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        for i, feature in enumerate(feature_names):
            val = round(float(shap_values[0][i]), 4)
            if feature.startswith('gender_'):
                shap_dict['gender'] = shap_dict.get('gender', 0.0) + val
            elif feature.startswith('major_'):
                shap_dict['major'] = shap_dict.get('major', 0.0) + val
            elif feature.startswith('financial_status_'):
                shap_dict['financial_status'] = shap_dict.get('financial_status', 0.0) + val
            else:
                shap_dict[feature] = val
    except Exception:
        # Fallback: use feature importances
        importances = model.feature_importances_
        for i, feature in enumerate(feature_names):
            val = round(float(importances[i]), 4)
            if feature.startswith('gender_'):
                shap_dict['gender'] = shap_dict.get('gender', 0.0) + val
            elif feature.startswith('major_'):
                shap_dict['major'] = shap_dict.get('major', 0.0) + val
            elif feature.startswith('financial_status_'):
                shap_dict['financial_status'] = shap_dict.get('financial_status', 0.0) + val
            else:
                shap_dict[feature] = val

    sorted_factors = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    # Filter out features with virtually zero impact
    filtered_factors = [(k, v) for k, v in sorted_factors if abs(v) > 0.0001]
    top_factors = [{"feature": k, "impact": v} for k, v in filtered_factors[:6]]

    return {
        "prediction": prediction,
        "probability_on_time": round(probability, 4),
        "risk_factors": top_factors
    }


# ─── Helper: Save prediction to Supabase ───
def _save_prediction_history(student_data: dict, result: dict, user_id: str):
    """Save a prediction result to Supabase prediction_history (audit log only)."""
    sb = get_supabase()

    record = {
        "id": str(uuid.uuid4()),
        "predicted_at": datetime.now().isoformat(),
        "nim": student_data.get("nim", ""),
        "name": student_data.get("name", ""),
        "gender": student_data.get("gender", ""),
        "semester": student_data.get("semester", 6),
        "gpa": student_data.get("gpa", 0),
        "credits_completed": student_data.get("credits_completed", 0),
        "attendance_rate": student_data.get("attendance_rate", 0),
        "major": student_data.get("major", ""),
        "financial_status": student_data.get("financial_status", ""),
        "prediction": result.get("prediction", 0),
        "probability_on_time": result.get("probability_on_time", 0),
        "user_id": user_id,
    }
    sb.table("prediction_history").insert(record).execute()


def _bulk_save_prediction_history(batch_student_data: list, batch_results: list, user_id: str):
    """Bulk save multiple prediction results to Supabase prediction_history (audit log only)."""
    sb = get_supabase()

    history_records = []
    for student_data, result in zip(batch_student_data, batch_results):
        history_records.append({
            "id": str(uuid.uuid4()),
            "predicted_at": datetime.now().isoformat(),
            "nim": student_data.get("nim", ""),
            "name": student_data.get("name", ""),
            "gender": student_data.get("gender", ""),
            "semester": student_data.get("semester", 6),
            "gpa": student_data.get("gpa", 0),
            "credits_completed": student_data.get("credits_completed", 0),
            "attendance_rate": student_data.get("attendance_rate", 0),
            "major": student_data.get("major", ""),
            "financial_status": student_data.get("financial_status", ""),
            "prediction": result.get("prediction", 0),
            "probability_on_time": result.get("probability_on_time", 0),
            "user_id": user_id,
        })

    # Insert dalam batch @100
    for i in range(0, len(history_records), 100):
        batch = history_records[i:i + 100]
        sb.table("prediction_history").insert(batch).execute()


# ─── Constants ───

# ─── Routes ───

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Graduate Predictor API", "version": "1.0.0"}


@app.get("/api/dashboard/stats")
def get_dashboard_stats(user_id: str = Depends(get_current_user_id)):
    """Get comprehensive dashboard statistics from Supabase."""
    sb = get_supabase()

    # Default empty response
    result = {
        "stats": {
            "total_students": 0,
            "on_time_percentage": 0,
            "high_risk_count": 0,
            "model_accuracy": 0,
        },
        "gpa_distribution": [],
        "risk_distribution": [],
        "gender_distribution": [],
        "financial_distribution": [],
        "recent_students": [],
        "has_data": False,
    }

    df = _fetch_students_df(user_id=user_id)
    total = len(df)
    if total == 0:
        return result

    result["has_data"] = True

    # ─── 1. Summary Stats ───
    on_time = int(df['is_on_time'].sum()) if 'is_on_time' in df.columns else 0
    on_time_pct = round((on_time / total) * 100, 1) if total > 0 else 0

    # Risk classification based on GPA
    high_risk = int((df['gpa'] < 2.75).sum()) if 'gpa' in df.columns else 0
    medium_risk = int(((df['gpa'] >= 2.75) & (df['gpa'] < 3.25)).sum()) if 'gpa' in df.columns else 0
    low_risk = total - high_risk - medium_risk

    # Model accuracy from latest training log
    accuracy = 0.0
    try:
        log_res = sb.table("training_logs").select("accuracy").order("trained_at", desc=True).limit(1).execute()
        if log_res.data:
            accuracy = float(log_res.data[0].get("accuracy", 0))
    except Exception:
        pass

    result["stats"] = {
        "total_students": total,
        "on_time_percentage": on_time_pct,
        "high_risk_count": high_risk,
        "model_accuracy": round(accuracy * 100, 1) if accuracy <= 1 else round(accuracy, 1),
    }

    # ─── 2. GPA Distribution ───
    if 'gpa' in df.columns:
        bins = [0, 2.0, 2.5, 3.0, 3.5, 4.01]
        labels = ['< 2.0', '2.0 - 2.5', '2.5 - 3.0', '3.0 - 3.5', '3.5 - 4.0']
        colors = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#10b981']
        df['gpa_range'] = pd.cut(df['gpa'], bins=bins, labels=labels, right=False)
        gpa_counts = df['gpa_range'].value_counts().sort_index()
        result["gpa_distribution"] = [
            {"range": label, "jumlah": int(gpa_counts.get(label, 0)), "fill": colors[i]}
            for i, label in enumerate(labels)
        ]

    # ─── 3. Risk Distribution ───
    result["risk_distribution"] = [
        {"name": "Risiko Rendah", "value": low_risk, "color": "#10b981"},
        {"name": "Risiko Sedang", "value": medium_risk, "color": "#f59e0b"},
        {"name": "Risiko Tinggi", "value": high_risk, "color": "#ef4444"},
    ]

    # ─── 4. Gender Distribution ───
    if 'gender' in df.columns:
        gender_map = {'L': 'Laki-laki', 'P': 'Perempuan'}
        gender_counts = df['gender'].value_counts()
        result["gender_distribution"] = [
            {"name": gender_map.get(g, g), "value": int(c)}
            for g, c in gender_counts.items()
        ]

    # ─── 5. Financial Status Distribution ───
    if 'financial_status' in df.columns:
        fin_counts = df['financial_status'].value_counts()
        result["financial_distribution"] = [
            {"name": f, "value": int(c)}
            for f, c in fin_counts.items()
        ]

    # ─── 6. Recent Students (last 10) ───
    recent_cols = ['nim', 'gpa', 'major', 'gender', 'is_on_time', 'credits_completed', 'attendance_rate']
    available_cols = [c for c in recent_cols if c in df.columns]
    recent_df = df[available_cols].tail(10).iloc[::-1]  # Last 10, newest first
    result["recent_students"] = recent_df.to_dict(orient='records')

    return result


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """Upload a CSV/Excel dataset ke Supabase."""
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Format file harus CSV atau Excel (.xlsx)")

    contents = await file.read()

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error membaca file: {str(e)}")

    required_cols = ['gpa', 'credits_completed', 'attendance_rate']
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Kolom yang dibutuhkan tidak ditemukan: {', '.join(missing)}"
        )

    sb = get_supabase()

    # Hapus dataset lama milik user ini saja
    try:
        sb.table("students_dataset").delete().eq("user_id", user_id).neq("nim", "").execute()
    except Exception:
        pass

    # Deduplikasi: simpan hanya baris terakhir per NIM untuk mencegah error unique constraint
    if 'nim' in df.columns:
        df['nim'] = df['nim'].astype(str)
        df = df.drop_duplicates(subset='nim', keep='last')

    # Prepare records
    records = []
    for _, row in df.iterrows():
        nim_val = str(row.get("nim", f"AUTO_{uuid.uuid4().hex[:8]}"))
        records.append({
            "nim": nim_val,
            "name": str(row.get("name", f"Mahasiswa {nim_val}")),
            "gender": str(row.get("gender", "L")),
            "major": str(row.get("major", "Ilmu Komputer")),
            "semester": int(row.get("semester", 6)),
            "gpa": float(row.get("gpa", 0)),
            "credits_completed": int(row.get("credits_completed", 0)),
            "attendance_rate": float(row.get("attendance_rate", 0)),
            "financial_status": str(row.get("financial_status", "Mandiri")),
            "is_on_time": int(row.get("is_on_time", 0)),
            "data_source": "real",
            "user_id": user_id,
        })

    # Upsert dalam batch @100 rows
    for i in range(0, len(records), 100):
        batch = records[i:i + 100]
        sb.table("students_dataset").upsert(batch, on_conflict="nim").execute()

    return {
        "message": "Dataset berhasil diupload",
        "filename": file.filename,
        "rows": len(df),
        "columns": df.columns.tolist()
    }


@app.post("/api/train", response_model=TrainingResponse)
def train_model(user_id: str = Depends(get_current_user_id)):
    """Train the machine learning model menggunakan data dari Supabase."""
    sb = get_supabase()

    # Cek apakah dataset ada
    check_res = sb.table("students_dataset").select("id").eq("user_id", user_id).limit(1).execute()
    if not check_res.data:
        raise HTTPException(
            status_code=404,
            detail="Dataset tidak ditemukan. Silakan upload dataset terlebih dahulu."
        )

    try:
        metrics = _train_model(user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saat training: {str(e)}")

    # Save training log ke Supabase
    model_version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    log = {
        "model_version": model_version,
        "accuracy": metrics["accuracy"],
        "precision_score": metrics["precision"],
        "recall": metrics["recall"],
        "f1_score": metrics["f1_score"],
        "total_samples": metrics["total_samples"],
        "trained_at": datetime.now().isoformat(),
        "user_id": user_id,
    }
    try:
        sb.table("training_logs").insert(log).execute()
    except Exception:
        pass  # Jangan gagalkan training jika log gagal disimpan

    return TrainingResponse(
        accuracy=metrics["accuracy"],
        precision=metrics["precision"],
        recall=metrics["recall"],
        f1_score=metrics["f1_score"],
        total_samples=metrics["total_samples"],
        model_version=model_version,
    )


@app.post("/api/predict", response_model=PredictionResponse)
def predict_student(student: StudentInput, user_id: str = Depends(get_current_user_id)):
    """Predict graduation for a single student."""
    student_dict = student.dict()
    # Remove nim and name before sending to ML model (they are not features)
    predict_input = {k: v for k, v in student_dict.items() if k not in ['nim', 'name']}
    try:
        result = _predict(predict_input)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saat prediksi: {str(e)}")

    # Save to prediction history di Supabase
    try:
        _save_prediction_history(student_dict, result, user_id)
    except Exception as e:
        print(f"Error saving prediction history: {e}")
        pass  # Don't fail the prediction if saving history fails

    return PredictionResponse(**result)


@app.post("/api/predict/batch")
async def predict_batch(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """Predict graduation for a batch of students from CSV/Excel."""
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Format file harus CSV atau Excel (.xlsx)")

    contents = await file.read()

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error membaca file: {str(e)}")

    results = []
    batch_student_data = []
    batch_results = []

    for _, row in df.iterrows():
        try:
            student_data = {
                'nim': str(row.get('nim', '')),
                'name': str(row.get('name', '')),
                'semester': int(row.get('semester', 6)),
                'gpa': float(row.get('gpa', 0)),
                'credits_completed': int(row.get('credits_completed', 0)),
                'attendance_rate': float(row.get('attendance_rate', 0)),
                'gender': str(row.get('gender', 'L')),
                'major': str(row.get('major', 'Ilmu Komputer')),
                'financial_status': str(row.get('financial_status', 'Mandiri')),
            }
            predict_input = {k: v for k, v in student_data.items() if k not in ['nim', 'name']}
            result = _predict(predict_input, user_id)
            result['nim'] = student_data['nim']
            result['name'] = student_data['name']
            results.append(result)

            batch_student_data.append(student_data)
            batch_results.append(result)
        except Exception as e:
            results.append({
                'nim': str(row.get('nim', '')),
                'error': str(e)
            })

    # Bulk save semua prediksi yang berhasil ke Supabase
    if batch_student_data:
        try:
            _bulk_save_prediction_history(batch_student_data, batch_results, user_id)
        except Exception as e:
            print(f"Error bulk saving prediction history: {e}")
            pass  # Don't fail the response if saving fails

    return {"results": results, "total": len(results)}


@app.get("/api/students")
def get_students(user_id: str = Depends(get_current_user_id)):
    """Get all students dari Supabase milik user yang sedang login."""
    sb = get_supabase()
    all_data = []
    page_size = 1000
    offset = 0
    while True:
        res = sb.table("students_dataset") \
            .select("nim,name,gender,major,semester,gpa,credits_completed,attendance_rate,financial_status,is_on_time") \
            .eq("user_id", user_id) \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not res.data:
            break
        all_data.extend(res.data)
        if len(res.data) < page_size:
            break
        offset += page_size

    return {"students": all_data, "total": len(all_data)}


@app.get("/api/dataset/stats")
def get_dataset_stats(user_id: str = Depends(get_current_user_id)):
    """Get dataset stats for current user."""
    sb = get_supabase()
    all_data = []
    page_size = 1000
    offset = 0
    while True:
        res = sb.table("students_dataset").select("nim").eq("user_id", user_id).range(offset, offset + page_size - 1).execute()
        if not res.data:
            break
        all_data.extend(res.data)
        if len(res.data) < page_size:
            break
        offset += page_size

    return {
        "total": len(all_data),
    }


@app.delete("/api/dataset")
def delete_all_dataset(user_id: str = Depends(get_current_user_id)):
    """Hapus semua data mahasiswa milik user yang sedang login, dan reset model/training log-nya."""
    sb = get_supabase()

    # Hitung jumlah data yang akan dihapus
    count_res = sb.table("students_dataset").select("nim").eq("user_id", user_id).execute()
    count = len(count_res.data) if count_res.data else 0

    # Hapus semua data milik user ini (walaupun kosong, hapus modelnya juga)
    if count > 0:
        sb.table("students_dataset").delete().eq("user_id", user_id).execute()

    # Hapus juga training logs agar status kembali seperti semula
    try:
        sb.table("training_logs").delete().eq("user_id", user_id).neq("id", "").execute()
    except Exception:
        pass

    # Hapus file model lokal jika ada
    user_model_path = os.path.join(BASE_DIR, f"model_{user_id}.pkl")
    user_features_path = os.path.join(BASE_DIR, f"features_{user_id}.pkl")
    if os.path.exists(user_model_path):
        os.remove(user_model_path)
    if os.path.exists(user_features_path):
        os.remove(user_features_path)

    if count == 0:
        return {"message": "Tidak ada data untuk dihapus (Model di-reset).", "deleted": 0}

    return {
        "message": f"Berhasil menghapus {count} data mahasiswa dan mereset model.",
        "deleted": count,
    }


@app.get("/api/training/log")
def get_training_log(user_id: str = Depends(get_current_user_id)):
    """Get the latest training log dari Supabase milik user yang sedang login."""
    sb = get_supabase()
    res = sb.table("training_logs").select("*").eq("user_id", user_id).order("trained_at", desc=True).limit(1).execute()

    if not res.data:
        return {"message": "Belum ada riwayat training"}

    log = res.data[0]
    # Map nama kolom agar sesuai dengan format yang diharapkan frontend
    return {
        "accuracy": log.get("accuracy", 0),
        "precision": log.get("precision_score", 0),
        "recall": log.get("recall", 0),
        "f1_score": log.get("f1_score", 0),
        "total_samples": log.get("total_samples", 0),
        "model_version": log.get("model_version", ""),
        "trained_at": log.get("trained_at", ""),
    }


# ─── Prediction History ───

@app.get("/api/predictions/history")
def get_prediction_history(user_id: str = Depends(get_current_user_id)):
    """Get all prediction history records milik user yang sedang login."""
    sb = get_supabase()
    all_data = []
    page_size = 1000
    offset = 0
    while True:
        res = sb.table("prediction_history") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("predicted_at", desc=True) \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not res.data:
            break
        all_data.extend(res.data)
        if len(res.data) < page_size:
            break
        offset += page_size

    # Map 'predicted_at' ke 'timestamp' agar kompatibel dengan frontend
    for r in all_data:
        r["timestamp"] = r.pop("predicted_at", "")

    return {"history": all_data, "total": len(all_data)}


@app.delete("/api/predictions/history/{record_id}")
def delete_prediction_history(record_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a single prediction history record by id."""
    sb = get_supabase()
    sb.table("prediction_history").delete().eq("id", record_id).eq("user_id", user_id).execute()
    return {"message": "Record berhasil dihapus"}


@app.delete("/api/predictions/history")
def clear_prediction_history(user_id: str = Depends(get_current_user_id)):
    """Clear all prediction history milik user yang sedang login."""
    sb = get_supabase()
    sb.table("prediction_history").delete().eq("user_id", user_id).neq("id", "").execute()
    return {"message": "Semua riwayat prediksi berhasil dihapus"}

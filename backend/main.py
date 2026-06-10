from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import os
import io
import json
import pickle
from datetime import datetime

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

# ─── Paths ───
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "features.pkl")

os.makedirs(DATA_DIR, exist_ok=True)


# ─── Schemas ───
class StudentInput(BaseModel):
    semester: int = 6
    gpa: float
    credits_completed: int
    attendance_rate: float
    extracurricular_score: Optional[int] = 60
    gender: str = "L"
    major: str = "Teknik Informatika"
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


# ─── Helper: Train model ───
def _train_model(dataset_path: str):
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    try:
        from xgboost import XGBClassifier
        use_xgb = True
    except ImportError:
        from sklearn.ensemble import RandomForestClassifier
        use_xgb = False

    df = pd.read_csv(dataset_path)
    X = df.drop(columns=['nim', 'is_on_time'], errors='ignore')
    y = df['is_on_time']

    # One-Hot Encoding
    X = pd.get_dummies(X, columns=['gender', 'major', 'financial_status'], drop_first=True)

    feature_names = X.columns.tolist()
    with open(FEATURES_PATH, 'wb') as f:
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

    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)

    return metrics


def _predict(input_data: dict):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError("Model belum ditraining. Silakan training model terlebih dahulu.")

    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(FEATURES_PATH, 'rb') as f:
        feature_names = pickle.load(f)

    df = pd.DataFrame([input_data])
    df = pd.get_dummies(df, columns=['gender', 'major', 'financial_status'])

    X_input = pd.DataFrame(columns=feature_names)
    X_input = pd.concat([X_input, df], axis=0).fillna(0)
    X_input = X_input[feature_names].astype(float)

    probability = float(model.predict_proba(X_input)[0][1])
    prediction = int(model.predict(X_input)[0])

    # SHAP
    shap_dict = {}
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_input)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        for i, feature in enumerate(feature_names):
            shap_dict[feature] = round(float(shap_values[0][i]), 4)
    except Exception:
        # Fallback: use feature importances
        importances = model.feature_importances_
        for i, feature in enumerate(feature_names):
            shap_dict[feature] = round(float(importances[i]), 4)

    sorted_factors = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    top_factors = [{"feature": k, "impact": v} for k, v in sorted_factors[:6]]

    return {
        "prediction": prediction,
        "probability_on_time": round(probability, 4),
        "risk_factors": top_factors
    }


# ─── Routes ───

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Graduate Predictor API", "version": "1.0.0"}


@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats():
    """Get summary statistics for the dashboard."""
    dataset_path = os.path.join(DATA_DIR, "students_dataset.csv")
    accuracy = 0.0

    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
        total = len(df)
        on_time = int(df['is_on_time'].sum()) if 'is_on_time' in df.columns else 0
        on_time_pct = round((on_time / total) * 100, 1) if total > 0 else 0

        # Count high-risk (simple heuristic on gpa < 2.75)
        high_risk = int((df['gpa'] < 2.75).sum()) if 'gpa' in df.columns else 0
    else:
        total = 0
        on_time_pct = 0
        high_risk = 0

    # Check model accuracy
    training_log = os.path.join(DATA_DIR, "training_log.json")
    if os.path.exists(training_log):
        with open(training_log, 'r') as f:
            log = json.load(f)
            accuracy = log.get("accuracy", 0)

    return DashboardStats(
        total_students=total,
        on_time_percentage=on_time_pct,
        high_risk_count=high_risk,
        model_accuracy=accuracy
    )


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a CSV/Excel dataset."""
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

    save_path = os.path.join(DATA_DIR, "students_dataset.csv")
    df.to_csv(save_path, index=False)

    return {
        "message": "Dataset berhasil diupload",
        "filename": file.filename,
        "rows": len(df),
        "columns": df.columns.tolist()
    }


@app.post("/api/train", response_model=TrainingResponse)
def train_model():
    """Train the machine learning model."""
    dataset_path = os.path.join(DATA_DIR, "students_dataset.csv")

    if not os.path.exists(dataset_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset tidak ditemukan. Silakan upload dataset terlebih dahulu."
        )

    try:
        metrics = _train_model(dataset_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saat training: {str(e)}")

    # Save training log
    log = {
        **metrics,
        "model_version": f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "trained_at": datetime.now().isoformat()
    }
    with open(os.path.join(DATA_DIR, "training_log.json"), 'w') as f:
        json.dump(log, f, indent=2)

    return TrainingResponse(**log)


@app.post("/api/predict", response_model=PredictionResponse)
def predict_student(student: StudentInput):
    """Predict graduation for a single student."""
    try:
        result = _predict(student.dict())
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saat prediksi: {str(e)}")

    return PredictionResponse(**result)


@app.post("/api/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
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
    for _, row in df.iterrows():
        try:
            input_data = {
                'semester': int(row.get('semester', 6)),
                'gpa': float(row.get('gpa', 0)),
                'credits_completed': int(row.get('credits_completed', 0)),
                'attendance_rate': float(row.get('attendance_rate', 0)),
                'extracurricular_score': int(row.get('extracurricular_score', 0)),
                'gender': str(row.get('gender', 'L')),
                'major': str(row.get('major', 'Teknik Informatika')),
                'financial_status': str(row.get('financial_status', 'Mandiri')),
            }
            result = _predict(input_data)
            result['nim'] = str(row.get('nim', ''))
            results.append(result)
        except Exception as e:
            results.append({
                'nim': str(row.get('nim', '')),
                'error': str(e)
            })

    return {"results": results, "total": len(results)}


@app.get("/api/students")
def get_students():
    """Get all students from the dataset."""
    dataset_path = os.path.join(DATA_DIR, "students_dataset.csv")
    if not os.path.exists(dataset_path):
        return {"students": [], "total": 0}

    df = pd.read_csv(dataset_path)
    students = df.head(100).to_dict(orient='records')
    return {"students": students, "total": len(df)}


@app.get("/api/training/log")
def get_training_log():
    """Get the latest training log."""
    log_path = os.path.join(DATA_DIR, "training_log.json")
    if not os.path.exists(log_path):
        return {"message": "Belum ada riwayat training"}

    with open(log_path, 'r') as f:
        return json.load(f)

"""
migrate_to_supabase.py
Skrip untuk migrasi data dari file CSV/JSON lokal ke database Supabase.

Jalankan setelah tabel baru (students_dataset, prediction_history, training_logs)
sudah dibuat di Supabase SQL Editor.

Usage:
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python migrate_to_supabase.py
"""

import os
import json
import uuid
import pandas as pd  # type: ignore
from database import get_supabase

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")


def migrate_students_dataset():
    """Migrasi data dari students_dataset.csv ke tabel students_dataset di Supabase."""
    csv_path = os.path.join(DATA_DIR, "students_dataset.csv")
    if not os.path.exists(csv_path):
        print("⚠️  students_dataset.csv tidak ditemukan, dilewati.")
        return

    df = pd.read_csv(csv_path)
    # Deduplikasi: simpan hanya baris terakhir per NIM
    df['nim'] = df['nim'].astype(str)
    df = df.drop_duplicates(subset='nim', keep='last')
    print(f"📖 Membaca {len(df)} baris unik dari students_dataset.csv...")

    sb = get_supabase()
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
            "data_source": "dummy",
        })

    # Upsert dalam batch @100 rows
    batch_size = 100
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        sb.table("students_dataset").upsert(batch, on_conflict="nim").execute()
        print(f"   ✅ Batch {i // batch_size + 1}: {len(batch)} baris di-upsert")

    print(f"✅ Migrasi students_dataset selesai: {len(records)} baris total\n")


def migrate_prediction_history():
    """Migrasi data dari prediction_history.csv ke tabel prediction_history di Supabase."""
    csv_path = os.path.join(DATA_DIR, "prediction_history.csv")
    if not os.path.exists(csv_path):
        print("⚠️  prediction_history.csv tidak ditemukan, dilewati.")
        return

    df = pd.read_csv(csv_path)
    df = df.fillna("")
    print(f"📖 Membaca {len(df)} baris dari prediction_history.csv...")

    sb = get_supabase()
    records = []
    for _, row in df.iterrows():
        record_id = str(row.get("id", str(uuid.uuid4())))
        records.append({
            "id": record_id,
            "predicted_at": str(row.get("timestamp", "")),
            "nim": str(row.get("nim", "")),
            "name": str(row.get("name", "")),
            "gender": str(row.get("gender", "")),
            "semester": int(row.get("semester", 6)) if row.get("semester", "") != "" else 6,
            "gpa": float(row.get("gpa", 0)) if row.get("gpa", "") != "" else 0,
            "credits_completed": int(row.get("credits_completed", 0)) if row.get("credits_completed", "") != "" else 0,
            "attendance_rate": float(row.get("attendance_rate", 0)) if row.get("attendance_rate", "") != "" else 0,
            "major": str(row.get("major", "")),
            "financial_status": str(row.get("financial_status", "")),
            "prediction": int(row.get("prediction", 0)) if row.get("prediction", "") != "" else 0,
            "probability_on_time": float(row.get("probability_on_time", 0)) if row.get("probability_on_time", "") != "" else 0,
        })

    # Upsert dalam batch @100 rows
    batch_size = 100
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        sb.table("prediction_history").upsert(batch, on_conflict="id").execute()
        print(f"   ✅ Batch {i // batch_size + 1}: {len(batch)} baris di-upsert")

    print(f"✅ Migrasi prediction_history selesai: {len(records)} baris total\n")


def migrate_training_log():
    """Migrasi data dari training_log.json ke tabel training_logs di Supabase."""
    log_path = os.path.join(DATA_DIR, "training_log.json")
    if not os.path.exists(log_path):
        print("⚠️  training_log.json tidak ditemukan, dilewati.")
        return

    with open(log_path, 'r') as f:
        log = json.load(f)

    print(f"📖 Membaca training log: model {log.get('model_version', 'unknown')}...")

    sb = get_supabase()
    record = {
        "model_version": log.get("model_version", "unknown"),
        "accuracy": float(log.get("accuracy", 0)),
        "precision_score": float(log.get("precision", 0)),
        "recall": float(log.get("recall", 0)),
        "f1_score": float(log.get("f1_score", 0)),
        "total_samples": int(log.get("total_samples", 0)),
        "trained_at": log.get("trained_at", None),
    }

    sb.table("training_logs").insert(record).execute()
    print(f"✅ Migrasi training_log selesai: {record['model_version']}\n")


def main():
    print("=" * 55)
    print("Migrasi Data Lokal -> Supabase")
    print("=" * 55)
    print()

    migrate_students_dataset()
    migrate_prediction_history()
    migrate_training_log()

    print("=" * 55)
    print("Migrasi selesai! Data sudah tersimpan di Supabase.")
    print("=" * 55)


if __name__ == "__main__":
    main()

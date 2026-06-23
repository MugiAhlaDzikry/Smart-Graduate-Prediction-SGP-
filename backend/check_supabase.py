import os
from database import get_supabase

sb = get_supabase()

# 1. Cek jumlah data di students_dataset
res_students = sb.table("students_dataset").select("nim", count="exact").execute()
print(f"Total students_dataset: {len(res_students.data)} (exact count: {res_students.count})")

# 2. Cek data di prediction_history
res_history = sb.table("prediction_history").select("*").execute()
print(f"Total prediction_history: {len(res_history.data)}")
for row in res_history.data:
    print(f"- NIM: {row.get('nim')}, Name: {row.get('name')}, Prediction: {row.get('prediction')}, At: {row.get('predicted_at')}")

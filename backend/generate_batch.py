import numpy as np
import pandas as pd
import os

np.random.seed(99)

N = 25 # Generate 25 students for batch prediction

gender = np.random.choice(['L', 'P'], size=N, p=[0.55, 0.45])
gpa = np.clip(np.round(np.random.normal(loc=3.10, scale=0.50, size=N), 2), 1.5, 4.0)

# Credits and attendance correlated with GPA
base_credits = 80 + (gpa - 2.0) * 15
credits_completed = np.clip(base_credits + np.random.normal(0, 10, size=N), 50, 144).astype(int)

base_attendance = 50 + (gpa - 2.0) * 15
attendance_rate = np.clip(np.round(base_attendance + np.random.normal(0, 10, size=N), 2), 20.0, 100.0)

financial_status = np.random.choice(
    ['Mandiri', 'Beasiswa', 'KIP-K'],
    size=N,
    p=[0.60, 0.25, 0.15]
)

semester = np.full(N, 6)
major = np.full(N, 'Ilmu Komputer')

nims = [f"130121{np.random.randint(1000, 9999)}" for _ in range(N)]
names = [f"Mahasiswa Batch {i+1}" for i in range(N)]

df = pd.DataFrame({
    'nim': nims,
    'name': names,
    'gender': gender,
    'major': major,
    'semester': semester,
    'gpa': gpa,
    'credits_completed': credits_completed,
    'attendance_rate': attendance_rate,
    'financial_status': financial_status
})

output_path = os.path.join('data', 'data_prediksi_batch.csv')
df.to_csv(output_path, index=False)
print(f"File berhasil dibuat: {output_path} dengan {N} baris.")

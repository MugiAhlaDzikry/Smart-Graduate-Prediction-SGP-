"""
Generate Realistic Synthetic Dataset for Graduate Prediction v2
================================================================
Perbaikan dari v1:
- Rentang kehadiran diperluas: 30-100% (sebelumnya 50-100%)
- Penalti keras untuk zona kritis (IPK < 2.5 atau Kehadiran < 50%)
- Bobot IPK dan Kehadiran ditingkatkan, SKS dikurangi
- Sigmoid lebih tajam agar perbedaan benar-benar terasa
- Rasio kelulusan ~65% (realistis untuk universitas Indonesia)
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

N = 1007

# --- 1. Generate Features ---

# Gender: 55% L, 45% P
gender = np.random.choice(['L', 'P'], size=N, p=[0.55, 0.45])

# IPK: Normal, mean=3.15, std=0.40, clip [2.0, 4.0]
gpa = np.random.normal(loc=3.15, scale=0.40, size=N)
gpa = np.clip(gpa, 2.0, 4.0)
gpa = np.round(gpa, 2)

# SKS: Berkorelasi positif dengan IPK (tapi tidak terlalu kuat)
base_credits = 85 + (gpa - 2.0) * 15
credits_noise = np.random.normal(0, 10, size=N)
credits_completed = base_credits + credits_noise
credits_completed = np.clip(credits_completed, 60, 144).astype(int)

# Kehadiran: Rentang lebih luas 30-100%, berkorelasi dengan IPK
base_attendance = 55 + (gpa - 2.0) * 12
attendance_noise = np.random.normal(0, 10, size=N)
attendance_rate = base_attendance + attendance_noise
attendance_rate = np.clip(attendance_rate, 30.0, 100.0)
attendance_rate = np.round(attendance_rate, 2)

# Status Keuangan
financial_status = np.random.choice(
    ['Mandiri', 'Beasiswa', 'KIP-K'],
    size=N,
    p=[0.50, 0.30, 0.20]
)

semester = np.full(N, 6)
major = np.full(N, 'Ilmu Komputer')

# NIM unik
nim_set = set()
unique_nims = []
for _ in range(N):
    nim = f"130120{np.random.randint(1000, 9999)}"
    while nim in nim_set:
        nim = f"130120{np.random.randint(1000, 9999)}"
    nim_set.add(nim)
    unique_nims.append(nim)

# --- 2. Hitung Label is_on_time ---

def normalize(arr, low, high):
    return np.clip((arr - low) / (high - low), 0, 1)

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

gpa_norm = normalize(gpa, 2.0, 4.0)
credits_norm = normalize(credits_completed, 60, 144)
attendance_norm = normalize(attendance_rate, 30.0, 100.0)

# Bonus keuangan (sangat kecil)
financial_bonus = np.where(financial_status == 'Beasiswa', 0.05,
                  np.where(financial_status == 'KIP-K', 0.02, 0.0))

# Skor gabungan:
# IPK = 0.50 (paling dominan)
# Kehadiran = 0.28 (kedua terpenting)
# SKS = 0.15 (pelengkap, bukan penentu)
# Keuangan = 0.07 (minor)
raw_score = (
    0.50 * gpa_norm +
    0.28 * attendance_norm +
    0.15 * credits_norm +
    0.07 * financial_bonus
)

# Penalti keras untuk zona kritis
# IPK < 2.5: penalti berat
gpa_penalty = np.where(gpa < 2.5, -0.25, 0.0)
# Kehadiran < 50%: penalti berat
attendance_penalty = np.where(attendance_rate < 50, -0.25, 0.0)
# Kehadiran < 40%: penalti sangat berat (tambahan)
attendance_penalty += np.where(attendance_rate < 40, -0.15, 0.0)
# IPK < 2.25: penalti tambahan
gpa_penalty += np.where(gpa < 2.25, -0.15, 0.0)

raw_score = raw_score + gpa_penalty + attendance_penalty

# Sigmoid lebih tajam (spread factor 10)
logit_score = (raw_score - 0.40) * 10

probability = sigmoid(logit_score)

# Noise kecil
noise = np.random.normal(0, 0.06, size=N)
noisy_probability = probability + noise

is_on_time = (noisy_probability >= 0.5).astype(int)

# --- 3. Buat DataFrame ---

df = pd.DataFrame({
    'nim': unique_nims,
    'gender': gender,
    'major': major,
    'semester': semester,
    'gpa': gpa,
    'credits_completed': credits_completed,
    'attendance_rate': attendance_rate,
    'financial_status': financial_status,
    'is_on_time': is_on_time
})

# --- 4. Statistik Verifikasi ---

total = len(df)
on_time = df['is_on_time'].sum()
not_on_time = total - on_time

print(f"\n{'='*60}")
print(f"  STATISTIK DATA SINTETIS REALISTIS v2")
print(f"{'='*60}")
print(f"  Total Mahasiswa     : {total}")
print(f"  Lulus Tepat Waktu   : {on_time} ({on_time/total*100:.1f}%)")
print(f"  Tidak Tepat Waktu   : {not_on_time} ({not_on_time/total*100:.1f}%)")
print(f"{'='*60}")

print(f"\n  KORELASI DENGAN is_on_time:")
print(f"  - IPK (GPA)         : {df['gpa'].corr(df['is_on_time']):.4f}")
print(f"  - SKS Selesai       : {df['credits_completed'].corr(df['is_on_time']):.4f}")
print(f"  - Kehadiran         : {df['attendance_rate'].corr(df['is_on_time']):.4f}")
print(f"  - Gender (L=1,P=0)  : {df['gender'].map({'L':1,'P':0}).corr(df['is_on_time']):.4f}")

print(f"\n  RATA-RATA PER KELOMPOK:")
for label, group in df.groupby('is_on_time'):
    status = "Tepat Waktu" if label == 1 else "Tidak Tepat"
    print(f"  - {status}: IPK={group['gpa'].mean():.2f}, SKS={group['credits_completed'].mean():.0f}, Kehadiran={group['attendance_rate'].mean():.1f}%")

# Verifikasi zona kritis
low_gpa = df[df['gpa'] < 2.5]
low_att = df[df['attendance_rate'] < 50]
both_low = df[(df['gpa'] < 2.5) & (df['attendance_rate'] < 50)]

print(f"\n  VERIFIKASI ZONA KRITIS:")
print(f"  - IPK < 2.5         : {len(low_gpa)} mhs, lulus tepat waktu {low_gpa['is_on_time'].mean()*100:.1f}%")
print(f"  - Kehadiran < 50%   : {len(low_att)} mhs, lulus tepat waktu {low_att['is_on_time'].mean()*100:.1f}%")
if len(both_low) > 0:
    print(f"  - Keduanya rendah   : {len(both_low)} mhs, lulus tepat waktu {both_low['is_on_time'].mean()*100:.1f}%")

print(f"\n  RATA-RATA PER GENDER:")
for g, group in df.groupby('gender'):
    label = "Laki-laki" if g == 'L' else "Perempuan"
    rate = group['is_on_time'].mean() * 100
    print(f"  - {label}: Lulus Tepat Waktu = {rate:.1f}%")

# Simpan
output_path = os.path.join('data', 'students_dataset.csv')
df.to_csv(output_path, index=False)
print(f"\n  Dataset tersimpan di: {output_path}")
print(f"{'='*60}\n")

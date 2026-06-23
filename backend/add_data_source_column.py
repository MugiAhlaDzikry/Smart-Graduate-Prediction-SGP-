"""
Script untuk menambahkan kolom data_source ke tabel students_dataset di Supabase
dan menandai semua data existing sebagai 'dummy'.
"""
from database import get_supabase

sb = get_supabase()

# 1. Cek apakah kolom data_source sudah ada dengan mencoba query
print("Menambahkan kolom data_source ke students_dataset...")
print("(Jalankan SQL berikut di Supabase SQL Editor jika belum):")
print()
print("  ALTER TABLE students_dataset ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'dummy';")
print()

# 2. Update semua data existing agar data_source = 'dummy'
print("Menandai semua data existing sebagai 'dummy'...")
try:
    # Update semua baris yang belum punya data_source atau masih null
    res = sb.table("students_dataset").update({"data_source": "dummy"}).is_("data_source", "null").execute()
    print(f"  Updated {len(res.data)} baris (yang null) -> 'dummy'")
except Exception as e:
    print(f"  Info: {e}")

# Juga update yang mungkin sudah ada tapi belum di-set
try:
    res = sb.table("students_dataset").update({"data_source": "dummy"}).eq("data_source", "dummy").execute()
    print(f"  Confirmed {len(res.data)} baris sebagai 'dummy'")
except Exception as e:
    print(f"  Info: {e}")

# 3. Verifikasi
print()
print("Verifikasi data_source counts:")
try:
    res_all = sb.table("students_dataset").select("data_source").execute()
    dummy_count = sum(1 for r in res_all.data if r.get("data_source") == "dummy")
    real_count = sum(1 for r in res_all.data if r.get("data_source") in ("prediction", "real"))
    null_count = sum(1 for r in res_all.data if r.get("data_source") is None)
    print(f"  Total: {len(res_all.data)}")
    print(f"  Dummy: {dummy_count}")
    print(f"  Real: {real_count}")
    print(f"  Null: {null_count}")
except Exception as e:
    print(f"  Error: {e}")

print()
print("Selesai!")

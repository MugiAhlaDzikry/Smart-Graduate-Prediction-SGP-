"""
Script untuk menambahkan kolom name ke tabel students_dataset di Supabase
dan menandai semua data existing dengan nama "Mahasiswa [NIM]".
"""
from database import get_supabase

sb = get_supabase()

print("Menambahkan kolom name ke students_dataset...")
print("PENTING: Pastikan Anda telah menjalankan SQL berikut di Supabase SQL Editor:")
print("  ALTER TABLE students_dataset ADD COLUMN IF NOT EXISTS name VARCHAR(255);")
print()

# Update semua data existing agar name = 'Mahasiswa ' + nim
print("Mengisi nama yang kosong dengan placeholder 'Mahasiswa [NIM]'...")
try:
    # Get all records where name is null
    res = sb.table("students_dataset").select("nim, name").is_("name", "null").execute()
    records_to_update = res.data
    
    if records_to_update:
        print(f"  Ditemukan {len(records_to_update)} baris tanpa nama.")
        
        # We need to update row by row or do a bulk upsert.
        # Since PostgREST doesn't support complex SQL expressions like "name = 'Mahasiswa ' || nim" in update()
        # we will use a loop to upsert.
        
        # Batch size 100
        batch = []
        updated_count = 0
        for r in records_to_update:
            nim = r['nim']
            batch.append({
                "nim": nim,
                "name": f"Mahasiswa {nim}"
            })
            
            if len(batch) >= 100:
                sb.table("students_dataset").upsert(batch, on_conflict="nim").execute()
                updated_count += len(batch)
                batch = []
                
        # Flush remaining
        if batch:
            sb.table("students_dataset").upsert(batch, on_conflict="nim").execute()
            updated_count += len(batch)
            
        print(f"  Berhasil mengupdate {updated_count} baris dengan nama default.")
    else:
        print("  Semua data sudah memiliki nama (atau tidak ada data null).")
except Exception as e:
    print(f"  Info/Error: {e}")

print()
print("Selesai!")

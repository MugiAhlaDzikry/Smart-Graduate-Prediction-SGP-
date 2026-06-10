import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, Download, Users } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = async (file) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      setUploadStatus({ type: 'error', message: 'Format file harus .csv, .xlsx, atau .xls' });
      return;
    }

    setIsUploading(true);
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });

    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      setUploadStatus({ type: 'success', message: `File "${file.name}" berhasil diupload (${(file.size / 1024).toFixed(1)} KB)` });

      // Mock students data
      setStudents([
        { nim: '130120001', name: 'Ahmad Fauzi', gender: 'L', major: 'Teknik Informatika', gpa: 3.65, semester: 7, status: 'aktif' },
        { nim: '130121023', name: 'Siti Nurhaliza', gender: 'P', major: 'Sistem Informasi', gpa: 3.12, semester: 6, status: 'aktif' },
        { nim: '130120045', name: 'Budi Santoso', gender: 'L', major: 'Teknik Komputer', gpa: 2.45, semester: 8, status: 'aktif' },
        { nim: '130122012', name: 'Dewi Lestari', gender: 'P', major: 'Teknik Informatika', gpa: 3.88, semester: 5, status: 'aktif' },
        { nim: '130121056', name: 'Reza Pratama', gender: 'L', major: 'Sistem Informasi', gpa: 2.78, semester: 7, status: 'aktif' },
        { nim: '130120089', name: 'Maya Indah', gender: 'P', major: 'Teknik Komputer', gpa: 3.45, semester: 6, status: 'aktif' },
        { nim: '130122034', name: 'Andi Wijaya', gender: 'L', major: 'Teknik Informatika', gpa: 2.91, semester: 5, status: 'aktif' },
        { nim: '130121078', name: 'Putri Rahayu', gender: 'P', major: 'Sistem Informasi', gpa: 3.72, semester: 6, status: 'aktif' },
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Mahasiswa</h1>
          <p className="text-slate-500 mt-1">Kelola dan import data mahasiswa</p>
        </div>
        {students.length > 0 && (
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-200 ${
          isDragging
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="h-14 w-14 border-4 border-blue-100 rounded-full" />
                <div className="absolute inset-0 h-14 w-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-700">Mengupload {fileInfo?.name}...</p>
              <p className="text-xs text-slate-400 mt-1">{fileInfo?.size}</p>
            </div>
          ) : (
            <>
              <div className="inline-block p-4 bg-blue-50 rounded-2xl mb-4">
                <FileSpreadsheet className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-sm text-slate-600 mb-1">
                <span className="text-blue-600 font-semibold">Klik untuk upload</span> atau drag & drop file
              </p>
              <p className="text-xs text-slate-400">CSV, XLSX (Maks. 10MB)</p>
            </>
          )}
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{uploadStatus.message}</span>
        </div>
      )}

      {/* Students Table */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Daftar Mahasiswa</h3>
                <p className="text-sm text-slate-500">{students.length} mahasiswa ditemukan</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">NIM</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Nama</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Gender</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Prodi</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">IPK</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Semester</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.nim} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{s.nim}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        s.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.major}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${
                        s.gpa >= 3.5 ? 'text-emerald-600' : s.gpa >= 3.0 ? 'text-blue-600' : s.gpa >= 2.5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {s.gpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.semester}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {students.length === 0 && !isUploading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="inline-block p-4 bg-slate-50 rounded-2xl mb-4">
            <Users className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Belum Ada Data</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Upload file CSV atau Excel berisi data mahasiswa untuk memulai analisis
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Users, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react';
import api from '../lib/api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 20;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/students');
      setStudents(res.data.students || []);
      setTotalStudents(res.data.total || 0);
    } catch (err) {
      console.error('Gagal memuat data mahasiswa', err);
    } finally {
      setLoading(false);
    }
  };

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
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadStatus({
        type: 'success',
        message: `File "${res.data.filename}" berhasil diupload (${res.data.rows} baris, ${res.data.columns.length} kolom)`,
      });

      // Refresh student list from backend
      await fetchStudents();
      setCurrentPage(1);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Gagal mengupload file.';
      setUploadStatus({ type: 'error', message: detail });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus SEMUA data mahasiswa? Data ini tidak dapat dikembalikan.')) {
      return;
    }
    try {
      setLoading(true);
      await api.delete('/api/dataset');
      await fetchStudents();
      setUploadStatus({ type: 'success', message: 'Seluruh data mahasiswa berhasil dihapus.' });
    } catch (err) {
      setUploadStatus({ type: 'error', message: 'Gagal menghapus data: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setLoading(false);
    }
  };

  // Search & pagination
  const filtered = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(s.nim || '').toLowerCase().includes(q) ||
      String(s.name || '').toLowerCase().includes(q) ||
      String(s.gender || '').toLowerCase().includes(q) ||
      String(s.major || '').toLowerCase().includes(q) ||
      String(s.financial_status || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const gpaColor = (gpa) => {
    if (gpa >= 3.5) return 'text-emerald-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.5) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Mahasiswa</h1>
          <p className="text-slate-500 mt-1">Kelola dan import data mahasiswa</p>
        </div>
        {students.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-xl transition-colors text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Semua Data
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
      {!loading && students.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Daftar Mahasiswa</h3>
                <p className="text-sm text-slate-500">{totalStudents.toLocaleString('id-ID')} mahasiswa dalam dataset</p>
              </div>
            </div>
            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari NIM, gender..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
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
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">SKS</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Kehadiran</th>

                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status Keuangan</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status Kelulusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((s, idx) => (
                  <tr key={s.nim || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{s.nim || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{s.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        s.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.major || 'Ilmu Komputer'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${gpaColor(s.gpa)}`}>
                        {s.gpa?.toFixed(2) || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.credits_completed || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.attendance_rate?.toFixed(1) || '-'}%</td>

                    <td className="px-6 py-4 text-sm text-slate-600">{s.financial_status || '-'}</td>
                    <td className="px-6 py-4">
                      {s.is_on_time !== undefined ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            s.is_on_time === 1
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                              : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                          }`}
                        >
                          {s.is_on_time === 1 ? 'Tepat Waktu' : 'Terlambat'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, filtered.length)} dari {filtered.length} data
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-slate-700 px-3">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="relative inline-block mb-4">
            <div className="h-12 w-12 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-500 text-sm">Memuat data mahasiswa...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && students.length === 0 && !isUploading && (
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

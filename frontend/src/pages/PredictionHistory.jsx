import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  History, Trash2, Search, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw, Trash
} from 'lucide-react';

export default function PredictionHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const itemsPerPage = 10;

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:8000/api/predictions/history');
      setHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
      setError('Gagal mengambil riwayat prediksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Hapus data prediksi ini?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:8000/api/predictions/history/${id}`);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Hapus SEMUA riwayat prediksi? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      await axios.delete('http://localhost:8000/api/predictions/history');
      setHistory([]);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus riwayat.');
    }
  };

  // Filter by search
  const filtered = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      String(item.nim || '').toLowerCase().includes(q) ||
      String(item.name || '').toLowerCase().includes(q) ||
      String(item.gender || '').toLowerCase().includes(q) ||
      String(item.major || '').toLowerCase().includes(q) ||
      String(item.gpa || '').includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRiskBadge = (prob) => {
    const p = parseFloat(prob);
    if (p >= 0.75)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10">
          <CheckCircle2 className="h-3 w-3" /> Rendah
        </span>
      );
    if (p >= 0.5)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-600/10">
          <AlertCircle className="h-3 w-3" /> Sedang
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-600/10">
        <XCircle className="h-3 w-3" /> Tinggi
      </span>
    );
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Prediksi</h1>
          <p className="text-slate-500 mt-1">
            Semua hasil prediksi tersimpan dan dapat digunakan untuk re-training model
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all"
            >
              <Trash className="h-4 w-4" />
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Prediksi</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{history.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Prediksi Lulus Tepat Waktu</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {history.filter((h) => h.prediction === 1 || h.prediction === '1').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Prediksi Berisiko Terlambat</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {history.filter((h) => h.prediction === 0 || h.prediction === '0').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan NIM, Nama, gender, jurusan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm">
            <AlertCircle className="h-5 w-5 mr-2" /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <History className="h-12 w-12 mb-4" />
            <p className="text-sm font-medium">
              {searchQuery ? 'Tidak ada hasil yang cocok' : 'Belum ada riwayat prediksi'}
            </p>
            <p className="text-xs mt-1">
              {searchQuery ? 'Coba ubah kata pencarian' : 'Lakukan prediksi di halaman Prediksi Kelulusan'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Waktu</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">NIM</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nama</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gender</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">IPK</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKS</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kehadiran</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasil</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Probabilitas</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risiko</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(item.timestamp)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {item.nim || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {item.name || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {item.gender === 'L' ? 'Laki-laki' : item.gender === 'P' ? 'Perempuan' : item.gender}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {parseFloat(item.gpa).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{item.credits_completed}</td>
                      <td className="px-5 py-3.5 text-slate-600">{parseFloat(item.attendance_rate).toFixed(1)}%</td>
                      <td className="px-5 py-3.5">
                        {item.prediction === 1 || item.prediction === '1' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Tepat Waktu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-medium text-xs">
                            <XCircle className="h-3.5 w-3.5" /> Terlambat
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {(parseFloat(item.probability_on_time) * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3.5">{getRiskBadge(item.probability_on_time)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Hapus"
                        >
                          {deletingId === item.id ? (
                            <div className="h-4 w-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((page, idx, arr) => (
                      <span key={page} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-1 text-slate-300">…</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all ${
                            currentPage === page
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

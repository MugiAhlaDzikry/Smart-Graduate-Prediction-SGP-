import { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle, Clock, BarChart3, Zap, Database, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

export default function Training() {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);
  const [datasetStats, setDatasetStats] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Cek apakah sudah ada log training saat komponen dimuat
  useEffect(() => {
    fetchTrainingLog();
    fetchDatasetStats();
  }, []);

  const fetchDatasetStats = async () => {
    try {
      const res = await api.get('/api/dataset/stats');
      setDatasetStats(res.data);
    } catch (err) {
      console.error('Gagal mengambil statistik dataset', err);
    }
  };

  const fetchTrainingLog = async () => {
    try {
      const res = await api.get('/api/training/log');
      if (res.data && res.data.accuracy) {
        setTrainingResult(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil log training', err);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);
    setProgress(0);
    setTrainingResult(null);
    setError('');

    // Animasi progress bar palsu untuk UX sementara request API berjalan
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Stop di 90% sampai API selesai
        return prev + Math.random() * 5;
      });
    }, 500);

    try {
      // Panggil API training asli
      const res = await api.post('/api/train');
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Tunggu sebentar agar progress bar 100% terlihat
      setTimeout(() => {
        setIsTraining(false);
        setTrainingResult(res.data);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setIsTraining(false);
      setProgress(0);
      setError(err.response?.data?.detail || 'Terjadi kesalahan saat melatih model.');
    }
  };

  const metrics = [
    { label: 'Accuracy', key: 'accuracy', icon: Zap, color: 'blue' },
    { label: 'Precision', key: 'precision', icon: BarChart3, color: 'purple' },
    { label: 'Recall', key: 'recall', icon: Database, color: 'emerald' },
    { label: 'F1 Score', key: 'f1_score', icon: Cpu, color: 'amber' },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/20', bar: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-500/20', bar: 'bg-purple-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-500/20', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500/20', bar: 'bg-amber-500' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Training Model</h1>
        <p className="text-slate-500 mt-1">Latih model Machine Learning untuk prediksi kelulusan</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Training Control */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl ring-1 ring-indigo-500/20">
                <Cpu className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">XGBoost Classifier</h3>
                <p className="text-sm text-slate-500">Model utama untuk prediksi kelulusan mahasiswa</p>
              </div>
            </div>
            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isTraining ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Mulai Training
                </>
              )}
            </button>
          </div>

          {/* Config info */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Algorithm', value: 'XGBoost' },
              { label: 'Test Size', value: '20%' },
              { label: 'Random State', value: '42' },
              { label: 'Eval Metric', value: 'Log Loss' },
            ].map((item) => (
              <div key={item.label} className="px-4 py-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-slate-700">{item.value}</p>
              </div>
            ))}
            
            {/* Tampilkan statistik dataset jika tersedia */}
            {datasetStats && (
              <div className="col-span-2 sm:col-span-4 mt-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs font-semibold text-blue-600 mb-0.5">Dataset Training</p>
                <p className="text-sm text-blue-800">
                  Total Data: <strong>{datasetStats.total}</strong> mahasiswa (Data Sintetis Realistis)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isTraining && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Progress</span>
              <span className="text-sm font-semibold text-blue-600">{Math.min(Math.round(progress), 100)}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Preprocessing → Feature Encoding → Model Fitting → Evaluating...
            </div>
          </div>
        )}
      </div>

      {/* Training Result */}
      {trainingResult && (
        <>
          {/* Success Banner */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">Model Siap Digunakan!</p>
              <p className="text-xs text-emerald-600">
                Model {trainingResult.model_version} dilatih pada {trainingResult.total_samples || '-'} sampel data
              </p>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => {
              const c = colorMap[m.color];
              const val = trainingResult[m.key] || 0;
              return (
                <div key={m.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-500">{m.label}</p>
                    <div className={`p-2 rounded-lg ${c.bg} ring-1 ${c.ring}`}>
                      <m.icon className={`h-4 w-4 ${c.text}`} />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${c.text}`}>{(val * 100).toFixed(1)}%</p>
                  <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.bar} transition-all duration-1000`} style={{ width: `${val * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Training Log */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Detail Training</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Model Version</p>
                <p className="text-sm font-semibold text-slate-700 font-mono">{trainingResult.model_version}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Total Sampel</p>
                <p className="text-sm font-semibold text-slate-700">{(trainingResult.total_samples || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Waktu Training</p>
                <p className="text-sm font-semibold text-slate-700">
                  {trainingResult.trained_at ? new Date(trainingResult.trained_at).toLocaleString('id-ID') : '-'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state if no result */}
      {!trainingResult && !isTraining && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="inline-block p-4 bg-slate-50 rounded-2xl mb-4">
            <Cpu className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Belum Ada Riwayat Training</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Pastikan dataset sudah diupload, lalu klik "Mulai Training" untuk melatih model dengan data yang ada.
          </p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import axios from 'axios';
import {
  Activity, Upload, Search, ChevronDown, AlertCircle,
  CheckCircle2, XCircle, TrendingUp, TrendingDown, Info,
  FileText, Trash2, Check
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function Predictions() {
  const [activeTab, setActiveTab] = useState('individual');
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nim: '',
    name: '',
    semester: 6,
    gpa: '',
    credits_completed: '',
    attendance_rate: '',
    gender: 'L',
    major: 'Ilmu Komputer',
    financial_status: 'Mandiri',
  });

  const [batchFile, setBatchFile] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const featureMapping = {
    gpa: 'IPK (GPA)',
    credits_completed: 'SKS Selesai',
    attendance_rate: 'Kehadiran',
    semester: 'Semester',
    gender: 'Jenis Kelamin',
    financial_status: 'Status Keuangan',
  };

  const mapFeatureName = (feature) => {
    for (const [key, val] of Object.entries(featureMapping)) {
      if (feature.startsWith(key)) {
        return val;
      }
    }
    return feature;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPredictionResult(null);

    const payload = {
      nim: formData.nim,
      name: formData.name,
      semester: parseInt(formData.semester) || 6,
      gpa: parseFloat(formData.gpa),
      credits_completed: parseInt(formData.credits_completed),
      attendance_rate: parseFloat(formData.attendance_rate),
      gender: formData.gender,
      major: formData.major,
      financial_status: formData.financial_status,
    };

    try {
      const response = await axios.post('http://localhost:8000/api/predict', payload);
      const data = response.data;

      const mappedRiskFactors = data.risk_factors.map((f) => ({
        feature: mapFeatureName(f.feature),
        impact: f.impact,
        direction: f.impact >= 0 ? 'positive' : 'negative',
      }));

      setPredictionResult({
        nim: formData.nim,
        name: formData.name,
        prediction: data.prediction,
        probability_on_time: data.probability_on_time,
        risk_factors: mappedRiskFactors,
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Gagal memproses prediksi dari server backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevel = (prob) => {
    if (prob >= 0.75) return { text: 'Risiko Rendah', color: 'emerald', icon: CheckCircle2 };
    if (prob >= 0.5) return { text: 'Risiko Sedang', color: 'amber', icon: AlertCircle };
    return { text: 'Risiko Tinggi', color: 'red', icon: XCircle };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBatchFile(file);
      setBatchError(null);
      setBatchResults(null);
    }
  };

  const handleBatchUpload = async (e) => {
    e.preventDefault();
    if (!batchFile) {
      setBatchError('Pilih file terlebih dahulu.');
      return;
    }

    setIsBatchLoading(true);
    setBatchError(null);
    setBatchResults(null);

    const data = new FormData();
    data.append('file', batchFile);

    try {
      const response = await axios.post('http://localhost:8000/api/predict/batch', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setBatchResults(response.data);
    } catch (err) {
      console.error(err);
      setBatchError(err.response?.data?.detail || 'Gagal memproses batch prediksi dari server backend.');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleResetBatch = () => {
    setBatchFile(null);
    setBatchResults(null);
    setBatchError(null);
    setExpandedRow(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prediksi Kelulusan</h1>
          <p className="text-slate-500 mt-1">
            Prediksi kemungkinan mahasiswa lulus tepat waktu dengan analisis SHAP
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'individual', label: 'Prediksi Individu', icon: Activity },
          { id: 'batch', label: 'Upload Batch', icon: Upload },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Individual Prediction */}
      {activeTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Data Mahasiswa</h3>
            <p className="text-sm text-slate-500 mb-6">
              Masukkan data akademik untuk memprediksi kelulusan
            </p>

            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* NIM */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    NIM Mahasiswa
                  </label>
                  <input
                    type="text"
                    name="nim"
                    value={formData.nim}
                    onChange={handleInputChange}
                    placeholder="Contoh: 1301201234"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Nama Mahasiswa (Opsional)
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Gender & Major */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Jenis Kelamin
                  </label>
                  <div className="relative">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Semester
                  </label>
                  <input
                    type="number"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    min="1"
                    max="14"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>



              {/* GPA */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  IPK Kumulatif
                </label>
                <input
                  type="number"
                  name="gpa"
                  value={formData.gpa}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="Contoh: 3.45"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Credits */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Total SKS Selesai
                </label>
                <input
                  type="number"
                  name="credits_completed"
                  value={formData.credits_completed}
                  onChange={handleInputChange}
                  min="0"
                  max="160"
                  placeholder="Contoh: 120"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Attendance */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Tingkat Kehadiran (%)
                </label>
                <input
                  type="number"
                  name="attendance_rate"
                  value={formData.attendance_rate}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Contoh: 85.5"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>



              {/* Financial */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Status Keuangan
                </label>
                <div className="relative">
                  <select
                    name="financial_status"
                    value={formData.financial_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Mandiri">Mandiri</option>
                    <option value="Beasiswa">Beasiswa</option>
                    <option value="KIP-K">KIP-K</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    Prediksi Sekarang
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3 space-y-5">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 rounded-xl border border-red-200 text-red-800 text-sm">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Error Prediksi</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {!predictionResult && !isLoading && !error && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="p-4 bg-blue-50 rounded-2xl mb-5">
                  <Activity className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Belum Ada Hasil Prediksi
                </h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Isi data mahasiswa di sebelah kiri dan klik "Prediksi Sekarang" untuk melihat hasil analisis
                </p>
              </div>
            )}

            {isLoading && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="relative">
                  <div className="h-16 w-16 border-4 border-blue-100 rounded-full" />
                  <div className="absolute inset-0 h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-2">
                  Menganalisis Data...
                </h3>
                <p className="text-sm text-slate-500">
                  Model machine learning sedang memproses prediksi
                </p>
              </div>
            )}

            {predictionResult && !isLoading && (
              <>
                {/* Prediction Card */}
                {(() => {
                  const risk = getRiskLevel(predictionResult.probability_on_time);
                  const RiskIcon = risk.icon;
                  const prob = (predictionResult.probability_on_time * 100).toFixed(1);
                  return (
                    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                      risk.color === 'emerald' ? 'border-emerald-200' :
                      risk.color === 'amber' ? 'border-amber-200' : 'border-red-200'
                    }`}>
                      {/* Top color bar */}
                      <div className={`h-1.5 ${
                        risk.color === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                        risk.color === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`} />
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">
                              Hasil Prediksi {predictionResult.nim && <span className="text-slate-700 font-semibold">— NIM: {predictionResult.nim}{predictionResult.name ? ` (${predictionResult.name})` : ''}</span>}
                            </p>
                            <h2 className="text-2xl font-bold text-slate-800">
                              {predictionResult.prediction === 1 ? 'Lulus Tepat Waktu' : 'Berisiko Terlambat'}
                            </h2>
                          </div>
                          <div className={`p-3 rounded-xl ${
                            risk.color === 'emerald' ? 'bg-emerald-50' :
                            risk.color === 'amber' ? 'bg-amber-50' : 'bg-red-50'
                          }`}>
                            <RiskIcon className={`h-7 w-7 ${
                              risk.color === 'emerald' ? 'text-emerald-500' :
                              risk.color === 'amber' ? 'text-amber-500' : 'text-red-500'
                            }`} />
                          </div>
                        </div>

                        {/* Probability gauge */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">Probabilitas Tepat Waktu</span>
                            <span className={`text-2xl font-bold ${
                              risk.color === 'emerald' ? 'text-emerald-600' :
                              risk.color === 'amber' ? 'text-amber-600' : 'text-red-600'
                            }`}>{prob}%</span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                risk.color === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                risk.color === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                'bg-gradient-to-r from-red-400 to-red-500'
                              }`}
                              style={{ width: `${prob}%` }}
                            />
                          </div>
                        </div>

                        {/* Risk badge */}
                        <div className="mt-4 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            risk.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10' :
                            risk.color === 'amber' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10' :
                            'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                          }`}>
                            <RiskIcon className="h-3.5 w-3.5" />
                            {risk.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* SHAP Explanation */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-800">Analisis Faktor Risiko</h3>
                    <div className="group relative">
                      <Info className="h-4 w-4 text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        SHAP (SHapley Additive exPlanations) menjelaskan kontribusi setiap fitur terhadap prediksi model ML
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-5">
                    Kontribusi masing-masing faktor terhadap hasil prediksi (SHAP Values)
                  </p>

                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={predictionResult.risk_factors.map((f) => ({
                        name: f.feature,
                        value: parseFloat(f.impact.toFixed(3)),
                      }))}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 100, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={95}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '13px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                        }}
                        formatter={(value) => [value.toFixed(4), 'SHAP Value']}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                        {predictionResult.risk_factors.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.impact >= 0 ? '#10b981' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      Meningkatkan peluang lulus tepat waktu
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      Menurunkan peluang lulus tepat waktu
                    </span>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Rekomendasi</h3>
                  <div className="space-y-3">
                    {predictionResult.probability_on_time < 0.75 && (
                      <>
                        <div className="flex gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Tingkatkan Kehadiran</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                              Tingkat kehadiran yang rendah berkorelasi kuat dengan keterlambatan kelulusan.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Konsultasi Dosen Wali</p>
                            <p className="text-xs text-blue-600 mt-0.5">
                              Disarankan untuk melakukan bimbingan akademik rutin dengan dosen wali.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {predictionResult.probability_on_time < 0.5 && (
                      <div className="flex gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Perhatian Khusus Diperlukan</p>
                          <p className="text-xs text-red-600 mt-0.5">
                            Mahasiswa berisiko tinggi. Perlu monitoring intensif dan intervensi akademik.
                          </p>
                        </div>
                      </div>
                    )}
                    {predictionResult.probability_on_time >= 0.75 && (
                      <div className="flex gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-emerald-800">Performa Baik</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            Mahasiswa menunjukkan tren positif untuk lulus tepat waktu. Pertahankan performa!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Batch Upload Tab */}
      {activeTab === 'batch' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 animate-fadeIn">
          {!batchResults ? (
            <div className="max-w-lg mx-auto text-center">
              <div className="p-5 bg-blue-50 rounded-2xl inline-block mb-5">
                <Upload className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Upload Data Batch</h3>
              <p className="text-sm text-slate-500 mb-8">
                Upload file CSV atau Excel berisi data mahasiswa untuk prediksi batch sekaligus
              </p>

              {batchError && (
                <div className="flex gap-3 p-4 bg-red-50 rounded-xl border border-red-200 text-red-800 text-sm mb-6 text-left">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Error Upload</p>
                    <p className="text-xs text-red-600 mt-1">{batchError}</p>
                  </div>
                </div>
              )}

              <label className="block border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:border-blue-400 hover:bg-slate-50/50 transition-all cursor-pointer group relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  disabled={isBatchLoading}
                />
                <div className="space-y-3">
                  <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto group-hover:bg-blue-50 transition-colors">
                    <Upload className="h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  {batchFile ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{batchFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(batchFile.size / 1024).toFixed(1)} KB — Siap untuk diprediksi
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-600">
                        <span className="text-blue-600 font-medium">Klik untuk upload</span> atau drag & drop
                      </p>
                      <p className="text-xs text-slate-400 mt-1">CSV, XLSX (Maks. 10MB)</p>
                    </div>
                  )}
                </div>
              </label>

              {batchFile && !isBatchLoading && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleResetBatch}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBatchUpload}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
                  >
                    Mulai Prediksi Batch
                  </button>
                </div>
              )}

              {isBatchLoading && (
                <div className="mt-8 flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="h-12 w-12 border-4 border-blue-100 rounded-full" />
                    <div className="absolute inset-0 h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mt-4">Memproses Prediksi Batch...</p>
                  <p className="text-xs text-slate-400 mt-1">Model sedang menganalisis file data</p>
                </div>
              )}

              <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-500" />
                  Format Kolom yang Dibutuhkan dalam File:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['nim', 'name', 'gender', 'semester', 'gpa', 'credits_completed', 'attendance_rate', 'financial_status'].map((col) => (
                    <span
                      key={col}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600 shadow-sm"
                    >
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                  * Pastikan header kolom persis sama seperti di atas. Nilai gender adalah 'L'/'P', status keuangan 'Mandiri'/'Beasiswa'/'KIP-K', dan kehadiran dalam persen (0-100).
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 font-sans">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Hasil Prediksi Batch</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    File: <span className="font-semibold text-slate-700">{batchFile?.name}</span>
                  </p>
                </div>
                <button
                  onClick={handleResetBatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-all border border-slate-200"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload File Baru
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <p className="text-xs font-medium text-slate-500">Total Mahasiswa</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{batchResults.total}</p>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <p className="text-xs font-medium text-emerald-800">Tepat Waktu</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {batchResults.results.filter((r) => r.prediction === 1).length}
                  </p>
                </div>
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
                  <p className="text-xs font-medium text-red-800">Berisiko Terlambat</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {batchResults.results.filter((r) => r.prediction === 0).length}
                  </p>
                </div>
              </div>

              {/* Table list */}
              <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150">
                      <th className="px-4 py-3 w-8"></th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-xs">NIM</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-xs">Nama</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-xs">Probabilitas Tepat Waktu</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-xs">Prediksi Kelulusan</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-xs">Tingkat Risiko</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchResults.results.map((result, idx) => {
                      if (result.error) {
                        return (
                          <tr key={idx} className="hover:bg-slate-50/30">
                            <td className="px-4 py-3.5"></td>
                            <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{result.nim || '-'}</td>
                            <td className="px-4 py-3.5 text-xs text-slate-700">{result.name || '-'}</td>
                            <td colSpan={3} className="px-4 py-3.5 text-xs text-red-500 italic">
                              Error: {result.error}
                            </td>
                          </tr>
                        );
                      }
                      const risk = getRiskLevel(result.probability_on_time);
                      const RiskIcon = risk.icon;
                      const isExpanded = expandedRow === idx;
                      const shapData = result.risk_factors
                        ? result.risk_factors.map((f) => ({
                            name: mapFeatureName(f.feature),
                            value: parseFloat(f.impact.toFixed(3)),
                            direction: f.impact >= 0 ? 'positive' : 'negative',
                          }))
                        : [];

                      return (
                        <>
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/30 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                            onClick={() => setExpandedRow(isExpanded ? null : idx)}
                          >
                            <td className="px-4 py-3.5">
                              <ChevronDown
                                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-slate-800 font-semibold">{result.nim}</td>
                            <td className="px-4 py-3.5 text-xs text-slate-700">{result.name || '-'}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700">
                                  {(result.probability_on_time * 100).toFixed(1)}%
                                </span>
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      risk.color === 'emerald' ? 'bg-emerald-500' :
                                      risk.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${result.probability_on_time * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                result.prediction === 1
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                                  : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                              }`}>
                                {result.prediction === 1 ? 'Lulus Tepat Waktu' : 'Berisiko Terlambat'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                risk.color === 'emerald' ? 'text-emerald-600' :
                                risk.color === 'amber' ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                <RiskIcon className="h-3.5 w-3.5" />
                                {risk.text}
                              </span>
                            </td>
                          </tr>

                          {/* Expandable SHAP Detail Row */}
                          {isExpanded && shapData.length > 0 && (
                            <tr key={`${idx}-shap`} className="bg-slate-50/80">
                              <td colSpan={5} className="px-6 py-5">
                                <div className="max-w-2xl">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-slate-700">Analisis Faktor Risiko (SHAP)</h4>
                                    <div className="group relative">
                                      <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        SHAP menjelaskan kontribusi setiap fitur terhadap prediksi model
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-4">
                                    Faktor-faktor yang mempengaruhi prediksi untuk NIM: <span className="font-semibold">{result.nim}</span>
                                  </p>

                                  <ResponsiveContainer width="100%" height={180}>
                                    <BarChart
                                      data={shapData}
                                      layout="vertical"
                                      margin={{ top: 0, right: 20, left: 100, bottom: 0 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                      <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={95}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: '1px solid #e2e8f0',
                                          borderRadius: '10px',
                                          fontSize: '12px',
                                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                                        }}
                                        formatter={(value) => [value.toFixed(4), 'SHAP Value']}
                                      />
                                      <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={20}>
                                        {shapData.map((entry, i) => (
                                          <Cell
                                            key={`cell-${i}`}
                                            fill={entry.value >= 0 ? '#10b981' : '#ef4444'}
                                          />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>

                                  <div className="flex items-center justify-center gap-5 mt-2 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                                      Meningkatkan peluang lulus tepat waktu
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <TrendingDown className="h-3 w-3 text-red-500" />
                                      Menurunkan peluang lulus tepat waktu
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

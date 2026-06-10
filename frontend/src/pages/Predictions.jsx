import { useState } from 'react';
import axios from 'axios';
import {
  Activity, Upload, Search, ChevronDown, AlertCircle,
  CheckCircle2, XCircle, TrendingUp, TrendingDown, Info
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
    semester: 6,
    gpa: '',
    credits_completed: '',
    attendance_rate: '',
    extracurricular_score: '',
    gender: 'L',
    major: 'Teknik Informatika',
    financial_status: 'Mandiri',
  });

  const featureMapping = {
    gpa: 'IPK (GPA)',
    credits_completed: 'SKS Selesai',
    attendance_rate: 'Kehadiran',
    extracurricular_score: 'Ekskul Score',
    semester: 'Semester',
    gender: 'Jenis Kelamin',
    major: 'Program Studi',
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
      semester: parseInt(formData.semester) || 6,
      gpa: parseFloat(formData.gpa),
      credits_completed: parseInt(formData.credits_completed),
      attendance_rate: parseFloat(formData.attendance_rate),
      extracurricular_score: parseInt(formData.extracurricular_score) || 60,
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

              {/* Major */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Program Studi
                </label>
                <div className="relative">
                  <select
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Teknik Informatika">Teknik Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                    <option value="Teknik Komputer">Teknik Komputer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
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

              {/* Extracurricular */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Skor Ekstrakurikuler (0-100)
                </label>
                <input
                  type="number"
                  name="extracurricular_score"
                  value={formData.extracurricular_score}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  placeholder="Contoh: 70"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
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
                            <p className="text-sm font-medium text-slate-500 mb-1">Hasil Prediksi</p>
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="p-5 bg-blue-50 rounded-2xl inline-block mb-5">
              <Upload className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Upload Data Batch</h3>
            <p className="text-sm text-slate-500 mb-8">
              Upload file CSV atau Excel berisi data mahasiswa untuk prediksi batch
            </p>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:border-blue-400 transition-colors cursor-pointer group">
              <Upload className="h-8 w-8 text-slate-300 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
              <p className="text-sm text-slate-500 mb-1">
                <span className="text-blue-600 font-medium">Klik untuk upload</span> atau drag & drop
              </p>
              <p className="text-xs text-slate-400">CSV, XLSX (Maks. 10MB)</p>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl text-left">
              <p className="text-xs font-semibold text-slate-600 mb-2">Format Kolom yang Dibutuhkan:</p>
              <div className="flex flex-wrap gap-2">
                {['nim', 'gender', 'major', 'semester', 'gpa', 'credits_completed', 'attendance_rate', 'extracurricular_score', 'financial_status'].map((col) => (
                  <span
                    key={col}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

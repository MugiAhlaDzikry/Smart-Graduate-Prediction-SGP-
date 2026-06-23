import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, AlertTriangle, GraduationCap,
  ArrowUpRight, ArrowDownRight, BarChart3, Loader2, DatabaseZap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../lib/api';

function StatCard({ icon: Icon, title, value, subtitle, color, delay }) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-500/20' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-500/20' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-500/20' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-500/20' },
  };

  const c = colors[color];

  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          <Icon className={`h-6 w-6 ${c.icon}`} />
        </div>
      </div>
      {subtitle && (
        <p className="mt-3 text-sm text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/dashboard/stats');
      setData(res.data);
    } catch (err) {
      setError('Gagal memuat data dashboard. Pastikan backend berjalan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-200 max-w-md">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!data?.has_data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Ringkasan data akademik dan prediksi kelulusan</p>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200 max-w-md">
            <DatabaseZap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Dataset</h3>
            <p className="text-slate-500 text-sm">
              Upload dataset mahasiswa terlebih dahulu melalui menu <strong>Data Mahasiswa</strong>, 
              lalu lakukan <strong>Training Model</strong> untuk melihat statistik.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { stats, gpa_distribution, risk_distribution, recent_students } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Ringkasan data akademik dan prediksi kelulusan</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          title="Total Mahasiswa"
          value={stats.total_students.toLocaleString('id-ID')}
          subtitle="Dari dataset yang di-upload"
          color="blue"
          delay={100}
        />
        <StatCard
          icon={GraduationCap}
          title="Prediksi Tepat Waktu"
          value={`${stats.on_time_percentage}%`}
          subtitle="Berdasarkan data aktual"
          color="green"
          delay={200}
        />
        <StatCard
          icon={AlertTriangle}
          title="Risiko Tinggi"
          value={stats.high_risk_count.toLocaleString('id-ID')}
          subtitle="IPK < 2.75"
          color="amber"
          delay={300}
        />
        <StatCard
          icon={TrendingUp}
          title="Akurasi Model"
          value={stats.model_accuracy > 0 ? `${stats.model_accuracy}%` : 'Belum Training'}
          subtitle={stats.model_accuracy > 0 ? "Hasil training terakhir" : "Lakukan training terlebih dahulu"}
          color="purple"
          delay={400}
        />
      </div>



      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GPA Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Distribusi IPK</h3>
              <p className="text-sm text-slate-500">Jumlah mahasiswa per rentang IPK</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={gpa_distribution || []} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '13px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                }}
              />
              <Bar dataKey="jumlah" radius={[8, 8, 0, 0]}>
                {(gpa_distribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Pie */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Distribusi Risiko</h3>
              <p className="text-sm text-slate-500">Mahasiswa berdasarkan tingkat risiko</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={risk_distribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                innerRadius={50}
                dataKey="value"
                strokeWidth={3}
                stroke="#fff"
              >
                {(risk_distribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {(risk_distribution || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </span>
                <span className="font-semibold text-slate-700">{item.value.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Data Mahasiswa Terbaru</h3>
          <p className="text-sm text-slate-500 mt-1">10 data mahasiswa terakhir dari dataset</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">NIM</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Nama</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Program Studi</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">IPK</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">SKS</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Kehadiran</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recent_students || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{item.nim || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-800 font-medium">{item.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{item.major || '-'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{item.gpa?.toFixed(2) || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.credits_completed || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.attendance_rate?.toFixed(1)}%</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        item.is_on_time === 1
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                          : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                      }`}
                    >
                      {item.is_on_time === 1 ? 'Tepat Waktu' : 'Terlambat'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

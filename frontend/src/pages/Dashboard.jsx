import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, AlertTriangle, GraduationCap,
  ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  Legend
} from 'recharts';

// Mock data for charts
const graduationTrendData = [
  { tahun: '2021', tepat_waktu: 72, terlambat: 28 },
  { tahun: '2022', tepat_waktu: 76, terlambat: 24 },
  { tahun: '2023', tepat_waktu: 78, terlambat: 22 },
  { tahun: '2024', tepat_waktu: 82, terlambat: 18 },
  { tahun: '2025', tepat_waktu: 85, terlambat: 15 },
];

const gpaDistributionData = [
  { range: '2.0-2.5', jumlah: 45, fill: '#ef4444' },
  { range: '2.5-3.0', jumlah: 120, fill: '#f59e0b' },
  { range: '3.0-3.5', jumlah: 280, fill: '#3b82f6' },
  { range: '3.5-4.0', jumlah: 155, fill: '#10b981' },
];

const riskDistribution = [
  { name: 'Risiko Rendah', value: 620, color: '#10b981' },
  { name: 'Risiko Sedang', value: 245, color: '#f59e0b' },
  { name: 'Risiko Tinggi', value: 135, color: '#ef4444' },
];

const monthlyPredictions = [
  { bulan: 'Jan', total: 45 },
  { bulan: 'Feb', total: 52 },
  { bulan: 'Mar', total: 78 },
  { bulan: 'Apr', total: 65 },
  { bulan: 'Mei', total: 90 },
  { bulan: 'Jun', total: 110 },
];

const recentPredictions = [
  { nim: '130120001', nama: 'Ahmad Fauzi', ipk: 3.65, status: 'Tepat Waktu', prob: 0.92, risk: 'low' },
  { nim: '130121023', nama: 'Siti Nurhaliza', ipk: 3.12, status: 'Tepat Waktu', prob: 0.78, risk: 'medium' },
  { nim: '130120045', nama: 'Budi Santoso', ipk: 2.45, status: 'Terlambat', prob: 0.35, risk: 'high' },
  { nim: '130122012', nama: 'Dewi Lestari', ipk: 3.88, status: 'Tepat Waktu', prob: 0.96, risk: 'low' },
  { nim: '130121056', nama: 'Reza Pratama', ipk: 2.78, status: 'Terlambat', prob: 0.42, risk: 'high' },
];

function StatCard({ icon: Icon, title, value, change, changeType, color, delay }) {
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
      <div className="mt-4 flex items-center gap-1 text-sm">
        {changeType === 'up' ? (
          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        )}
        <span className={changeType === 'up' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
          {change}
        </span>
        <span className="text-slate-400 ml-1">dari semester lalu</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Ringkasan data akademik dan prediksi kelulusan</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={Users} title="Total Mahasiswa" value="1,000" change="12%" changeType="up" color="blue" delay={100} />
        <StatCard icon={GraduationCap} title="Prediksi Tepat Waktu" value="85%" change="3.2%" changeType="up" color="green" delay={200} />
        <StatCard icon={AlertTriangle} title="Risiko Tinggi" value="135" change="8%" changeType="down" color="amber" delay={300} />
        <StatCard icon={TrendingUp} title="Akurasi Model" value="94.2%" change="1.5%" changeType="up" color="purple" delay={400} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graduation Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Tren Kelulusan</h3>
              <p className="text-sm text-slate-500">Persentase kelulusan tepat waktu vs terlambat</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                Tepat Waktu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                Terlambat
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={graduationTrendData}>
              <defs>
                <linearGradient id="colorTepat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTerlambat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="tahun" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
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
              <Area type="monotone" dataKey="tepat_waktu" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorTepat)" />
              <Area type="monotone" dataKey="terlambat" stroke="#ef4444" strokeWidth={2.5} fill="url(#colorTerlambat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Pie */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Distribusi Risiko</h3>
          <p className="text-sm text-slate-500 mb-4">Mahasiswa berdasarkan tingkat risiko</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                innerRadius={40}
                dataKey="value"
                strokeWidth={3}
                stroke="#fff"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {riskDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </span>
                <span className="font-semibold text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
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
            <BarChart data={gpaDistributionData} barSize={50}>
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
                {gpaDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Predictions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Prediksi Bulanan</h3>
              <p className="text-sm text-slate-500">Jumlah prediksi yang dilakukan per bulan</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyPredictions}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
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
              <Line
                type="monotone"
                dataKey="total"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Prediksi Terbaru</h3>
          <p className="text-sm text-slate-500 mt-1">Hasil prediksi kelulusan mahasiswa terakhir</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">NIM</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Nama</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">IPK</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Prediksi</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Probabilitas</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPredictions.map((item) => (
                <tr key={item.nim} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{item.nim}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.nama}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.ipk.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        item.status === 'Tepat Waktu'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                          : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[100px]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.prob >= 0.7 ? 'bg-emerald-500' : item.prob >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.prob * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{(item.prob * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${
                        item.risk === 'low' ? 'bg-emerald-500' : item.risk === 'medium' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                      }`}
                    />
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse" />
        
        {/* Floating shapes */}
        <div className="absolute top-20 right-20 w-16 h-16 border-2 border-white/20 rounded-2xl rotate-12 animate-[spin_12s_linear_infinite]" />
        <div className="absolute bottom-32 left-20 w-12 h-12 border-2 border-white/15 rounded-full animate-bounce" />
        <div className="absolute top-40 left-32 w-8 h-8 bg-white/10 rounded-lg rotate-45" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="mb-8 p-5 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl">
            <GraduationCap className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 text-center leading-tight">
            Smart Graduate<br />Predictor
          </h1>
          <p className="text-blue-100 text-center text-lg max-w-sm leading-relaxed">
            Prediksi kelulusan mahasiswa tepat waktu dengan kekuatan Machine Learning & Explainable AI
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-sm">
            {[
              { value: '95%', label: 'Akurasi Model' },
              { value: '1000+', label: 'Data Mahasiswa' },
              { value: 'SHAP', label: 'Explainable AI' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-blue-200 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Selamat Datang</h2>
            <p className="text-slate-500 mt-2">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kampus.ac.id"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-slate-600">Ingat saya</span>
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Lupa password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Role info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-600 font-medium mb-2">Demo Akun:</p>
            <div className="space-y-1 text-xs text-blue-500">
              <p>Admin: admin@kampus.ac.id</p>
              <p>Dosen: dosen@kampus.ac.id</p>
              <p>Mahasiswa: mhs@kampus.ac.id</p>
              <p className="text-blue-400">Password: apapun (demo mode)</p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            © 2026 Smart Graduate Predictor • v1.0
          </p>
        </div>
      </div>
    </div>
  );
}

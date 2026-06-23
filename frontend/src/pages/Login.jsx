import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff, UserPlus, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await authAPI.login(email, password);
      const data = res.data;

      // Save token & user info
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token || '');
      localStorage.setItem('user', JSON.stringify({
        user_id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      }));

      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login gagal. Periksa email dan password Anda.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.register(email, password, fullName);
      setSuccess('Registrasi berhasil! Silakan login dengan akun baru Anda.');
      setIsRegisterMode(false);
      setPassword('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registrasi gagal. Coba lagi.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
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

      {/* Right - Login/Register Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">
              {isRegisterMode ? 'Buat Akun Baru' : 'Selamat Datang'}
            </h2>
            <p className="text-slate-500 mt-2">
              {isRegisterMode
                ? 'Daftar untuk mulai menggunakan SGP'
                : 'Masuk ke akun Anda untuk melanjutkan'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-5">
            {/* Full Name (Register only) */}
            {isRegisterMode && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Ahmad Fauzi, M.Kom"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

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
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {isRegisterMode && (
                <p className="text-xs text-slate-400 mt-1">Minimal 6 karakter</p>
              )}
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
                  {isRegisterMode ? (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Daftar
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Masuk
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {isRegisterMode ? 'Sudah punya akun?' : 'Belum punya akun?'}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setSuccess('');
                }}
                className="ml-1 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                {isRegisterMode ? 'Masuk' : 'Daftar Sekarang'}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            © 2026 Smart Graduate Predictor • v1.0
          </p>
        </div>
      </div>
    </div>
  );
}

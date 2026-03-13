import React, { useState } from 'react';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  mode: AuthMode;
  onToggleMode: () => void;
  onBack: () => void;
}

const PasswordStrength = ({ password }: { password: string }) => {
  const checks = [
    { label: 'Min. 8 karakter', valid: password.length >= 8 },
    { label: 'Huruf besar', valid: /[A-Z]/.test(password) },
    { label: 'Angka', valid: /[0-9]/.test(password) },
  ];

  const strength = checks.filter((c) => c.valid).length;
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Lemah', 'Sedang', 'Kuat'];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < strength ? colors[strength - 1] : 'bg-white/10'}`}
          />
        ))}
      </div>
      <div className="flex gap-4">
        {checks.map(({ label, valid }) => (
          <span key={label} className={`text-xs flex items-center gap-1 ${valid ? 'text-green-400' : 'text-gray-500'}`}>
            <CheckCircle className={`w-3 h-3 ${valid ? 'opacity-100' : 'opacity-30'}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const AuthPage: React.FC<AuthPageProps> = ({ mode, onToggleMode, onBack }) => {
  const { register, login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isRegister = mode === 'register';

  const getFirebaseError = (code: string) => {
    const errors: Record<string, string> = {
      'auth/email-already-in-use': 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.',
      'auth/invalid-email': 'Format email tidak valid.',
      'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 6 karakter.',
      'auth/user-not-found': 'Email tidak ditemukan. Periksa kembali atau daftar terlebih dahulu.',
      'auth/wrong-password': 'Password salah. Coba lagi.',
      'auth/invalid-credential': 'Email atau password salah.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat.',
      'auth/network-request-failed': 'Koneksi gagal. Periksa koneksi internet kamu.',
    };
    return errors[code] || 'Terjadi kesalahan. Coba lagi.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister && !name.trim()) {
      setError('Nama wajib diisi.');
      return;
    }
    if (isRegister && password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name.trim());
        setSuccess('Akun berhasil dibuat! Mengalihkan...');
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(getFirebaseError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      {/* Back button */}
      <div className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="font-bold text-xl">Nexus Studio</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isRegister ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isRegister
                ? 'Daftar gratis dan mulai buat konten AI sekarang'
                : 'Masuk untuk lanjut berkreasi dengan Nexus Studio'}
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/10 bg-surface/50 backdrop-blur p-8 shadow-2xl">
            {/* Error / Success messages */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-6">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name field (register only) */}
              {isRegister && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama kamu"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegister ? 'Min. 8 karakter' : 'Password kamu'}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isRegister && <PasswordStrength password={password} />}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/25 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRegister ? 'Membuat akun...' : 'Masuk...'}
                  </>
                ) : (
                  isRegister ? '🚀 Buat Akun & Mulai Berkreasi' : '✨ Masuk ke Studio'
                )}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-gray-500">
              {isRegister ? (
                <>
                  Sudah punya akun?{' '}
                  <button onClick={onToggleMode} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Masuk sekarang
                  </button>
                </>
              ) : (
                <>
                  Belum punya akun?{' '}
                  <button onClick={onToggleMode} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Daftar gratis
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600">
            <span className="flex items-center gap-1">🔒 Data aman & terenkripsi</span>
            <span className="flex items-center gap-1">⚡ Akses instan</span>
            <span className="flex items-center gap-1">🆓 Gratis selamanya</span>
          </div>
        </div>
      </div>
    </div>
  );
};

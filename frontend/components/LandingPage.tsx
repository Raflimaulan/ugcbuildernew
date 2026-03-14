import React from 'react';
import {
  Zap, Video, Image as ImageIcon, Wand2, ArrowRight,
  Sparkles, Shield, Clock, Star,
  Film, Palette, Layers, Globe
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
  <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-primary/40 hover:bg-white/[0.06] transition-all duration-300">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

const StatCard = ({ value, label }: any) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-lg">Nexus Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={onRegister}
              className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/20"
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-700/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI Creative Studio Terdepan di Indonesia
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Buat Konten{' '}
            <span className="bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Visual AI
            </span>
            <br />
            Tanpa Batas
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate video sinematik dan gambar berkualitas tinggi menggunakan model AI terdepan — Veo untuk video, Nano untuk gambar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onRegister}
              className="group flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-lg transition-all shadow-xl shadow-primary/30 hover:shadow-primary/40"
            >
              Mulai Gratis Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-4 border border-white/15 hover:border-white/30 text-white rounded-xl font-semibold text-lg transition-all hover:bg-white/5"
            >
              Sudah Punya Akun
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Gratis 10 video/hari</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4" /> Gratis 20 gambar/hari</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Reset otomatis setiap hari</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value="10" label="Video gratis/hari" />
          <StatCard value="20" label="Gambar gratis/hari" />
          <StatCard value="4K" label="Resolusi Maksimal" />
          <StatCard value="100%" label="Didukung AI" />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Semua yang Kamu Butuhkan</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Platform lengkap untuk kreasi konten visual berbasis AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Video} title="Video AI dengan Veo" desc="Generate video sinematik dari teks, gambar, atau frame. Kualitas profesional langsung dari prompt." color="bg-purple-600/20" />
            <FeatureCard icon={ImageIcon} title="Gambar AI dengan Nano" desc="Buat ilustrasi, foto produk, poster, hingga karya konseptual dengan berbagai gaya visual." color="bg-blue-600/20" />
            <FeatureCard icon={Wand2} title="Prompt Generator" desc="Bantu kamu membangun prompt yang tepat dengan panduan visual dan kontrol penuh." color="bg-pink-600/20" />
            <FeatureCard icon={Layers} title="Start / End Frame" desc="Kontrol penuh transisi video dengan menentukan frame awal dan akhir yang kamu inginkan." color="bg-indigo-600/20" />
            <FeatureCard icon={Palette} title="Kontrol Visual Lengkap" desc="Atur aspect ratio, resolusi, durasi, gaya gerakan, dan kunci konsistensi visual." color="bg-emerald-600/20" />
            <FeatureCard icon={Globe} title="Akses dari Mana Saja" desc="Berbasis web, tidak perlu install apapun. Buka browser, langsung berkreasi." color="bg-amber-600/20" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-10 md:p-14">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-7 h-7 text-primary" fill="currentColor" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Mulai Berkreasi?</h2>
            <p className="text-gray-400 mb-8">Daftar gratis dan dapatkan akses ke 10 video + 20 gambar setiap hari. Tidak perlu kartu kredit.</p>
            <button
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-lg transition-all shadow-xl shadow-primary/30"
            >
              <Sparkles className="w-5 h-5" />
              Buat Akun Gratis
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-sm text-gray-600">
        <p>© 2026 Nexus Studio. Dibuat dengan ❤️ untuk kreator Indonesia.</p>
      </footer>
    </div>
  );
};

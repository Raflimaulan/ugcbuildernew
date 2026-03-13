import React, { useState } from 'react';
import {
  Zap, Video, Image as ImageIcon, Wand2, ArrowRight,
  Sparkles, Shield, Clock, Star, ChevronRight, Play,
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
        {/* Glow backgrounds */}
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

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Nexus Studio menggabungkan kekuatan <strong className="text-white">Google Veo</strong> untuk video dan{' '}
            <strong className="text-white">Nano Model</strong> untuk gambar — buat konten profesional 
            hanya dalam hitungan detik.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onRegister}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-base transition-all shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02]"
            >
              <Wand2 className="w-5 h-5" />
              Mulai Gratis Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-white/15 hover:border-white/30 text-gray-300 hover:text-white rounded-xl font-medium text-base transition-all"
            >
              Sudah punya akun? Masuk
            </button>
          </div>

          {/* Preview card */}
          <div className="relative mx-auto max-w-4xl rounded-2xl border border-white/10 bg-surface/80 backdrop-blur p-1 shadow-2xl">
            <div className="rounded-xl bg-background/90 p-6 flex gap-4 items-start">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-gray-600 font-mono">nexus-studio.app</span>
                </div>
                <div className="text-left space-y-2">
                  <div className="text-xs text-gray-600 font-mono">// Prompt</div>
                  <div className="text-sm text-gray-300 font-mono bg-white/5 rounded-lg p-3">
                    "A cinematic drone shot flying over Jakarta at golden hour, 
                    skyscrapers reflecting warm sunlight..."
                  </div>
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 h-28 rounded-lg bg-gradient-to-br from-orange-900/40 via-purple-900/40 to-blue-900/40 border border-white/5 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white/30" />
                    </div>
                    <div className="flex-1 h-28 rounded-lg bg-gradient-to-br from-pink-900/40 via-indigo-900/40 to-cyan-900/40 border border-white/5 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white/30" />
                    </div>
                    <div className="flex-1 h-28 rounded-lg bg-gradient-to-br from-green-900/40 via-blue-900/40 to-purple-900/40 border border-white/5 flex items-center justify-center">
                      <Film className="w-8 h-8 text-white/30" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value="10K+" label="Kreator Aktif" />
          <StatCard value="500K+" label="Konten Dibuat" />
          <StatCard value="< 30s" label="Waktu Generate" />
          <StatCard value="4K" label="Kualitas Tertinggi" />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Semua yang Kamu Butuhkan untuk
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Konten Kreatif
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Dari video sinematik hingga gambar produk profesional — Nexus Studio punya semua alat yang kamu butuhkan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={Video}
              title="Video AI dengan Veo"
              desc="Generate video sinematik berkualitas tinggi dari teks, gambar referensi, atau frame awal/akhir dengan Google Veo."
              color="bg-gradient-to-br from-purple-600 to-indigo-700"
            />
            <FeatureCard
              icon={ImageIcon}
              title="Gambar dengan Nano Model"
              desc="Buat gambar product photo, poster, ilustrasi, dan logo profesional menggunakan Nano model yang presisi."
              color="bg-gradient-to-br from-pink-600 to-rose-700"
            />
            <FeatureCard
              icon={Wand2}
              title="Prompt Generator AI"
              desc="Bantu kamu menyusun prompt yang kuat dan detail menggunakan AI assistant bawaan untuk hasil terbaik."
              color="bg-gradient-to-br from-emerald-600 to-teal-700"
            />
            <FeatureCard
              icon={Palette}
              title="Kontrol Style Lengkap"
              desc="Pilih lighting, motion style, aspect ratio, resolusi, dan style lock untuk konsistensi visual."
              color="bg-gradient-to-br from-orange-600 to-amber-700"
            />
            <FeatureCard
              icon={Layers}
              title="Reference-based Generation"
              desc="Upload hingga 3 gambar referensi untuk mengarahkan identity subjek, style, warna, dan komposisi."
              color="bg-gradient-to-br from-cyan-600 to-blue-700"
            />
            <FeatureCard
              icon={Globe}
              title="Job History Real-time"
              desc="Pantau semua job generation kamu secara real-time dengan update status otomatis setiap 8 detik."
              color="bg-gradient-to-br from-violet-600 to-purple-700"
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Cara Pakai yang Simpel</h2>
          <p className="text-gray-400 mb-12">3 langkah untuk mulai berkreasi</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

            {[
              { step: '01', title: 'Daftar Akun', desc: 'Buat akun gratis dalam 30 detik. Tidak butuh kartu kredit.' },
              { step: '02', title: 'Pilih Mode & Tulis Prompt', desc: 'Pilih Video atau Image mode, tulis prompt kreatif kamu dengan bantuan AI.' },
              { step: '03', title: 'Generate & Download', desc: 'Klik generate dan nikmati konten berkualitas tinggi dalam hitungan detik.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 text-primary font-bold text-lg">
                  {step}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-primary" fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Siap Mulai Berkreasi?
            </h2>
            <p className="text-gray-400 mb-8">
              Bergabung dengan ribuan kreator yang sudah menggunakan Nexus Studio untuk menghasilkan konten AI terbaik.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onRegister}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all shadow-xl shadow-primary/25"
              >
                <Wand2 className="w-4 h-4" />
                Daftar Sekarang — Gratis
              </button>
              <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 px-8 py-3.5 border border-white/15 hover:border-white/30 text-gray-300 rounded-xl font-medium transition-all"
              >
                Sudah Punya Akun
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-sm text-gray-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" fill="currentColor" />
          </div>
          <span className="font-semibold text-gray-400">Nexus Studio</span>
        </div>
        <p>© 2026 Nexus Studio. AI Creative Platform for Everyone.</p>
      </footer>
    </div>
  );
};

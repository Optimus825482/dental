"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Kullanıcı adı veya şifre hatalı");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* Left: Login Form */}
      <main className="flex-1 lg:flex-[0.65] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center shadow-lg shadow-primary-container/30 mb-4 border border-white/20">
              <img
                src="/dentalplogo.png"
                alt="DENT-ALP"
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 className="text-4xl font-black text-on-surface tracking-tight font-headline">
              DENT-ALP
            </h1>
            <p className="text-on-surface-variant font-medium mt-1">
              Klinik Yönetim Sistemi
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 shadow-2xl shadow-primary-container/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-error-container/50 border border-error/20 rounded-xl p-3 text-on-error-container text-sm font-medium text-center">
                  {error}
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-semibold text-on-surface-variant ml-1"
                >
                  Kullanıcı Adı
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                      person
                    </span>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Kullanıcı adınız"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-surface-container-low border-transparent border focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 rounded-xl text-on-surface transition-all placeholder-outline"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-on-surface-variant"
                  >
                    Şifre
                  </label>
                  <a
                    href="#"
                    className="text-xs font-bold text-primary hover:text-on-primary-container transition-colors"
                  >
                    Şifremi Unuttum
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                      lock
                    </span>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="block w-full pl-10 pr-12 py-3 bg-surface-container-low border-transparent border focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 rounded-xl text-on-surface transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center px-1">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-outline text-primary focus:ring-primary-container"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-on-surface-variant font-medium cursor-pointer"
                >
                  Beni Hatırla
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container hover:bg-primary-container/90 text-on-primary-fixed font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary-container/20 transition-all transform active:scale-[0.98] font-headline text-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                {!loading && (
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center">
            <div className="inline-flex items-center px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/50 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                Sunucu Durumu: Aktif
              </span>
            </div>
            <p className="text-xs font-medium text-outline">
              DentaOS v1.0.0 — Profesyonel Klinik Yönetim Çözümü
            </p>
            <div className="mt-8 text-center">
              <p className="text-[10px] text-outline opacity-60 uppercase tracking-widest leading-relaxed">
                CODE BY ERKAN EDEM
                <br />
                HENDEK DİŞ POLİKLİNİĞİ
              </p>
              <p className="text-[10px] text-outline opacity-60 uppercase tracking-widest mt-1">
                @COPYRIGHT 2026
              </p>
            </div>
          </footer>
        </div>
      </main>

      {/* Right: Decorative */}
      <aside className="hidden lg:flex lg:flex-[0.35] relative p-8">
        <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/80" />
          <div className="relative h-full flex flex-col justify-end p-12">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-4 w-fit">
              Yeni Nesil
            </span>
            <h3 className="font-headline text-4xl font-bold text-white mb-4 leading-tight">
              Dijital Dönüşüm
            </h3>
            <div className="w-12 h-1 bg-primary-container rounded-full mb-6" />
            <p className="text-white/90 text-lg font-medium leading-relaxed">
              Kliniğinizin tüm operasyonlarını tek bir merkezden yönetin,
              verimliliğinizi %40 artırın.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

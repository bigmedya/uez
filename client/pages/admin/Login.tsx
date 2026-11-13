import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Lock, User, AlertCircle, ShieldAlert, Clock } from "lucide-react";

const MAX_ATTEMPTS = 4;

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState("");

  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const isLocked = lockedUntil !== null && lockedUntil > Date.now();

  // Geri sayım zamanlayıcısı
  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const diff = lockedUntil - Date.now();
      if (diff <= 0) {
        setLockedUntil(null);
        setCountdown("");
        setError("");
        setRemainingAttempts(MAX_ATTEMPTS);
        return;
      }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setCountdown(`${min}:${sec.toString().padStart(2, "0")}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setError("");
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate("/uezyonetim");
    } else if (result.locked) {
      setLockedUntil(result.lockedUntil || Date.now() + (result.remainingMs || 15 * 60 * 1000));
      setRemainingAttempts(0);
      setError(result.error || "Hesap kilitlendi");
    } else {
      setRemainingAttempts(result.remainingAttempts ?? null);
      setError(result.error || "Kullanıcı adı veya şifre hatalı");
    }

    setIsLoading(false);
  }, [isLocked, username, password, login, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-dark via-purple-primary to-purple-dark flex items-center justify-center p-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/bc1aefcc49920778079094c811fbb255fd0b276e?width=200"
            alt="UEZ Logo"
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-purple-accent mt-2">Yönetim paneline giriş yapın</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Kilit uyarısı */}
          {isLocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-center">
              <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-semibold text-sm">Hesap Kilitlendi</p>
              <p className="text-red-600 text-xs mt-1">Çok fazla başarısız giriş denemesi</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-red-700">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg font-bold">{countdown}</span>
              </div>
              <p className="text-red-500 text-xs mt-1">sonra tekrar deneyebilirsiniz</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && !isLocked && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm block">{error}</span>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < remainingAttempts ? "bg-orange-400" : "bg-red-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta veya Kullanıcı Adı
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLocked}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                  placeholder="E-posta veya kullanıcı adı"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLocked}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                  placeholder="Şifrenizi girin"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full py-3 bg-purple-primary text-white font-semibold rounded-xl hover:bg-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Giriş yapılıyor...
                </>
              ) : isLocked ? (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  Kilitli
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Giriş Yap
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to site */}
        <div className="text-center mt-6">
          <a href="/" className="text-purple-accent hover:text-white transition-colors text-sm">
            ← Siteye Dön
          </a>
        </div>
      </div>
    </div>
  );
}







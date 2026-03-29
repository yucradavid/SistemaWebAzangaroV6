//src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, Lock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '../components/ui/Loading';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError('Credenciales incorrectas. Por favor, verifica tus datos.');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error inesperado en login', err);
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Background Image with async fade-in */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/fondo-colegio.jpeg"
          alt="Colegio CMAT"
          className="w-full h-full object-cover opacity-0 animate-fade-in duration-1000"
          onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      {/* Back Button - Top Left */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0E3A8A] to-[#1D4ED8] text-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium text-sm">Volver al inicio</span>
      </button>

      {/* Centered Content Wrapper */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in-up w-full max-w-[420px] px-4">

        {/* Header (Logo + Text) - Outside Card */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-r from-[#0E3A8A] to-[#1D4ED8] rounded-xl shadow-lg ring-4 ring-white/10 backdrop-blur-sm">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1.5 drop-shadow-lg tracking-tight">Bienvenido</h1>
          <p className="text-base text-blue-100/90 font-medium drop-shadow-md">Ingresa a tu portal académico</p>
        </div>

        {/* Form Card */}
        <div className="w-full relative">
          {/* Elegant Card with WHITE background */}
          <div className="relative bg-white px-8 py-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2 border-white">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0E3A8A] via-[#1D4ED8] to-[#0E3A8A] rounded-t-2xl"></div>

            {/* Shield Icon - Security Badge */}
            <div className="flex justify-center -mt-2 mb-4">
              <div className="bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] p-2.5 rounded-full shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg animate-shake shadow-sm">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#0E3A8A] mb-2.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:bg-white focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0E3A8A] mb-2.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:bg-white focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#0E3A8A] focus:ring-[#1D4ED8] focus:ring-offset-0 transition-all"
                  />
                  <span className="text-slate-700 group-hover:text-[#0E3A8A] transition-colors font-medium">Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[#1D4ED8] hover:text-[#0E3A8A] hover:underline transition-colors font-semibold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#0E3A8A] via-[#1D4ED8] to-[#0E3A8A] hover:from-[#0c2d6b] hover:via-[#1a44c2] hover:to-[#0c2d6b] text-white font-bold text-base rounded-xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loading size="sm" />
                  ) : (
                    <>
                      <span>Iniciar sesión</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </div>

              {/* Security Note */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Conexión segura y encriptada</span>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Help Text - Outside Card */}
        <div className="mt-5 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-white/90 font-medium leading-relaxed drop-shadow-md">
            ¿Necesitas ayuda para acceder?<br />
            <span className="opacity-80">Contacta a la secretaría:</span><br />
            <strong className="text-white text-base tracking-wide hover:scale-105 inline-block transition-transform cursor-pointer mt-1 bg-white/10 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
              +51 951 234 567
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

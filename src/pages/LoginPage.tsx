import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Save redirect path if coming from a deep link
      const from = (location.state as { from?: string })?.from;
      if (from) {
        window.localStorage.setItem('redirectAfterLogin', from);
      }
      await signInWithGoogle();
      const redirect = window.localStorage.getItem('redirectAfterLogin');
      window.localStorage.removeItem('redirectAfterLogin');
      navigate(redirect || '/home', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('popup-closed')) {
        // User closed the popup, don't show error
        return;
      }
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container bg-gradient-purple" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="diagonal-bars" />

      {/* Back button */}
      <div style={{ padding: '16px 20px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}
        >
          <ArrowLeft size={20} />
          Atrás
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <h1 className="animate-fade-in-up" style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>
          Inicia sesión
        </h1>
        <p className="animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: 40, lineHeight: 1.5 }}>
          Usa tu cuenta de Google para acceder a Network UDEM.
        </p>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          {error && (
            <p style={{ color: '#FF8C8C', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>
          )}

          <button
            className="btn btn-full btn-lg"
            onClick={handleGoogleLogin}
            disabled={loading}
            id="btn-google-login"
            style={{
              background: 'white',
              color: '#1A0E26',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              gap: 12,
            }}
          >
            {loading ? (
              <div className="spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
            Al continuar, aceptas compartir tu nombre y correo con Network UDEM para facilitar la conexión con empresas.
          </p>
        </div>
      </div>
    </div>
  );
}

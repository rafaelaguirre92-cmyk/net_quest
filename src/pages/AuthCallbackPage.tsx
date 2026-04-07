import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallbackPage() {
  const { completeSignIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const finishSignIn = async () => {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Por favor ingresa tu correo para confirmar:');
      }
      if (!email) {
        setError('No se proporcionó un correo.');
        return;
      }
      try {
        await completeSignIn(email);
        window.localStorage.removeItem('emailForSignIn');

        // Check for redirect path
        const redirect = window.localStorage.getItem('redirectAfterLogin');
        window.localStorage.removeItem('redirectAfterLogin');
        navigate(redirect || '/home', { replace: true });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      }
    };
    finishSignIn();
  }, []);

  if (error) {
    return (
      <div className="app-container bg-gradient-purple" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ color: '#FF8C8C', textAlign: 'center', marginBottom: 16 }}>{error}</p>
        <button className="btn btn-yellow" onClick={() => navigate('/login')}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="app-container bg-gradient-purple" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner spinner-white" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>Iniciando sesión...</p>
      </div>
    </div>
  );
}

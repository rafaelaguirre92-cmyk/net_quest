import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap } from 'lucide-react';

export default function SplashPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="app-container bg-gradient-purple" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Decorative elements */}
      <div className="diagonal-bars" />
      <div className="teal-blob" style={{ bottom: '-60px', right: '-40px' }} />

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="animate-scale-in">
          <img 
            src="/Network_clear_once.gif" 
            alt="Network UDEM" 
            style={{ width: 220, maxWidth: '100%', height: 'auto' }} 
          />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0, marginBottom: 60, display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/Recurso%201.png" 
            alt="Donde tu talento profesional conecta con grandes empresas" 
            style={{ width: '100%', height: 'auto' }} 
          />
        </div>

        {/* Event info removed */}

        {/* CTA Button */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <button
            className="btn btn-yellow btn-lg"
            onClick={handleStart}

            id="btn-start"
          >
            <Zap size={20} />
            Comenzar
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 24px', position: 'relative', zIndex: 1 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 500 }}>
          Vinculación Laboral · Universidad de Monterrey
        </p>
      </div>
    </div>
  );
}

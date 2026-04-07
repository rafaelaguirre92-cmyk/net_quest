import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function ScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Parse URL to extract employer_id
            try {
              const url = new URL(decodedText);
              const pathMatch = url.pathname.match(/\/connect\/(.+)/);
              if (pathMatch) {
                scanner.stop().catch(console.error);
                navigate(`/connect/${pathMatch[1]}`);
              }
            } catch {
              // Not a valid URL, try direct employer id
              if (decodedText.length > 8) {
                scanner.stop().catch(console.error);
                navigate(`/connect/${decodedText}`);
              }
            }
          },
          () => {} // ignore scan failures
        );
        if (mounted) setScanning(true);
      } catch (err) {
        if (mounted) {
          setError('No se pudo acceder a la cámara. Verifica los permisos.');
          console.error(err);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [navigate]);

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0A0A', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => navigate('/home')}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-full)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} color="white" />
        </button>
        <h1 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>Escanear QR</h1>
      </div>

      {/* Scanner viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        {error ? (
          <div style={{ textAlign: 'center' }}>
            <Camera size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
            <p style={{ color: '#FF8C8C', marginBottom: 16 }}>{error}</p>
            <button className="btn btn-yellow" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div
              id="qr-reader"
              style={{
                width: '100%',
                maxWidth: 320,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            />
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.85rem',
              textAlign: 'center',
              marginTop: 20,
            }}>
              {scanning
                ? 'Apunta la cámara al código QR del stand'
                : 'Iniciando cámara...'}
            </p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

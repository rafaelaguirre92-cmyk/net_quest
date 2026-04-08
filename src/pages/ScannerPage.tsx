import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, Loader2, PartyPopper, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';

export default function ScannerPage() {
  const navigate = useNavigate();
  const { user, student, refreshStudent } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    title: string;
    subtitle: string;
    type: 'company' | 'experience';
  } | null>(null);

  // Handle experience station scanning
  const handleExperience = async (expId: string, scanner: Html5Qrcode) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setProcessing(true);
      
      try {
        await scanner.stop();
      } catch (e) {
        console.warn('Scanner stop error:', e);
      }

      // Update student document with completed experience
      await updateDoc(doc(db, 'students', user.uid), {
        [`experienceHistory.${expId}`]: serverTimestamp(),
      });
      await refreshStudent();

      const expTitles: Record<string, string> = {
        foto: 'Foto Profesional',
        future: 'Future Wall',
        cv: 'Curriculum',
        networking: 'Networking'
      };

      setSuccessInfo({
        title: '¡Experiencia Completada!',
        subtitle: expTitles[expId] || 'Nueva estación',
        type: 'experience'
      });

      // 2 second confirm then HARD RELOAD navigation
      setTimeout(() => {
        window.location.assign('/experiences?new=1');
      }, 2000);

    } catch (err) {
      console.error('Experience error:', err);
      window.location.assign('/experiences');
    }
  };

  // Separate function to handle the connection logic
  const handleConnect = async (employerId: string, scanner: Html5Qrcode) => {
    if (!user) {
      alert('Debes iniciar sesión para conectar.');
      navigate('/login');
      return;
    }

    try {
      setProcessing(true);
      
      // Stop scanning before heavy Firebase work
      try {
        await scanner.stop();
      } catch (e) {
        console.warn('Scanner stop error:', e);
      }

      // Check if already connected
      const connQ = query(
        collection(db, 'connections'),
        where('studentId', '==', user.uid),
        where('employerId', '==', employerId)
      );
      const connSnap = await getDocs(connQ);
      
      let companyName = 'empresa';
      
      if (connSnap.empty) {
        // Fetch company name for the toast
        const empSnap = await getDoc(doc(db, 'empresas', employerId));
        if (empSnap.exists()) {
          companyName = empSnap.data()?.nombre || empSnap.data()?.companyName || 'empresa';
        }

        // Create new connection
        await addDoc(collection(db, 'connections'), {
          studentId: user.uid,
          employerId,
          scannedAt: serverTimestamp(),
          cvUrlSnapshot: student?.cvUrl || null,
          emailSent: false,
        });

        // Mark Networking experience
        await updateDoc(doc(db, 'students', user.uid), {
          'experienceHistory.networking': serverTimestamp(),
        });
        await refreshStudent();
      } else {
        // Fetch company name even if already connected
        const empSnap = await getDoc(doc(db, 'empresas', employerId));
        if (empSnap.exists()) {
          companyName = empSnap.data()?.nombre || empSnap.data()?.companyName || 'empresa';
        }
      }

      setSuccessInfo({
        title: connSnap.empty ? '¡Conexión Exitosa!' : 'Ya estás conectado',
        subtitle: companyName,
        type: 'company'
      });

      // 2 second confirm then HARD RELOAD navigation
      setTimeout(() => {
        window.location.assign('/contacts?new=1');
      }, 2000);

    } catch (err) {
      console.error('Connection error:', err);
      window.location.assign('/contacts');
    }
  };

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
            console.log('QR Decoded:', decodedText);
            const cleanText = decodedText.trim();

            // Try to match a full URL with /exp/ID
            const expMatch = cleanText.match(/\/exp\/([a-zA-Z0-9_-]+)/);
            if (expMatch) {
              const id = expMatch[1];
              handleExperience(id, scanner);
              return;
            }

            // Try to match a full URL with /connect/ID
            const connectMatch = cleanText.match(/\/connect\/([a-zA-Z0-9_-]+)/);
            if (connectMatch) {
              const id = connectMatch[1];
              handleConnect(id, scanner);
              return;
            }

            // If it's just an ID
            const idPattern = /^[a-zA-Z0-9_-]+$/;
            if (idPattern.test(cleanText)) {
              handleConnect(cleanText, scanner);
              return;
            }

            // If it's a URL but doesn't have /connect/, try to grab the last part if it looks like an ID
            try {
              const url = new URL(cleanText);
              const parts = url.pathname.split('/').filter(Boolean);
              const lastPart = parts[parts.length - 1];
              if (lastPart && idPattern.test(lastPart)) {
                handleConnect(lastPart, scanner);
                return;
              }
            } catch (e) {
              // Not a URL, and not a simple ID
            }

            alert('Código no reconocido. Asegúrate de escanear un QR de Network UDEM.');
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
    <div className="app-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#0A0A0A', position: 'relative', color: 'white' }}>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', paddingBottom: '20vh', position: 'relative' }}>
        
        {/* The scanner must remain in DOM to avoid crashes when stopping */}
        <div
          id="qr-reader"
          style={{
            width: '100%',
            maxWidth: 320,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.1)',
            visibility: (processing || error) ? 'hidden' : 'visible',
            height: (processing || error) ? 0 : 'auto',
          }}
        />

        {processing && (
          <div style={{ textAlign: 'center', position: 'absolute' }} className="animate-scale-in">
            <Loader2 size={48} color="white" className="animate-spin" style={{ marginBottom: 16 }} />
            <p style={{ color: 'white', fontWeight: 600 }}>Conectando...</p>
          </div>
        )}

        {error && !processing && (
          <div style={{ textAlign: 'center', position: 'absolute' }}>
            <Camera size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
            <p style={{ color: '#FF8C8C', marginBottom: 16 }}>{error}</p>
            <button className="btn btn-yellow" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        )}

        {!processing && !error && !successInfo && (
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
            textAlign: 'center',
            marginTop: 24,
          }}>
            {scanning ? (
              <>Apunta la cámara al código QR<br />del stand o de la empresa</>
            ) : (
              'Iniciando cámara...'
            )}
          </p>
        )}
      </div>

      {/* Success Overlay */}
      {successInfo && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            textAlign: 'center'
          }}
        >
          <div className="animate-scale-in" style={{
            width: 100,
            height: 100,
            background: 'var(--color-teal)',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            boxShadow: '0 0 40px rgba(0,201,177,0.4)',
          }}>
            {successInfo.type === 'experience' ? (
              <PartyPopper size={48} color="white" />
            ) : (
              <CheckCircle2 size={48} color="white" />
            )}
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, color: 'white' }}>
            {successInfo.title}
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>
            {successInfo.subtitle}
          </p>

          <div style={{
            width: 140,
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div 
              className="progress-bar-fill"
              style={{
                height: '100%',
                background: 'var(--color-yellow-primary)',
                width: '100%',
                animation: 'shrink linear 2s forwards'
              }}
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 12, fontWeight: 500 }}>
            Redirigiendo...
          </p>
          
          <style>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

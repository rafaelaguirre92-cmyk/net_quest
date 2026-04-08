import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { FileText, Upload, CheckCircle2, AlertCircle, Download, PartyPopper, Share2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import confetti from 'canvas-confetti';

const TOTAL_EXPERIENCES = 4;

export default function HomePage() {
  const { student, user, refreshStudent } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Self-healing for networking: Check if they have connections but no flag
  useEffect(() => {
    const checkNetworking = async () => {
      if (student && !student.experienceHistory?.networking) {
        const q = query(
          collection(db, 'connections'),
          where('studentId', '==', student.id),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, 'students', student.id), {
            'experienceHistory.networking': serverTimestamp()
          });
          await refreshStudent();
        }
      }
    };
    checkNetworking();
  }, [student, refreshStudent]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (file.type !== 'application/pdf') {
      alert('Solo se aceptan archivos PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede exceder 5 MB.');
      return;
    }
    setUploading(true);
    try {
      const storageRef = ref(storage, `cvs/${user.uid}/cv.pdf`);
      await uploadBytes(storageRef, file, { contentType: 'application/pdf' });
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'students', user.uid), {
        cvUrl: url,
        cvUploadedAt: serverTimestamp(),
      });
      await refreshStudent();
    } catch (err) {
      console.error('Error al subir el CV:', err);
      alert('Error al subir el CV. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const firstName = student?.fullName?.split(' ')[0] || 'Alumno';

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isTestMode = queryParams.get('test') === 'true' || queryParams.get('test') === '1';

  // Calculates real progress
  const expStatus = {
    foto: !!student?.experienceHistory?.foto,
    cv: !!student?.cvUrl,
    networking: !!student?.experienceHistory?.networking,
    future: !!student?.experienceHistory?.future,
  };
  
  const completedCount = isTestMode ? TOTAL_EXPERIENCES : Object.values(expStatus).filter(Boolean).length;
  const progressPercentage = (completedCount / TOTAL_EXPERIENCES) * 100;
  const isAllComplete = completedCount === TOTAL_EXPERIENCES || isTestMode;

  const handleCelebrate = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleShare = async () => {
    const shareText = "¡Misión cumplida! Completé todas las experiencias en Network UDEM 2026. 🚀🎓 #InspirandoElFuturo #NetworkUDEM";
    const shareUrl = window.location.origin;

    try {
      const response = await fetch('/champion.png');
      const blob = await response.blob();
      const file = new File([blob], 'champion.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Network UDEM Champion',
          text: shareText,
          url: shareUrl,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Network UDEM 2026',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('¡Logro copiado al portapapeles! Ya puedes pegarlo en tus redes.');
      }
    } catch (err) {
      console.error('Sharing failed:', err);
      if (navigator.share) {
        navigator.share({ title: 'Network UDEM 2026', text: shareText, url: shareUrl }).catch(() => {});
      }
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100dvh', background: 'var(--color-surface-dim)' }}>
      {/* Top Bar Header */}
      <div className="extend-bg" style={{ 
        background: 'var(--color-purple-deep)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'relative',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        {/* Logo left */}
        <img src="/Network_clear_once.gif" alt="Logo" style={{ height: '150px' }} />
        
        {/* Greeting right */}
        <div style={{ paddingRight: '34px', textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.2rem', margin: 0, marginBottom: -6, fontWeight: 500, textAlign: 'left' }}>Hola 👋</p>
            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1.1, textAlign: 'right' }}>{firstName}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px 0' }} className="pb-safe">
        
        {/* CV Status Card */}
        <div className="card animate-fade-in-up" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: student?.cvUrl ? 'rgba(0,201,177,0.1)' : 'rgba(255,140,66,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {student?.cvUrl ? (
                <CheckCircle2 size={24} color="var(--color-teal)" />
              ) : (
                <AlertCircle size={24} color="var(--color-orange)" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {student?.cvUrl ? 'CV subido' : 'CV pendiente'}
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                {student?.cvUrl
                  ? 'Listo para compartir con empresas'
                  : 'Sube tu CV para compartirlo'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {student?.cvUrl ? (
              <>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ flex: 1, border: '1px solid #E5E1EA' }}
                  onClick={() => window.open(student.cvUrl || undefined, '_blank')}
                >
                  <FileText size={16} />
                  Ver tu CV
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ flex: 1, border: '1px solid #E5E1EA' }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : (
                    <>
                      <Upload size={16} />
                      Actualizar
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                className="btn btn-sm btn-purple btn-full"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="spinner spinner-white" style={{ width: 18, height: 18 }} />
                ) : (
                  <>
                    <Upload size={16} />
                    Subir CV
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />

          {/* Template Download Button */}
          <button 
            className="btn btn-sm btn-ghost btn-full"
            style={{ marginTop: 8 }}
            onClick={() => window.open('https://drive.google.com/open?id=1_2qsjywuUaZeCrufP8j39zRx2lW5d_wE&usp=drive_fs', '_blank')}
          >
            <Download size={16} />
            Descargar plantillas
          </button>
        </div>

        {/* Progress Bar Card */}
        <div className="card animate-fade-in-up" style={{ marginBottom: 16, padding: '20px', animationDelay: '0.1s', opacity: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Avance de Experiencias</h2>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-purple-primary)' }}>
              {completedCount} de {TOTAL_EXPERIENCES}
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--color-surface-dim)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--color-teal), var(--color-teal-dark))', 
              width: `${progressPercentage}%`,
              transition: 'width 0.8s ease-out'
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '12px 0 0 0', textAlign: 'center' }}>
            {isAllComplete 
              ? '¡Felicidades! Has completado todas las experiencias 🏁' 
              : `Completa las ${TOTAL_EXPERIENCES} experiencias de la feria`}
          </p>

          {/* Celebration Actions */}
          {isAllComplete && (
            <div className="animate-scale-in" style={{ 
              display: 'flex', 
              gap: 12, 
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px dashed rgba(0,0,0,0.1)'
            }}>
              <button 
                onClick={handleCelebrate}
                className="btn btn-purple"
                style={{ flex: 1, gap: 8, boxShadow: '0 4px 12px rgba(123,45,142,0.2)' }}
              >
                <PartyPopper size={18} />
                Celebrar
              </button>
              <button 
                onClick={handleShare}
                className="btn btn-yellow"
                style={{ flex: 1, gap: 8, color: '#1A1A1A', boxShadow: '0 4px 12px rgba(255,191,0,0.15)' }}
              >
                <Share2 size={18} />
                Compartir
              </button>
            </div>
          )}
        </div>


        {/* Quick stats or info */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0, background: 'rgba(0,201,177,0.06)', borderColor: 'rgba(0,201,177,0.15)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            💡 <strong>Tip:</strong> Visita cada stand, escanea su QR y tu CV llegará directo al reclutador. Revisa tu historial en <strong>Mis Contactos</strong>.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { ScanLine, FileText, Upload, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const EXPERIENCES = [
  { id: '1', title: 'Foto Profesional', status: 'pending' },
  { id: '2', title: 'Curriculum', status: 'completed' },
  { id: '3', title: 'Networking', status: 'pending' },
  { id: '4', title: 'Future Wall', status: 'pending' },
];

export default function HomePage() {
  const { student, user, refreshStudent } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  // Calculates progress for the experiences
  const completedCount = EXPERIENCES.filter(e => e.status === 'completed').length;
  const progressPercentage = (completedCount / EXPERIENCES.length) * 100;

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--color-surface-dim)' }}>
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
            onClick={() => window.open('https://firebasestorage.googleapis.com', '_blank')}
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
              {completedCount} de {EXPERIENCES.length}
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
            Completa las {EXPERIENCES.length} experiencias de la feria
          </p>
        </div>

        {/* Scan QR CTA */}
        <button
          className="card animate-fade-in-up"
          style={{
            animationDelay: '0.1s', opacity: 0, width: '100%', border: 'none',
            background: 'linear-gradient(135deg, var(--color-purple-primary), var(--color-purple-dark))',
            padding: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
            textAlign: 'left', marginBottom: 16,
          }}
          onClick={() => navigate('/scan')}
          id="btn-scan-qr"
        >
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,255,255,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ScanLine size={28} color="var(--color-yellow)" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
              Escanear QR
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
              Escanea el código en cada stand para compartir tu CV
            </p>
          </div>
        </button>

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

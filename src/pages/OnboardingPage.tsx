import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

import { useEffect } from 'react';
import { Rocket, Sparkles, Upload, ArrowRight, ArrowLeft, FileText, SkipForward } from 'lucide-react';
import type { Activity } from '../types';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { user, student, refreshStudent } = useAuth();
  const [fullName, setFullName] = useState(user?.displayName || student?.fullName || '');
  const [matricula, setMatricula] = useState(student?.matricula || '');

  useEffect(() => {
    // Usar la información dura de las experiencias en lugar de buscar en base de datos temporalmente
    setActivities([
      { id: '1', name: 'Foto Profesional', description: 'Dirígete al set fotográfico y tómate la foto perfecta para LinkedIn.', iconUrl: '📷', sortOrder: 1 },
      { id: '2', name: 'Curriculum', description: 'Sube tu CV al sistema para compartirlo con los reclutadores.', iconUrl: '📄', sortOrder: 2 },
      { id: '3', name: 'Networking', description: 'Acércate a los stands de las empresas y comparte tu perfil.', iconUrl: '🤝', sortOrder: 3 },
      { id: '4', name: 'Future Wall', description: 'Un muro donde puedes plasmar cómo te verás inspirando el futuro.', iconUrl: '🚀', sortOrder: 4 },
    ]);
  }, []);

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
      finishOnboarding();
    } catch (err) {
      console.error('Error al subir el CV:', err);
      alert('Error al subir el CV. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !fullName.trim()) return;
    await updateDoc(doc(db, 'students', user.uid), {
      fullName: fullName.trim(),
      matricula: matricula.trim(),
    });
  };

  const finishOnboarding = async () => {
    if (!user) return;
    await saveProfile();
    await updateDoc(doc(db, 'students', user.uid), { onboardingDone: true });
    await refreshStudent();
    const redirect = window.localStorage.getItem('redirectAfterLogin');
    window.localStorage.removeItem('redirectAfterLogin');
    navigate(redirect || '/home', { replace: true });
  };

  const steps = [
    // Step 0: La misión
    <div key="step0" className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 'var(--radius-full)',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
      }}>
        <Rocket size={40} color="var(--color-yellow)" />
      </div>
      <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, marginBottom: 16, lineHeight: 1.3 }}>
        ¡Bienvenido a<br />
        <span style={{ color: 'var(--color-yellow)' }}>Network Quest!</span>
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 300 }}>
        Te ayudaremos a <strong>conectar con las empresas</strong> del evento. Solo escanea el QR de cada stand y conecta directamente con los reclutadores.
      </p>
    </div>,

    // Step 1: Datos personales
    <div key="step1" className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Sparkles size={28} color="var(--color-teal)" />
        </div>
        <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
          Cuéntanos de ti
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>
          Completa tu información para disfrutar al máximo de Network UDEM
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Nombre completo *</label>
          <input
            className="input"
            placeholder="Ej. María García López"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            id="input-fullname"
          />
        </div>
        <div>
          <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Matrícula</label>
          <input
            className="input"
            placeholder="Ej. 123456"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            id="input-matricula"
          />
        </div>
      </div>
    </div>,

    // Step 2: Las experiencias
    <div key="step2" className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
      <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
        Las experiencias del evento
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginBottom: 24 }}>
        Además de las empresas, aprovecha estas actividades:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
        {activities.length > 0 ? activities.map((activity, i) => (
          <div
            key={activity.id}
            className="animate-slide-in-right"
            style={{ animationDelay: `${i * 0.08}s`, opacity: 0, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-md)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>
              {activity.iconUrl || '⭐'}
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{activity.name}</p>
              {activity.description && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginTop: 2 }}>{activity.description}</p>
              )}
            </div>
          </div>
        )) : (
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              Las actividades se anunciarán pronto 🎉
            </p>
          </div>
        )}
      </div>
    </div>,

    // Step 3: Tu CV
    <div key="step3" className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 'var(--radius-full)',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
      }}>
        <FileText size={36} color="var(--color-teal)" />
      </div>
      <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
        Sube tu CV
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 32, maxWidth: 280 }}>
        Tu CV se enviará a las empresas cuando escanees su QR. Solo aceptamos <strong style={{ color: 'var(--color-yellow)' }}>PDF</strong> (máx 5 MB).
      </p>

      <label
        htmlFor="cv-upload"
        className="btn btn-yellow btn-lg"
        style={{ cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 16 }}
      >
        {uploading ? (
          <div className="spinner" style={{ width: 20, height: 20, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--color-text-on-yellow)' }} />
        ) : (
          <>
            <Upload size={20} />
            Seleccionar CV
          </>
        )}
      </label>
      <input
        type="file"
        id="cv-upload"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />

      <button
        className="btn btn-ghost"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        onClick={finishOnboarding}
        disabled={uploading}
      >
        <SkipForward size={16} />
        Lo subiré en otro momento
      </button>
    </div>,
  ];

  return (
    <div className="app-container bg-gradient-purple" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="diagonal-bars" />

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '20px 24px', position: 'relative', zIndex: 1 }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: step === i ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: step === i ? 'var(--color-yellow)' : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {steps[step]}
      </div>

      {/* Navigation */}
      {step < steps.length - 1 && (
        <div style={{ padding: '16px 24px 32px', display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
          {step > 0 && (
            <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={18} />
            </button>
          )}
          <button
            className="btn btn-yellow btn-full"
            onClick={() => {
              if (step === 1 && !fullName.trim()) {
                alert('Por favor ingresa tu nombre.');
                return;
              }
              setStep(s => s + 1);
            }}
          >
            Siguiente
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../contexts/AuthContext';
import { Camera, FileText, Users, Rocket, CheckCircle2, Circle, ChevronDown, PartyPopper, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const EXPERIENCES_DATA = [
  { 
    id: 'foto', 
    title: 'Foto Profesional', 
    icon: Camera, 
    description: 'Actualiza tu imagen profesional. Dirígete al set fotográfico y tómate la foto perfecta para tu perfil de LinkedIn o CV.'
  },
  { 
    id: 'cv', 
    title: 'Curriculum', 
    icon: FileText, 
    description: 'Sube tu CV al sistema para compartirlo con los reclutadores.'
  },
  { 
    id: 'networking', 
    title: 'Networking', 
    icon: Users, 
    description: 'Acércate a los stands de las mejores empresas, plática con los reclutadores y comparte tu perfil.'
  },
  { 
    id: 'future', 
    title: 'Future Wall', 
    icon: Rocket, 
    description: 'Deja tu marca en el Future Wall. Un espacio colaborativo donde puedes plasmar cómo te verás inspirando el futuro.'
  },
];

export default function ExperiencesPage() {
  const { student } = useAuth();
  const location = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (location.state?.newExperience) {
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Self-healing for networking
  useEffect(() => {
    const checkNetworking = async () => {
      if (student && !student.id) return; // Guard
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
        }
      }
    };
    checkNetworking();
  }, [student]);

  // Calculate real statuses
  const experiences = EXPERIENCES_DATA.map(exp => {
    let completed = false;
    
    if (exp.id === 'cv') {
      completed = !!student?.cvUrl;
    } else {
      completed = !!student?.experienceHistory?.[exp.id];
    }

    return { ...exp, completed };
  });

  const completedCount = experiences.filter(e => e.completed).length;
  const progressPercentage = (completedCount / experiences.length) * 100;
  
  // Test mode: Show buttons if ?test=true is in URL
  const queryParams = new URLSearchParams(location.search);
  const isTestMode = queryParams.get('test') === 'true' || queryParams.get('test') === '1';
  const isAllComplete = completedCount === experiences.length || isTestMode;

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
      // Attempt to fetch the champion image from public folder
      const response = await fetch('/champion.png');
      const blob = await response.blob();
      const file = new File([blob], 'champion.png', { type: 'image/png' });

      // Check if file sharing is supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Network UDEM Champion',
          text: shareText,
          url: shareUrl,
        });
      } else if (navigator.share) {
        // Fallback to text sharing
        await navigator.share({
          title: 'Network UDEM 2026',
          text: shareText,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('¡Logro copiado al portapapeles! Ya puedes pegarlo en tus redes.');
      }
    } catch (err) {
      console.error('Sharing failed:', err);
      // Last resort fallback
      if (navigator.share) {
        navigator.share({ title: 'Network UDEM 2026', text: shareText, url: shareUrl }).catch(() => {});
      }
    }
  };

  return (
    <div className="app-container pb-safe" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-dim)' }}>
      {/* Success Banner */}
      {showBanner && (
        <div 
          className="animate-fade-in-down"
          style={{ 
            background: 'var(--color-teal)', 
            color: 'white', 
            padding: '12px 20px', 
            textAlign: 'center', 
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,201,177,0.2)'
          }}
        >
          <PartyPopper size={20} />
          ¡Experiencia completada con éxito!
        </div>
      )}

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
        
        {/* Page Title right */}
        <div style={{ paddingRight: '34px', textAlign: 'right' }}>
          <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
            Experiencias
          </h1>
        </div>
      </div>

      <div style={{ padding: '24px 20px', flex: 1, overflowY: 'auto' }}>
        
        {/* Progress Bar Card */}
        <div className="card animate-fade-in-up" style={{ marginBottom: 24, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Tu Progreso</h2>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-purple-primary)' }}>
              {completedCount} de {experiences.length}
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
              : '¡Completa todas las experiencias de la feria!'}
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

        {/* List of Experiences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {experiences.map((exp, i) => {
            const isExpanded = expandedId === exp.id;
            const isCompleted = exp.completed;
            const Icon = exp.icon;

            return (
              <div 
                key={exp.id} 
                className="card animate-fade-in-up" 
                style={{ 
                  animationDelay: `${(i + 1) * 0.1}s`, 
                  opacity: 0,
                  padding: 16,
                  cursor: 'pointer',
                  border: isExpanded ? '1px solid var(--color-purple-primary)' : '1px solid rgba(0,0,0,0.04)',
                  transition: 'all 0.3s ease',
                  boxShadow: isExpanded ? '0 4px 20px rgba(123,45,142,0.1)' : '0 2px 12px rgba(0,0,0,0.06)'
                }}
                onClick={() => setExpandedId(isExpanded ? null : exp.id)}
              >
                {/* Card Header (Always visible) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Icon Wrapper */}
                  <div style={{ 
                    width: 52, height: 52, borderRadius: 'var(--radius-lg)',
                    background: isCompleted ? 'rgba(0,201,177,0.1)' : 'white',
                    border: isCompleted ? '1px solid rgba(0,201,177,0.2)' : '1px solid #E5E1EA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon size={24} color={isCompleted ? 'var(--color-teal)' : 'var(--color-text-secondary)'} />
                  </div>
                  
                  {/* Title and Status */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {exp.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {isCompleted ? (
                        <CheckCircle2 size={14} color="var(--color-teal)" />
                      ) : (
                        <Circle size={14} color="var(--color-text-secondary)" />
                      )}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isCompleted ? 'var(--color-teal)' : 'var(--color-text-secondary)' }}>
                        {isCompleted ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Arrow */}
                  <div style={{ 
                    color: isExpanded ? 'var(--color-purple-primary)' : 'var(--color-text-secondary)', 
                    transition: 'transform 0.3s ease', 
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' 
                  }}>
                    <ChevronDown size={20} />
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="animate-fade-in" style={{ 
                    marginTop: 16, 
                    paddingTop: 16, 
                    borderTop: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {exp.description}
                    </p>
                    
                    {!isCompleted && (
                      <div style={{ marginTop: 16, padding: 12, background: 'var(--color-surface-dim)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, textAlign: 'center', fontWeight: 500 }}>
                          {exp.id === 'cv' 
                            ? 'Sube tu CV en el Inicio para completar esta experiencia.'
                            : exp.id === 'networking'
                            ? 'Escanea a tu primera empresa para completar esta experiencia.'
                            : 'Escanea el código QR de esta estación para completarla automáticamente.'}
                        </p>
                      </div>
                    )}
                    
                    {/* Template button for CV view */}
                    {exp.id === 'cv' && (
                      <button 
                        className="btn btn-sm btn-ghost btn-full"
                        style={{ marginTop: 12, border: '1px solid #E5E1EA' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('https://drive.google.com/open?id=1_2qsjywuUaZeCrufP8j39zRx2lW5d_wE&usp=drive_fs', '_blank');
                        }}
                      >
                        Descargar plantillas
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

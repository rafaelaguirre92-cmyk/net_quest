import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { Camera, FileText, Users, Rocket, CheckCircle2, Circle, ChevronDown } from 'lucide-react';

const EXPERIENCES = [
  { 
    id: '1', 
    title: 'Foto Profesional', 
    icon: Camera, 
    description: 'Actualiza tu imagen profesional. Dirígete al set fotográfico y tómate la foto perfecta para tu perfil de LinkedIn o CV.', 
    status: 'pending' 
  },
  { 
    id: '2', 
    title: 'Curriculum', 
    icon: FileText, 
    description: 'Sube tu CV al sistema y asegúrate de tenerlo listo para compartir instantáneamente con los reclutadores.', 
    status: 'completed' // Puesto en completado como ejemplo de diseño
  },
  { 
    id: '3', 
    title: 'Networking', 
    icon: Users, 
    description: 'Acércate a los stands de las mejores empresas, plática con los reclutadores y comparte tu perfil.', 
    status: 'pending' 
  },
  { 
    id: '4', 
    title: 'Future Wall', 
    icon: Rocket, 
    description: 'Deja tu marca en el Future Wall. Plasma tus propósitos y visión profesional en tiempo real con el resto de la comunidad.', 
    status: 'pending' 
  },
];

export default function ExperiencesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calcula el progreso en base a los estados (ahora es mock, luego se conectará a Firebase)
  const completedCount = EXPERIENCES.filter(e => e.status === 'completed').length;
  const progressPercentage = (completedCount / EXPERIENCES.length) * 100;

  return (
    <div className="app-container pb-safe" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-dim)' }}>
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
            ¡Completa todas las experiencias de la feria!
          </p>
        </div>

        {/* List of Experiences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EXPERIENCES.map((exp, i) => {
            const isExpanded = expandedId === exp.id;
            const isCompleted = exp.status === 'completed';
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
                          Escanea el código QR de esta estación para completarla automáticamente.
                        </p>
                      </div>
                    )}
                    
                    {/* Botón de Plantillas para la vista de CV */}
                    {exp.title === 'Curriculum' && (
                      <button 
                        className="btn btn-sm btn-ghost btn-full"
                        style={{ marginTop: 12, border: '1px solid #E5E1EA' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('https://firebasestorage.googleapis.com', '_blank');
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

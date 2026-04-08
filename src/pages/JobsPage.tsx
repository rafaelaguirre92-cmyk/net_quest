import { useState, useEffect, useMemo } from 'react';
import BottomNav from '../components/BottomNav';
import { Search, MapPin, Building2, Briefcase, ChevronDown, ExternalLink } from 'lucide-react';
import { fetchJobsFromSheet, type SheetJob } from '../lib/sheets';

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [jobs, setJobs] = useState<SheetJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchJobsFromSheet()
      .then(setJobs)
      .catch((err) => {
        console.error(err);
        setError('No se pudieron cargar las vacantes.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Build unique area list dynamically from the sheet data
  const areas = useMemo(() => {
    const unique = Array.from(new Set(jobs.map(j => j.area).filter(Boolean)));
    unique.sort();
    return ['Todas', ...unique];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(term) ||
        job.companyName.toLowerCase().includes(term) ||
        job.area.toLowerCase().includes(term);
      const matchesArea = selectedArea === 'Todas' || job.area === selectedArea;
      return matchesSearch && matchesArea;
    });
  }, [jobs, searchTerm, selectedArea]);

  const modalityColor = (mod: string) => {
    const m = mod.toLowerCase();
    if (m.includes('remoto')) return { bg: 'rgba(0,201,177,0.12)', color: 'var(--color-teal)' };
    if (m.includes('híbrido') || m.includes('hibrido')) return { bg: 'rgba(255,193,7,0.12)', color: '#E6A800' };
    return { bg: 'rgba(123,45,142,0.1)', color: 'var(--color-purple-primary)' };
  };

  return (
    <div className="app-container pb-safe" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-dim)' }}>
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
            Bolsa de<br />Trabajo
          </h1>
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text"
            placeholder="Buscar vacante o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ 
              paddingLeft: 44,
              borderRadius: 'var(--radius-full)',
              background: 'white',
              border: '1px solid #E5E1EA'
            }}
          />
        </div>
      </div>

      {/* Area Filters */}
      <div style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        gap: 10, 
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {areas.map(area => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: selectedArea === area ? 'var(--color-purple-primary)' : 'rgba(0,0,0,0.05)',
              color: selectedArea === area ? 'white' : 'var(--color-text-secondary)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div style={{ flex: 1, padding: '0 20px 20px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Cargando vacantes...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#FF6B6B' }}>
            <p>{error}</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
            <Briefcase size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>No se encontraron vacantes</p>
            <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Intenta con otra búsqueda o área.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredJobs.map((job, i) => {
              const isExpanded = expandedIdx === i;
              const mc = modalityColor(job.modality);
              return (
                <div
                  key={`${job.companyName}-${job.title}-${i}`}
                  className="card animate-fade-in-up"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    opacity: 0,
                    padding: 0,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: isExpanded ? '1px solid var(--color-purple-primary)' : '1px solid rgba(0,0,0,0.04)',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                >
                  {/* Card Header */}
                  <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Company icon */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--color-purple-primary), var(--color-purple-deep))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Building2 size={22} color="white" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.title}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {job.companyName}
                      </p>
                    </div>

                    {/* Modality badge */}
                    {job.modality && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: mc.bg,
                        color: mc.color,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {job.modality}
                      </span>
                    )}

                    {/* Chevron */}
                    <div style={{ color: 'var(--color-text-secondary)', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{ padding: '0 18px 12px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {job.area && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        <Briefcase size={13} /> {job.area}
                      </span>
                    )}
                    {job.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        <MapPin size={13} /> {job.location}
                      </span>
                    )}
                  </div>

                  {/* Expandable description */}
                  {isExpanded && job.description && (
                    <div className="animate-fade-in" style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '14px 0 0' }}>
                        {job.description}
                      </p>

                      {job.applyLink && (
                        <div style={{ marginTop: 20 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(job.applyLink, '_blank');
                            }}
                            className="btn btn-purple btn-full"
                            style={{ 
                              gap: 8,
                              boxShadow: '0 4px 12px rgba(123, 45, 142, 0.2)',
                              fontSize: '0.9rem'
                            }}
                          >
                            <ExternalLink size={18} />
                            Aplicar a esta vacante
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

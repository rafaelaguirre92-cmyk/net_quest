import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { Search } from 'lucide-react';

const SCHOOLS = [
  'Todas',
  'Arquitectura',
  'Ciencias Sociales',
  'Derecho',
  'Educación',
  'Humanidades',
  'Ingeniería',
  'Negocios'
];

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('Todas');

  // Placeholder data until the user provides the list
  const MOCK_JOBS: { id: string, title: string, company: string, school: string }[] = [];

  const filteredJobs = MOCK_JOBS.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = selectedSchool === 'Todas' || job.school === selectedSchool;
    return matchesSearch && matchesSchool;
  });

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

      {/* Categories / Filters */}
      <div style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        gap: 12, 
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {SCHOOLS.map(school => (
          <button
            key={school}
            onClick={() => setSelectedSchool(school)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: selectedSchool === school ? 'var(--color-purple-primary)' : 'rgba(0,0,0,0.05)',
              color: selectedSchool === school ? 'white' : 'var(--color-text-secondary)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {school}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, padding: '0 20px', overflowY: 'auto' }}>
        {filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
            <p>Aún no hay vacantes registradas aquí.</p>
            <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Pronto se agregará el listado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Vacancy cards here */}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

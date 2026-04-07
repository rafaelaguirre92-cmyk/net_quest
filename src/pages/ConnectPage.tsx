import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  doc, getDoc, collection, addDoc, getDocs, query, where, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Employer, JobOpening } from '../types';
import { CheckCircle2, Building2, MapPin, Briefcase, ArrowLeft, AlertCircle } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function ConnectPage() {
  const { employerId } = useParams<{ employerId: string }>();
  const { user, student } = useAuth();
  const navigate = useNavigate();

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!employerId || !user) return;
    const load = async () => {
      try {
        // Load employer
        const empSnap = await getDoc(doc(db, 'employers', employerId));
        if (!empSnap.exists()) {
          setError('Empresa no encontrada');
          setLoading(false);
          return;
        }
        setEmployer({ id: empSnap.id, ...empSnap.data() } as Employer);

        // Load job openings (subcollection)
        const jobsSnap = await getDocs(
          query(collection(db, 'employers', employerId, 'jobOpenings'), orderBy('createdAt'))
        );
        setJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as JobOpening)));

        // Check for existing connection
        const connQ = query(
          collection(db, 'connections'),
          where('studentId', '==', user.uid),
          where('employerId', '==', employerId)
        );
        const connSnap = await getDocs(connQ);
        if (!connSnap.empty) {
          setAlreadyConnected(true);
        } else {
          // Create connection
          if (!student?.cvUrl) {
            // No CV uploaded - show warning but still allow
          }
          await addDoc(collection(db, 'connections'), {
            studentId: user.uid,
            employerId,
            scannedAt: serverTimestamp(),
            cvUrlSnapshot: student?.cvUrl || null,
            emailSent: false,
          });
          setJustConnected(true);
        }
      } catch (err) {
        console.error(err);
        setError('Error al procesar la conexión');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employerId, user]);

  if (loading) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-dim)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-surface-dim)' }}>
        <AlertCircle size={48} color="var(--color-orange)" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>{error}</p>
        <button className="btn btn-purple" onClick={() => navigate('/home')}>
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--color-surface-dim)' }}>
      {/* Header */}
      <div className="bg-gradient-purple" style={{ padding: '20px 20px 36px', position: 'relative', borderRadius: '0 0 24px 24px' }}>
        <div className="diagonal-bars" style={{ borderRadius: '0 0 24px 24px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate('/home')}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-full)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 16 }}
          >
            <ArrowLeft size={18} color="white" />
          </button>

          {/* Success status */}
          <div className="animate-scale-in" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-full)',
              background: alreadyConnected ? 'rgba(255,255,255,0.15)' : 'rgba(0,201,177,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={24} color={alreadyConnected ? 'rgba(255,255,255,0.7)' : 'var(--color-teal)'} />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                {alreadyConnected
                  ? 'Ya compartiste tu CV'
                  : justConnected
                    ? '¡CV enviado!'
                    : 'Conectado'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                {alreadyConnected
                  ? 'Esta empresa ya tiene tu información'
                  : 'Tu CV llegará al reclutador'}
              </p>
            </div>
          </div>

          {!student?.cvUrl && justConnected && (
            <div style={{ background: 'rgba(255,140,66,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: 8 }}>
              <p style={{ color: 'var(--color-yellow)', fontSize: '0.8rem' }}>
                ⚠️ No tienes CV subido. Súbelo en Inicio para que se envíe.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Employer info */}
      <div style={{ padding: '20px', marginTop: -16 }} className="pb-safe">
        <div className="card animate-fade-in-up" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {employer?.logoUrl ? (
                <img src={employer.logoUrl} alt={employer.companyName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Building2 size={24} color="var(--color-purple-primary)" />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{employer?.companyName}</h2>
            </div>
          </div>
          {employer?.description && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {employer.description}
            </p>
          )}
        </div>

        {/* Job openings */}
        {jobs.length > 0 && (
          <>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12, paddingLeft: 4 }}>
              Vacantes disponibles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map((job, i) => (
                <div
                  key={job.id}
                  className="card animate-fade-in-up"
                  style={{ animationDelay: `${(i + 1) * 0.08}s`, opacity: 0 }}
                >
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>{job.title}</h4>
                  {job.description && (
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 8, lineHeight: 1.5 }}>
                      {job.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {job.location && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        <MapPin size={14} /> {job.location}
                      </span>
                    )}
                    {job.modality && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        <Briefcase size={14} /> {job.modality}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

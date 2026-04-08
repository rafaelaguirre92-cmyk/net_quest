import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Plus, X, Mail, QrCode, UserPlus, CheckCircle2, Globe, Building2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';

interface UnifiedContact {
  id: string;
  type: 'qr' | 'manual';
  companyName: string;
  contactName?: string;
  email?: string;
  website?: string;
  date: Date;
  logoUrl?: string;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [allContacts, setAllContacts] = useState<UnifiedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state?.newContact) {
      setShowSuccessBanner(true);
      const timer = setTimeout(() => setShowSuccessBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const loadContacts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const unified: UnifiedContact[] = [];

      // 1. QR connections
      const q = query(collection(db, 'connections'), where('studentId', '==', user.uid));
      const snap = await getDocs(q);
      
      for (const connDoc of snap.docs) {
        const connData = connDoc.data();
        try {
          const empSnap = await getDoc(doc(db, 'empresas', connData.employerId));
          if (empSnap.exists()) {
            const empData = empSnap.data();
            unified.push({
              id: connDoc.id,
              type: 'qr',
              companyName: empData?.nombre || empData?.companyName || 'Sin nombre',
              contactName: empData?.contactName || '',
              email: empData?.contactEmail || '',
              website: empData?.website || '',
              date: connData.scannedAt ? (connData.scannedAt as { toDate: () => Date }).toDate() : new Date(),
              logoUrl: empData?.logoUrl,
            });
          }
        } catch (e) {
          console.error('Error loading empresa details:', e);
        }
      }

      // 2. Manual contacts
      const mq = query(collection(db, 'manualContacts'), where('studentId', '==', user.uid));
      const mSnap = await getDocs(mq);
      
      for (const mDoc of mSnap.docs) {
        const mData = mDoc.data();
        unified.push({
          id: mDoc.id,
          type: 'manual',
          companyName: mData.companyName,
          contactName: mData.recruiterName,
          email: mData.recruiterEmail,
          date: mData.createdAt ? (mData.createdAt as { toDate: () => Date }).toDate() : new Date(),
        });
      }

      // Sort all by date descending
      unified.sort((a, b) => b.date.getTime() - a.date.getTime());
      setAllContacts(unified);
    } catch (err) {
      console.error('loadContacts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [user]);

  const handleSaveManual = async () => {
    if (!user || !companyName.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'manualContacts'), {
        studentId: user.uid,
        companyName: companyName.trim(),
        recruiterName: recruiterName.trim(),
        recruiterEmail: recruiterEmail.trim(),
        createdAt: serverTimestamp(),
      });
      setCompanyName('');
      setRecruiterName('');
      setRecruiterEmail('');
      setShowModal(false);
      await loadContacts();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100dvh', background: '#F8F9FF', color: 'var(--color-text-primary)' }}>
      {/* Header */}
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
        <img src="/Network_clear_once.gif" alt="Logo" style={{ height: '150px' }} />
        <div style={{ paddingRight: '34px', textAlign: 'right' }}>
          <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
            Mis<br />Contactos
          </h1>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }} className="pb-safe">
        {/* Success Banner */}
        {showSuccessBanner && (
          <div className="animate-scale-in" style={{
            background: 'var(--color-teal)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0,201,177,0.2)',
          }}>
            <CheckCircle2 size={20} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                {state?.alreadyConnected ? 'Ya estabas conectado' : '¡Conexión exitosa!'}
              </p>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>
                {(state?.companyName || 'La empresa') + ' se ha añadido a tu lista.'}
              </p>
            </div>
            <button onClick={() => setShowSuccessBanner(false)} style={{ background: 'none', border: 'none', color: 'white', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Email Banner */}
        <div className="animate-fade-in-up" style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: 'linear-gradient(135deg, rgba(123,45,142,0.08), rgba(0,201,177,0.06))',
          border: '1px solid rgba(123,45,142,0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: 20,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-full)',
            background: 'rgba(123,45,142,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Mail size={18} color="var(--color-purple-primary)" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2, margin: 0 }}>
              Tus contactos llegarán a tu correo
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Al finalizar el evento recibirás un resumen con todos los contactos que hiciste hoy.
            </p>
          </div>
        </div>

        {/* Add contact button */}
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-purple btn-full"
          style={{ marginBottom: 24, gap: 8 }}
        >
          <Plus size={18} />
          Agregar contacto manualmente
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : allContacts.length === 0 ? (
          /* Empty state */
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <Users size={48} color="var(--color-purple-light)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Sin contactos aún</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
              Escanea el QR de un stand o agrega un contacto manualmente
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setShowModal(true)}>
                <UserPlus size={16} />
                Manual
              </button>
              <button className="btn btn-purple btn-sm" style={{ flex: 1 }} onClick={() => navigate('/scan')}>
                <QrCode size={16} />
                Escanear QR
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 100 }}>
            {allContacts.map((contact, i) => (
              <div
                key={contact.id}
                className="card animate-fade-in-up"
                style={{ 
                  animationDelay: `${i * 0.05}s`, 
                  opacity: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 14,
                  padding: '16px',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                {/* Main Card Content */}
                <div style={{ display: 'flex', gap: 14, width: '100%' }}>
                  {/* Icon Container */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--radius-md)',
                    background: contact.type === 'qr' ? 'rgba(123,45,142,0.05)' : 'rgba(0,201,177,0.05)',
                    border: contact.type === 'qr' ? '1px solid rgba(123,45,142,0.1)' : '1px solid rgba(0,201,177,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {contact.type === 'qr' && contact.logoUrl ? (
                      <img src={contact.logoUrl} alt={contact.companyName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                    ) : contact.type === 'qr' ? (
                      <Building2 size={24} color="var(--color-purple-primary)" />
                    ) : (
                      <UserPlus size={24} color="var(--color-teal)" />
                    )}
                  </div>

                  {/* Text Container */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ paddingRight: 90 }}> {/* Protection for larger absolute buttons */}
                      <p style={{ 
                        fontWeight: 700, 
                        fontSize: '1rem', 
                        color: 'var(--color-text-primary)', 
                        margin: '0 0 6px 0', 
                        lineHeight: 1.2, 
                        wordBreak: 'break-word' 
                      }}>
                        {contact.companyName}
                      </p>
                      
                      {contact.contactName && (
                        <p style={{ 
                          color: 'var(--color-text-secondary)', 
                          fontSize: '0.8rem', 
                          margin: 0, 
                          lineHeight: 1.1 
                        }}>
                          {contact.contactName}
                        </p>
                      )}

                      {contact.email && (
                        <p style={{ 
                          color: 'var(--color-purple-primary)', 
                          fontSize: '0.72rem', 
                          fontWeight: 500, 
                          margin: '2px 0 0 0', 
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}>
                          {contact.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Absolute Action Buttons - Larger icons */}
                <div style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  right: '16px', 
                  display: 'flex', 
                  gap: 10 
                }}>
                  {contact.website && (
                    <a
                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-full)',
                        background: 'rgba(0,201,177,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-teal)',
                      }}
                    >
                      <Globe size={20} />
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-full)',
                        background: 'rgba(123,45,142,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-purple-primary)',
                      }}
                    >
                      <Mail size={20} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Manual Contact Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="animate-slide-in-up" style={{
            background: 'white', borderRadius: '24px 24px 0 0',
            padding: '28px 24px 40px', width: '100%',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Agregar contacto</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4, margin: 0 }}>
                  Si no pudiste escanear el QR
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'var(--color-surface-dim)', border: 'none', borderRadius: 'var(--radius-full)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Empresa *
                </label>
                <input
                  className="input"
                  placeholder="Ej. TechNova"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Nombre del reclutador
                </label>
                <input
                  className="input"
                  placeholder="Ej. Ana García"
                  value={recruiterName}
                  onChange={e => setRecruiterName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="Ej. ana@technova.com"
                  value={recruiterEmail}
                  onChange={e => setRecruiterEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-purple btn-full btn-lg"
              onClick={handleSaveManual}
              disabled={!companyName.trim() || saving}
            >
              {saving ? <div className="spinner spinner-white" style={{ width: 20, height: 20 }} /> : (
                <>
                  <UserPlus size={18} />
                  Guardar contacto
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

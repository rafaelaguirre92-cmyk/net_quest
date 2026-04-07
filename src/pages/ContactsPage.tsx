import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Connection, Employer } from '../types';
import { Building2, ChevronRight, Users } from 'lucide-react';
import BottomNav from '../components/BottomNav';

interface ContactItem {
  connection: Connection;
  employer: Employer;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const q = query(
        collection(db, 'connections'),
        where('studentId', '==', user.uid),
        orderBy('scannedAt', 'desc')
      );
      const snap = await getDocs(q);
      const items: ContactItem[] = [];

      for (const connDoc of snap.docs) {
        const conn = { id: connDoc.id, ...connDoc.data() } as Connection;
        const empSnap = await getDoc(doc(db, 'employers', conn.employerId));
        if (empSnap.exists()) {
          items.push({
            connection: conn,
            employer: { id: empSnap.id, ...empSnap.data() } as Employer,
          });
        }
      }
      setContacts(items);
      setLoading(false);
    };
    load();
  }, [user]);

  const formatDate = (date: unknown) => {
    if (!date) return '';
    const d = date instanceof Date ? date : (date as { toDate: () => Date }).toDate();
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

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
        
        {/* Page Title right */}
        <div style={{ paddingRight: '34px', textAlign: 'right' }}>
          <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
            Mis<br />Contactos
          </h1>
        </div>
      </div>

      <div style={{ padding: '0px 20px 0' }} className="pb-safe">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <Users size={48} color="var(--color-purple-light)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Sin contactos aún</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
              Escanea el QR de un stand para compartir tu CV
            </p>
            <button className="btn btn-purple btn-sm" onClick={() => navigate('/scan')}>
              Escanear QR
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Counter */}
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, paddingLeft: 4, marginBottom: 4 }}>
              {contacts.length} empresa{contacts.length !== 1 ? 's' : ''} contactada{contacts.length !== 1 ? 's' : ''}
            </p>

            {contacts.map((item, i) => (
              <button
                key={item.connection.id}
                className="card animate-fade-in-up"
                style={{
                  animationDelay: `${i * 0.06}s`, opacity: 0,
                  width: '100%', border: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                  textAlign: 'left',
                }}
                onClick={() => navigate(`/connect/${item.employer.id}`)}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {item.employer.logoUrl ? (
                    <img src={item.employer.logoUrl} alt={item.employer.companyName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Building2 size={22} color="var(--color-purple-primary)" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.employer.companyName}
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: 2 }}>
                    {formatDate(item.connection.scannedAt)}
                  </p>
                </div>
                <ChevronRight size={18} color="var(--color-text-secondary)" />
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

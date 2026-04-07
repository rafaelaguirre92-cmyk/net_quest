import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import type { Student } from '../types';

interface AuthContextType {
  user: User | null;
  student: Student | null;
  loading: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch student profile from Firestore
  const fetchStudent = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'students', uid));
      if (snap.exists()) {
        setStudent({ id: snap.id, ...snap.data() } as Student);
      } else {
        setStudent(null);
      }
    } catch (e) {
      console.error('Error fetching student:', e);
      setStudent(null);
    }
  };

  const refreshStudent = async () => {
    if (user) {
      await fetchStudent(user.uid);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          await fetchStudent(firebaseUser.uid);
        } else {
          setStudent(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } catch (e) {
      console.error('Auth listener error:', e);
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase no está configurado.');
    const result = await signInWithPopup(auth, googleProvider);
    const uid = result.user.uid;

    // Create student record if first time
    const snap = await getDoc(doc(db, 'students', uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'students', uid), {
        fullName: result.user.displayName || '',
        email: result.user.email || '',
        matricula: '',
        cvUrl: null,
        cvUploadedAt: null,
        onboardingDone: false,
        createdAt: serverTimestamp(),
      });
    }
    await fetchStudent(uid);
  };

  const logout = async () => {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
    setStudent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user, student, loading,
        firebaseReady: isFirebaseConfigured,
        signInWithGoogle, logout, refreshStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/* ===== Firestore document types ===== */

export interface Student {
  id: string;
  fullName: string;
  email: string;
  matricula: string;
  cvUrl: string | null;
  cvUploadedAt: Date | null;
  onboardingDone: boolean;
  createdAt: Date;
}

export interface Employer {
  id: string;
  companyName: string;
  logoUrl: string | null;
  contactEmail: string;
  description: string | null;
  createdAt: Date;
}

export interface JobOpening {
  id: string;
  employerId: string;
  title: string;
  description: string | null;
  location: string | null;
  modality: string | null; // presencial / remoto / híbrido
  createdAt: Date;
}

export interface Connection {
  id: string;
  studentId: string;
  employerId: string;
  scannedAt: Date;
  cvUrlSnapshot: string | null;
  emailSent: boolean;
}

export interface Activity {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
}

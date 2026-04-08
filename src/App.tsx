import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SplashPage from './pages/SplashPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import ScannerPage from './pages/ScannerPage';
import ConnectPage from './pages/ConnectPage';
import ContactsPage from './pages/ContactsPage';
import JobsPage from './pages/JobsPage';
import ExperiencesPage from './pages/ExperiencesPage';
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { student, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container bg-gradient-purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="spinner spinner-white" />
      </div>
    );
  }

  // If student hasn't completed onboarding, redirect there
  if (student && !student.onboardingDone) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Onboarding (requires auth, but not onboarding completion) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected + onboarding-required routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <HomePage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <ScannerPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/connect/:employerId"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <ConnectPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <ContactsPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <JobsPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/experiences"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <ExperiencesPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

import { Route, Routes } from "react-router-dom";
import {
  AdminOnlyRoute,
  ProtectedRoute
} from "./components/PortalComponents";
import AIHealthPage from "./pages/AIHealthPage";
import AdminPage from "./pages/AdminPage";
import AppointmentRequestPage from "./pages/AppointmentRequestPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AuthPage from "./pages/AuthPage";
import BloodRequestPage from "./pages/BloodRequestPage";
import CertificateVerifyPage from "./pages/CertificateVerifyPage";
import CertificatesPage from "./pages/CertificatesPage";
import DashboardPage from "./pages/DashboardPage";
import DirectoryPage from "./pages/DirectoryPage";
import DoctorProfilePage from "./pages/DoctorProfilePage";
import DonorCoinPage from "./pages/DonorCoinPage";
import HospitalProfilePage from "./pages/HospitalProfilePage";
import LandingPage from "./pages/LandingPage";
import PrivacyCenterPage from "./pages/PrivacyCenterPage";
import RecoveryPage from "./pages/RecoveryPage";
import TrackingPage from "./pages/TrackingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<LandingPage />} />
      <Route path="/become-donor" element={<AuthPage mode="register" />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/verify/certificate/:certificateId" element={<CertificateVerifyPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/need-blood" element={<ProtectedRoute><BloodRequestPage /></ProtectedRoute>} />
      <Route path="/ai-health-assistant" element={<ProtectedRoute><AIHealthPage /></ProtectedRoute>} />
      <Route path="/find-care" element={<ProtectedRoute><DirectoryPage /></ProtectedRoute>} />
      <Route path="/doctors/:id" element={<ProtectedRoute><DoctorProfilePage /></ProtectedRoute>} />
      <Route path="/hospitals/:id" element={<ProtectedRoute><HospitalProfilePage /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/appointments/request/:providerType/:providerId" element={<ProtectedRoute><AppointmentRequestPage /></ProtectedRoute>} />
      <Route path="/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
      <Route path="/privacy-center" element={<ProtectedRoute><PrivacyCenterPage /></ProtectedRoute>} />
      <Route path="/tracking/:bloodRequestId" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
      <Route path="/donor/recovery" element={<ProtectedRoute><RecoveryPage /></ProtectedRoute>} />
      <Route path="/donor-coin" element={<ProtectedRoute><DonorCoinPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminOnlyRoute><AdminPage /></AdminOnlyRoute></ProtectedRoute>} />
    </Routes>
  );
}

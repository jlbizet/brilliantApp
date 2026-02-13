import { Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from './types';
import { useAuthStore } from './stores';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import PatientsPage from './features/patients/PatientsPage';
import PatientDetailPage from './features/patients/PatientDetailPage';
import AppointmentsPage from './features/appointments/AppointmentsPage';
import TreatmentsPage from './features/treatments/TreatmentsPage';
import BillingPage from './features/billing/BillingPage';
import InventoryPage from './features/inventory/InventoryPage';
import SettingsPage from './features/settings/SettingsPage';
import PrescriptionsPage from './features/prescriptions/PrescriptionsPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import StaffPage from './features/staff/StaffPage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Routes>
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/patients" element={<PatientsPage />} />
                                <Route path="/patients/:id" element={<PatientDetailPage />} />
                                <Route path="/appointments" element={<AppointmentsPage />} />
                                <Route path="/treatments" element={<TreatmentsPage />} />
                                <Route
                                    path="/billing"
                                    element={
                                        <ProtectedRoute allowedRoles={['ADMIN', 'DENTIST', 'RECEPTIONIST']}>
                                            <BillingPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/inventory"
                                    element={
                                        <ProtectedRoute allowedRoles={['ADMIN', 'DENTIST', 'HYGIENIST', 'RECEPTIONIST']}>
                                            <InventoryPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/prescriptions" element={<PrescriptionsPage />} />
                                <Route path="/notifications" element={<NotificationsPage />} />
                                <Route
                                    path="/staff"
                                    element={
                                        <ProtectedRoute allowedRoles={['ADMIN']}>
                                            <StaffPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/settings" element={<SettingsPage />} />
                            </Routes>
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

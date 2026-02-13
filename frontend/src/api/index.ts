import api from './client';
import type { AuthResponse, PaginatedResponse, Patient, Appointment, DashboardStats, TreatmentPlan, Invoice, InventoryItem, User, Notification, Document, Prescription } from '../types';

// ---- Auth ----
export const authApi = {
    login: (email: string, password: string) =>
        api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
    register: (data: any) =>
        api.post<AuthResponse>('/auth/register', data).then(r => r.data),
    getProfile: () =>
        api.get<User>('/auth/profile').then(r => r.data),
    logout: () =>
        api.post('/auth/logout').then(r => r.data),
};

// ---- Patients ----
export const patientsApi = {
    getAll: (params?: any) =>
        api.get<PaginatedResponse<Patient>>('/patients', { params }).then(r => r.data),
    getOne: (id: string) =>
        api.get<Patient>(`/patients/${id}`).then(r => r.data),
    create: (data: any) =>
        api.post<Patient>('/patients', data).then(r => r.data),
    update: (id: string, data: any) =>
        api.patch<Patient>(`/patients/${id}`, data).then(r => r.data),
    delete: (id: string) =>
        api.delete(`/patients/${id}`).then(r => r.data),
    addMedicalHistory: (patientId: string, data: any) =>
        api.post(`/patients/${patientId}/medical-history`, data).then(r => r.data),
    removeMedicalHistory: (historyId: string) =>
        api.delete(`/patients/medical-history/${historyId}`).then(r => r.data),
    addAllergy: (patientId: string, data: any) =>
        api.post(`/patients/${patientId}/allergies`, data).then(r => r.data),
    removeAllergy: (allergyId: string) =>
        api.delete(`/patients/allergies/${allergyId}`).then(r => r.data),
};

// ---- Appointments ----
export const appointmentsApi = {
    getAll: (params?: any) =>
        api.get<PaginatedResponse<Appointment>>('/appointments', { params }).then(r => r.data),
    getCalendar: (params?: any) =>
        api.get<Appointment[]>('/appointments/calendar', { params }).then(r => r.data),
    getOne: (id: string) =>
        api.get<Appointment>(`/appointments/${id}`).then(r => r.data),
    create: (data: any) =>
        api.post<Appointment>('/appointments', data).then(r => r.data),
    update: (id: string, data: any) =>
        api.patch<Appointment>(`/appointments/${id}`, data).then(r => r.data),
    delete: (id: string) =>
        api.delete(`/appointments/${id}`).then(r => r.data),
};

// ---- Users ----
export const usersApi = {
    getAll: (params?: any) =>
        api.get<PaginatedResponse<User>>('/users', { params }).then(r => r.data),
    getDentists: () =>
        api.get<User[]>('/users/dentists').then(r => r.data),
    getOne: (id: string) =>
        api.get<User>(`/users/${id}`).then(r => r.data),
    create: (data: any) =>
        api.post('/users', data).then(r => r.data),
    update: (id: string, data: any) =>
        api.patch(`/users/${id}`, data).then(r => r.data),
    delete: (id: string) =>
        api.delete(`/users/${id}`).then(r => r.data),
    updatePassword: (id: string, data: { currentPassword: string; newPassword: string }) =>
        api.patch(`/users/${id}/password`, data).then(r => r.data),
};

// ---- Treatments ----
export const treatmentsApi = {
    getPlans: (patientId?: string) =>
        api.get<TreatmentPlan[]>('/treatments/plans', { params: { patientId } }).then(r => r.data),
    getPlan: (id: string) =>
        api.get<TreatmentPlan>(`/treatments/plans/${id}`).then(r => r.data),
    createPlan: (data: any) =>
        api.post('/treatments/plans', data).then(r => r.data),
    updatePlan: (id: string, data: any) =>
        api.patch(`/treatments/plans/${id}`, data).then(r => r.data),
    deletePlan: (id: string) =>
        api.delete(`/treatments/plans/${id}`).then(r => r.data),
    createTreatment: (data: any) =>
        api.post('/treatments', data).then(r => r.data),
    updateTreatment: (id: string, data: any) =>
        api.patch(`/treatments/${id}`, data).then(r => r.data),
    deleteTreatment: (id: string) =>
        api.delete(`/treatments/${id}`).then(r => r.data),
};

// ---- Billing ----
export const billingApi = {
    getInvoices: (params?: any) =>
        api.get<PaginatedResponse<Invoice>>('/billing/invoices', { params }).then(r => r.data),
    getInvoice: (id: string) =>
        api.get<Invoice>(`/billing/invoices/${id}`).then(r => r.data),
    createInvoice: (data: any) =>
        api.post('/billing/invoices', data).then(r => r.data),
    deleteInvoice: (id: string) =>
        api.delete(`/billing/invoices/${id}`).then(r => r.data),
    createPayment: (data: any) =>
        api.post('/billing/payments', data).then(r => r.data),
    getRevenueReport: (startDate: string, endDate: string) =>
        api.get('/billing/reports/revenue', { params: { startDate, endDate } }).then(r => r.data),
    updateStatus: (id: string, status: string) =>
        api.patch(`/billing/invoices/${id}/status`, { status }).then(r => r.data),
};

// ---- Inventory ----
export const inventoryApi = {
    getAll: (params?: any) =>
        api.get<PaginatedResponse<InventoryItem>>('/inventory', { params }).then(r => r.data),
    getLowStock: () =>
        api.get<InventoryItem[]>('/inventory/low-stock').then(r => r.data),
    create: (data: any) =>
        api.post('/inventory', data).then(r => r.data),
    update: (id: string, data: any) =>
        api.patch(`/inventory/${id}`, data).then(r => r.data),
    delete: (id: string) =>
        api.delete(`/inventory/${id}`).then(r => r.data),
};

// ---- Analytics ----
export const analyticsApi = {
    getDashboard: () =>
        api.get<DashboardStats>('/analytics/dashboard').then(r => r.data),
    getRevenueChart: (months?: number) =>
        api.get('/analytics/revenue-chart', { params: { months } }).then(r => r.data),
    getAppointmentStats: () =>
        api.get('/analytics/appointments').then(r => r.data),
    getPatientGrowth: (months?: number) =>
        api.get('/analytics/patient-growth', { params: { months } }).then(r => r.data),
    getRecentActivity: () =>
        api.get('/analytics/recent-activity').then(r => r.data),
};

// ---- Notifications ----
export const notificationsApi = {
    getAll: () =>
        api.get<Notification[]>('/notifications').then(r => r.data),
    getUnreadCount: () =>
        api.get<number>('/notifications/unread-count').then(r => r.data),
    markAsRead: (id: string) =>
        api.patch(`/notifications/${id}/read`).then(r => r.data),
    markAllRead: () =>
        api.patch('/notifications/read-all').then(r => r.data),
};

// ---- Documents ----
export const documentsApi = {
    getByPatient: (patientId: string) =>
        api.get<Document[]>(`/documents/patient/${patientId}`).then(r => r.data),
    getOne: (id: string) =>
        api.get<Document>(`/documents/${id}`).then(r => r.data),
    download: (id: string) =>
        api.get(`/documents/${id}/download`, { responseType: 'blob' }).then(r => r.data),
    upload: (patientId: string, file: File, type: string, description?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('patientId', patientId);
        if (description) formData.append('description', description);
        return api.post<Document>('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },
    delete: (id: string) =>
        api.delete(`/documents/${id}`).then(r => r.data),
};

// ---- Waitlist ----
export const waitlistApi = {
    getAll: () =>
        api.get<any[]>('/waitlist').then(r => r.data),
    getByPatient: (patientId: string) =>
        api.get<any[]>(`/waitlist/patient/${patientId}`).then(r => r.data),
    create: (data: any) =>
        api.post('/waitlist', data).then(r => r.data),
    update: (id: string, data: any) =>
        api.patch(`/waitlist/${id}`, data).then(r => r.data),
    delete: (id: string) =>
        api.delete(`/waitlist/${id}`).then(r => r.data),
};
// ---- Odontogram ----
export const odontogramApi = {
    get: (patientId: string) =>
        api.get(`/odontogram/${patientId}`).then(r => r.data),
    addCondition: (patientId: string, data: any) =>
        api.post(`/odontogram/${patientId}/condition`, data).then(r => r.data),
    removeCondition: (id: string) =>
        api.delete(`/odontogram/condition/${id}`).then(r => r.data),
};

// ---- Prescriptions ----
export const prescriptionsApi = {
    getAll: (patientId?: string) =>
        api.get<Prescription[]>('/prescriptions', { params: { patientId } }).then(r => r.data),
    getOne: (id: string) =>
        api.get<Prescription>(`/prescriptions/${id}`).then(r => r.data),
    create: (data: any) =>
        api.post<Prescription>('/prescriptions', data).then(r => r.data),
    update: (id: string, data: any) =>
        api.patch<Prescription>(`/prescriptions/${id}`, data).then(r => r.data),
    delete: (id: string) =>
        api.delete(`/prescriptions/${id}`).then(r => r.data),
};

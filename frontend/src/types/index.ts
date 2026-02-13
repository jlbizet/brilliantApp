// Shared TypeScript types matching the backend Prisma models

export type UserRole = 'ADMIN' | 'DENTIST' | 'HYGIENIST' | 'RECEPTIONIST';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED';
export type TreatmentStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type DocumentType = 'XRAY' | 'SCAN' | 'CONSENT_FORM' | 'PHOTO' | 'LAB_RESULT' | 'PRESCRIPTION' | 'INSURANCE' | 'OTHER';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE' | 'BANK_TRANSFER' | 'OTHER';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    avatar?: string;
    specialization?: string;
    licenseNumber?: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
}

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    dateOfBirth: string;
    gender: Gender;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    medicalHistory?: MedicalHistory[];
    allergies?: Allergy[];
    documents?: Document[];
    waitlistEntries?: WaitlistEntry[];
    appointments?: Appointment[];
    treatmentPlans?: TreatmentPlan[];
    invoices?: Invoice[];
    _count?: { appointments: number; treatmentPlans: number; invoices: number; documents: number };
}

export interface MedicalHistory {
    id: string;
    patientId: string;
    condition: string;
    description?: string;
    diagnosedAt?: string;
    isOngoing: boolean;
}

export interface Allergy {
    id: string;
    patientId: string;
    allergen: string;
    severity: string;
    reaction?: string;
}

export interface Appointment {
    id: string;
    patientId: string;
    dentistId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    type: string;
    notes?: string;
    isRecurring: boolean;
    recurringPattern?: string;
    recurringGroupId?: string;
    recurringEndDate?: string;
    patient?: Pick<Patient, 'id' | 'firstName' | 'lastName' | 'phone'>;
    dentist?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface TreatmentPlan {
    id: string;
    patientId: string;
    name: string;
    description?: string;
    status: TreatmentStatus;
    estimatedCost: number;
    patient?: Pick<Patient, 'id' | 'firstName' | 'lastName'>;
    treatments?: Treatment[];
    createdAt?: string;
    updatedAt?: string;
    _count?: { treatments: number };
}

export interface Treatment {
    id: string;
    treatmentPlanId: string;
    name: string;
    description?: string;
    tooth?: string;
    status: TreatmentStatus;
    cost: number;
    performedAt?: string;
}

export interface Invoice {
    id: string;
    patientId: string;
    invoiceNumber: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: PaymentStatus;
    dueDate: string;
    patient?: Pick<Patient, 'id' | 'firstName' | 'lastName'>;
    items?: InvoiceItem[];
    payments?: Payment[];
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    paidAt: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    sku?: string;
    quantity: number;
    minQuantity: number;
    unitPrice: number;
    supplier?: string;
    expiryDate?: string;
}

export interface Document {
    id: string;
    patientId: string;
    name: string;
    type: DocumentType;
    filePath: string;
    fileSize: number;
    mimeType: string;
    description?: string;
    uploadedAt: string;
}

export interface WaitlistEntry {
    id: string;
    patientId: string;
    dentistId?: string;
    preferredDays?: string;
    preferredTime?: string;
    priority: number;
    notes?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    patient?: Pick<Patient, 'id' | 'firstName' | 'lastName' | 'phone'>;
}

export interface Prescription {
    id: string;
    patientId: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
    prescribedAt: string;
    createdAt: string;
    patient?: Pick<Patient, 'id' | 'firstName' | 'lastName'>;
}

export interface Notification {
    id: string;
    userId?: string;
    recipientPatientId?: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata?: any;
}

export interface DashboardStats {
    totalPatients: number;
    activePatients: number;
    todayAppointments: number;
    monthAppointments: number;
    pendingInvoices: number;
    monthRevenue: number;
    lowStockItems: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>;
}

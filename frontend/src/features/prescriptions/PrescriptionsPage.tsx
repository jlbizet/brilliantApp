import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Search, FileText, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores';
import { prescriptionsApi, patientsApi } from '../../api';
import type { Prescription, Patient } from '../../types';
import { getErrorMessage } from '../../utils/errors';

export default function PrescriptionsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState({
        patientId: '',
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
    });

    const { data: prescriptions, isLoading } = useQuery({
        queryKey: ['prescriptions', page, search],
        queryFn: () => prescriptionsApi.getAll(),
    });

    const { data: patients } = useQuery({
        queryKey: ['patients-for-prescriptions'],
        queryFn: () => patientsApi.getAll({ limit: 100 }),
    });

    const createMutation = useMutation({
        mutationFn: prescriptionsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
            toast.success(t('prescriptions.create_success'));
            resetForm();
        },
        onError: (err: any) => toast.error(getErrorMessage(err, t('prescriptions.create_error'))),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => prescriptionsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
            toast.success(t('prescriptions.update_success'));
            resetForm();
        },
        onError: (err: any) => toast.error(getErrorMessage(err, t('prescriptions.update_error'))),
    });

    const deleteMutation = useMutation({
        mutationFn: prescriptionsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
            toast.success(t('prescriptions.delete_success'));
        },
        onError: (err: any) => toast.error(getErrorMessage(err, t('prescriptions.delete_error'))),
    });

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setSelectedPatient(null);
        setFormData({ patientId: '', medication: '', dosage: '', frequency: '', duration: '', notes: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (prescription: Prescription) => {
        setEditingId(prescription.id);
        setFormData({
            patientId: prescription.patientId,
            medication: prescription.medication,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration,
            notes: prescription.notes || '',
        });
        if (prescription.patient) {
            setSelectedPatient({
                id: prescription.patient.id,
                firstName: prescription.patient.firstName,
                lastName: prescription.patient.lastName,
            } as Patient);
        }
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePatientSelect = (patientId: string) => {
        const patient = patients?.data.find((p: Patient) => p.id === patientId);
        setSelectedPatient(patient || null);
        setFormData({ ...formData, patientId });
    };

    const filteredPrescriptions = prescriptions?.filter((p: Prescription) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            p.medication.toLowerCase().includes(searchLower) ||
            p.patient?.firstName.toLowerCase().includes(searchLower) ||
            p.patient?.lastName.toLowerCase().includes(searchLower)
        );
    });

    const paginatedPrescriptions = filteredPrescriptions?.slice((page - 1) * 10, page * 10);
    const totalPages = Math.ceil((filteredPrescriptions?.length || 0) / 10);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-dental-teal to-dental-sky bg-clip-text text-transparent">
                        {t('prescriptions.title')}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {t('prescriptions.total_count', { count: filteredPrescriptions?.length || 0 })}
                    </p>
                </div>
                {['ADMIN', 'DENTIST'].includes(user?.role as string) && (
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary shadow-lg shadow-dental-teal/30 hover:shadow-xl hover:shadow-dental-teal/40 transition-all duration-300">
                        <Plus className="w-4 h-4" /> {editingId ? t('prescriptions.cancel_edit') : t('prescriptions.add')}
                    </button>
                )}
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="card animate-slide-up border-l-4 border-l-dental-teal relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-dental-teal via-dental-sky to-dental-teal opacity-50" />
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6">
                        {editingId ? t('prescriptions.edit_title') : t('prescriptions.new_title')}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="label flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t('prescriptions.patient')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="input-field mt-1.5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-dental-teal/50 transition-all duration-200"
                                    value={formData.patientId}
                                    onChange={(e) => handlePatientSelect(e.target.value)}
                                    required
                                    disabled={!!editingId}
                                >
                                    <option value="">{t('prescriptions.select_patient')}</option>
                                    {patients?.data.map((patient: Patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.firstName} {patient.lastName}
                                        </option>
                                    ))}
                                </select>
                                {selectedPatient && (
                                    <div className="mt-2 p-2 bg-dental-teal/10 dark:bg-dental-teal/20 rounded-lg inline-flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-dental-teal to-dental-sky rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                                        </div>
                                        <p className="text-sm font-medium text-dental-teal">
                                            {selectedPatient.firstName} {selectedPatient.lastName}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="label flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t('prescriptions.medication')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-dental-teal/50 transition-all duration-200"
                                    value={formData.medication}
                                    onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                                    placeholder={t('prescriptions.medication_placeholder')}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="label flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t('prescriptions.dosage')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-dental-teal/50 transition-all duration-200"
                                    value={formData.dosage}
                                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                    placeholder={t('prescriptions.dosage_placeholder')}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="label flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t('prescriptions.frequency')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-dental-teal/50 transition-all duration-200"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    placeholder={t('prescriptions.frequency_placeholder')}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="label flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t('prescriptions.duration')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-dental-teal/50 transition-all duration-200"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder={t('prescriptions.duration_placeholder')}
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="label text-sm font-semibold text-gray-700 dark:text-gray-300">{t('prescriptions.notes')}</label>
                                <textarea
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-dental-teal/50 transition-all duration-200 resize-none"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder={t('prescriptions.notes_placeholder')}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button type="button" onClick={resetForm} className="btn-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="btn-primary shadow-lg shadow-dental-teal/30 hover:shadow-xl hover:shadow-dental-teal/40 transition-all duration-300"
                            >
                                {(createMutation.isPending || updateMutation.isPending)
                                    ? t('common.saving')
                                    : editingId
                                        ? t('prescriptions.update_button')
                                        : t('prescriptions.create_button')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder={t('prescriptions.search_placeholder')}
                    className="input-field pl-10 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-dental-teal/30 transition-all duration-200 shadow-sm"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {/* Prescriptions List */}
            {isLoading ? (
                <div className="card text-center py-16 text-gray-400">
                    <div className="animate-pulse flex flex-col items-center">
                        <FileText className="w-12 h-12 mb-4 opacity-30" />
                        {t('prescriptions.loading')}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedPrescriptions?.map((prescription: Prescription) => (
                        <div key={prescription.id} className="card hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-dental-teal via-dental-sky to-dental-teal opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-dental-teal to-dental-sky rounded-xl flex items-center justify-center text-white shadow-lg shadow-dental-teal/25 group-hover:shadow-dental-teal/40 transition-shadow duration-300">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-dental-teal dark:group-hover:text-dental-sky transition-colors duration-200">{prescription.medication}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {prescription.patient?.firstName[0]}{prescription.patient?.lastName[0]}
                                                </div>
                                                {prescription.patient?.firstName} {prescription.patient?.lastName}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('prescriptions.dosage')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{prescription.dosage}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('prescriptions.frequency')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{prescription.frequency}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('prescriptions.duration')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{prescription.duration}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('prescriptions.prescribed')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {new Date(prescription.prescribedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {prescription.notes && (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl border-l-4 border-amber-400">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">{prescription.notes}</p>
                                        </div>
                                    )}
                                </div>
                                {['ADMIN', 'DENTIST'].includes(user?.role as string) && (
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(prescription)}
                                            className="p-2.5 text-gray-500 hover:text-dental-teal hover:bg-dental-teal/10 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                            title={t('common.edit')}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(t('prescriptions.confirm_delete'))) {
                                                    deleteMutation.mutate(prescription.id);
                                                }
                                            }}
                                            className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                            title={t('common.delete')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {(!paginatedPrescriptions || paginatedPrescriptions.length === 0) && (
                        <div className="card text-center py-16 text-gray-400">
                            <div className="w-20 h-20 bg-gradient-to-br from-dental-teal/20 to-dental-sky/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-dental-teal/50" />
                            </div>
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{t('prescriptions.no_prescriptions')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('common.pagination_info', { page, totalPages, total: filteredPrescriptions?.length })}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-dental-teal hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-10 h-10 rounded-xl font-medium transition-all duration-200 ${
                                        page === pageNum
                                            ? 'bg-dental-teal text-white shadow-lg shadow-dental-teal/30'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-dental-teal hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

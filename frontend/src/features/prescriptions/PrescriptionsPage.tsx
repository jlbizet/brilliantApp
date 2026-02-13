import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Search, FileText, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { prescriptionsApi, patientsApi } from '../../api';
import type { Prescription, Patient } from '../../types';

export default function PrescriptionsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
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
            toast.success(t('prescriptions.create_success') || 'Prescription created successfully');
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || t('prescriptions.create_error') || 'Failed to create prescription'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => prescriptionsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
            toast.success(t('prescriptions.update_success') || 'Prescription updated successfully');
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || t('prescriptions.update_error') || 'Failed to update prescription'),
    });

    const deleteMutation = useMutation({
        mutationFn: prescriptionsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
            toast.success(t('prescriptions.delete_success') || 'Prescription deleted successfully');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || t('prescriptions.delete_error') || 'Failed to delete prescription'),
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('prescriptions.title') || 'Prescriptions'}</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {t('prescriptions.total_count', { count: filteredPrescriptions?.length || 0 }) || `${filteredPrescriptions?.length || 0} prescriptions`}
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                    <Plus className="w-4 h-4" /> {editingId ? t('prescriptions.cancel_edit') || 'Cancel Edit' : t('prescriptions.add') || 'Add Prescription'}
                </button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="card animate-slide-up">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                        {editingId ? t('prescriptions.edit_title') || 'Edit Prescription' : t('prescriptions.new_title') || 'New Prescription'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="label">{t('prescriptions.patient')} *</label>
                                <select
                                    className="input-field"
                                    value={formData.patientId}
                                    onChange={(e) => handlePatientSelect(e.target.value)}
                                    required
                                    disabled={!!editingId}
                                >
                                    <option value="">{t('prescriptions.select_patient') || 'Select a patient'}</option>
                                    {patients?.data.map((patient: Patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.firstName} {patient.lastName}
                                        </option>
                                    ))}
                                </select>
                                {selectedPatient && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedPatient.firstName} {selectedPatient.lastName}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="label">{t('prescriptions.medication')} *</label>
                                <input
                                    className="input-field"
                                    value={formData.medication}
                                    onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                                    placeholder="e.g., Amoxicillin"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">{t('prescriptions.dosage')} *</label>
                                <input
                                    className="input-field"
                                    value={formData.dosage}
                                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                    placeholder="e.g., 500mg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">{t('prescriptions.frequency')} *</label>
                                <input
                                    className="input-field"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    placeholder="e.g., 3 times daily"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">{t('prescriptions.duration')} *</label>
                                <input
                                    className="input-field"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="e.g., 7 days"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="label">{t('prescriptions.notes')}</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder={t('prescriptions.notes_placeholder') || 'Additional instructions...'}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={resetForm} className="btn-secondary">
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="btn-primary"
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
                    placeholder={t('prescriptions.search_placeholder') || 'Search prescriptions or patients...'}
                    className="input-field pl-10"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {/* Prescriptions List */}
            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">{t('prescriptions.loading') || 'Loading prescriptions...'}</div>
            ) : (
                <div className="space-y-4">
                    {paginatedPrescriptions?.map((prescription: Prescription) => (
                        <div key={prescription.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-dental-teal to-dental-sky rounded-xl flex items-center justify-center text-white">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{prescription.medication}</h3>
                                            <p className="text-sm text-gray-500">
                                                {prescription.patient?.firstName} {prescription.patient?.lastName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">{t('prescriptions.dosage')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{prescription.dosage}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">{t('prescriptions.frequency')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{prescription.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">{t('prescriptions.duration')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{prescription.duration}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">{t('prescriptions.prescribed')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {new Date(prescription.prescribedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {prescription.notes && (
                                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{prescription.notes}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(prescription)}
                                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(t('prescriptions.confirm_delete') || 'Are you sure you want to delete this prescription?')) {
                                                deleteMutation.mutate(prescription.id);
                                            }
                                        }}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!paginatedPrescriptions || paginatedPrescriptions.length === 0) && (
                        <div className="card text-center py-12 text-gray-400">
                            {t('prescriptions.no_prescriptions') || 'No prescriptions found'}
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {t('common.pagination_info', { page, totalPages, total: filteredPrescriptions?.length }) ||
                            `Page ${page} of ${totalPages} (${filteredPrescriptions?.length} total)`}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-secondary !py-2 !px-3"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="btn-secondary !py-2 !px-3"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

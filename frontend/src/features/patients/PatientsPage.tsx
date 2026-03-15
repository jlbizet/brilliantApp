import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, Mail, ChevronLeft, ChevronRight, Trash2, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores';
import { patientsApi } from '../../api';
import type { Patient } from '../../types';
import { DatePicker } from '../../components/ui';

export default function PatientsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'PREFER_NOT_TO_SAY' });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const { data: patients, isLoading } = useQuery({
        queryKey: ['patients', page, search],
        queryFn: () => patientsApi.getAll({ page, limit: 10, search: search || undefined }),
    });

    const createMutation = useMutation({
        mutationFn: patientsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            toast.success(t('patients.create_success') || 'Patient created successfully');
            setShowForm(false);
            setFormData({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'PREFER_NOT_TO_SAY' });
            setFieldErrors({});
        },
        onError: (err: any) => {
            const response = err.response?.data;
            if (response?.errors) {
                setFieldErrors(response.errors);
                toast.error(t('patients.create_error') || 'Failed to create patient');
            } else {
                toast.error(response?.message?.[0] || t('patients.create_error') || 'Failed to create patient');
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: patientsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            toast.success(t('patients.delete_success') || 'Patient deactivated successfully');
        },
        onError: (err: any) => toast.error(t('patients.delete_error') || 'Failed to deactivate patient'),
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(t('patients.delete_confirm', { name }) || `Are you sure you want to delete ${name}?`)) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section with Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('patients.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('patients.manage_description')}</p>
                </div>
                {['ADMIN', 'DENTIST', 'RECEPTIONIST'].includes(user?.role as string) && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary group flex items-center gap-2"
                    >
                        <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-3 h-3" />
                        </div>
                        {t('patients.add')}
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-50 dark:bg-primary-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{patients?.meta.total || 0}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('patients.total_patients')}</p>
                        </div>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {patients?.data.filter((p: Patient) => {
                                    const createdDate = new Date(p.createdAt);
                                    const thirtyDaysAgo = new Date();
                                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                    return createdDate >= thirtyDaysAgo;
                                }).length || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('patients.new_this_month')}</p>
                        </div>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-50 dark:bg-violet-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{patients?.meta.totalPages || 1}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('common.pages')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card animate-slide-up !p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{t('patients.new')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('patients.form_description')}</p>
                        </div>
                    </div>
                    <form
                        onSubmit={(e) => { e.preventDefault(); setFieldErrors({}); createMutation.mutate(formData); }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('patients.first_name')} *</label>
                            <input className={`input-field mt-1 ${fieldErrors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`} value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('patients.last_name')} *</label>
                            <input className={`input-field mt-1 ${fieldErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`} value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('patients.phone')} *</label>
                            <input className={`input-field mt-1 ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}`} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                            {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('patients.email')}</label>
                            <input type="email" className={`input-field mt-1 ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('patients.date_of_birth')} *</label>
                            <DatePicker
                                value={formData.dateOfBirth}
                                onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                                className={`mt-1 ${fieldErrors.dateOfBirth ? 'border-red-500' : ''}`}
                            />
                            {fieldErrors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth}</p>}
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('patients.gender')}</label>
                            <select className="input-field mt-1" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                <option value="MALE">{t('patients.male')}</option>
                                <option value="FEMALE">{t('patients.female')}</option>
                                <option value="OTHER">{t('patients.other')}</option>
                                <option value="PREFER_NOT_TO_SAY">{t('patients.prefer_not_to_say')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
                            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                                {createMutation.isPending ? t('common.loading') : t('patients.create_button')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder={t('patients.search_placeholder')}
                    className="input-field pl-11 pr-4 py-2.5 w-full rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {/* Patient Table */}
            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">{t('patients.loading')}</div>
            ) : (
                <div className="card overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('patients.table_patient')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('patients.table_contact')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('patients.table_dob')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('patients.table_gender')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('patients.table_appointments')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {patients?.data.map((patient: Patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <Link to={`/patients/${patient.id}`} className="flex items-center gap-3 group">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                                                    {patient.firstName[0]}{patient.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        {patient.firstName} {patient.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {patient.id.slice(0, 8)}...</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <div className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                                        <Phone className="w-3 h-3 text-primary-600" />
                                                    </div>
                                                    {patient.phone}
                                                </p>
                                                {patient.email && (
                                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                            <Mail className="w-3 h-3 text-gray-500" />
                                                        </div>
                                                        {patient.email}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
                                        <td className="py-4 px-6">
                                            <span className="badge badge-neutral text-xs">{t(`patients.gender_${patient.gender.toLowerCase()}`)}</span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">{patient._count?.appointments || 0}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <Link to={`/patients/${patient.id}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
                                                    {t('patients.view_details')} →
                                                </Link>
                                                {['ADMIN', 'RECEPTIONIST'].includes(user?.role as string) && (
                                                    <button
                                                        onClick={() => handleDelete(patient.id, `${patient.firstName} ${patient.lastName}`)}
                                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!patients?.data || patients.data.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    <Users className="w-6 h-6 text-gray-400" />
                                                </div>
                                                {t('patients.no_patients')}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {patients && patients.meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('common.pagination_info', { page: patients.meta.page, totalPages: patients.meta.totalPages, total: patients.meta.total })}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-2 !px-3">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPage(p => Math.min(patients.meta.totalPages, p + 1))} disabled={page >= patients.meta.totalPages} className="btn-secondary !py-2 !px-3">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

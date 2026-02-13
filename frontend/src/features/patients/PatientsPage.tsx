import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientsApi } from '../../api';
import type { Patient } from '../../types';

export default function PatientsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'PREFER_NOT_TO_SAY' });

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
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || t('patients.create_error') || 'Failed to create patient'),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('patients.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('patients.total_count', { count: patients?.meta.total || 0 })}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                    <Plus className="w-4 h-4" /> {t('patients.add')}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card animate-slide-up">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('patients.new')}</h3>
                    <form
                        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <div><label className="label">{t('patients.first_name')} *</label><input className="input-field" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                        <div><label className="label">{t('patients.last_name')} *</label><input className="input-field" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                        <div><label className="label">{t('patients.phone')} *</label><input className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required /></div>
                        <div><label className="label">{t('patients.email')}</label><input type="email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                        <div><label className="label">{t('patients.date_of_birth')} *</label><input type="date" className="input-field" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} required /></div>
                        <div><label className="label">{t('patients.gender')}</label>
                            <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                <option value="MALE">{t('patients.male')}</option><option value="FEMALE">{t('patients.female')}</option><option value="OTHER">{t('patients.other')}</option><option value="PREFER_NOT_TO_SAY">{t('patients.prefer_not_to_say')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-2 justify-end">
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
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder={t('patients.search_placeholder')}
                    className="input-field pl-10"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {/* Patient Table */}
            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">{t('patients.loading')}</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('patients.table_patient')}</th>
                                <th>{t('patients.table_contact')}</th>
                                <th>{t('patients.table_dob')}</th>
                                <th>{t('patients.table_gender')}</th>
                                <th>{t('patients.table_appointments')}</th>
                                <th>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients?.data.map((patient: Patient) => (
                                <tr key={patient.id}>
                                    <td>
                                        <Link to={`/patients/${patient.id}`} className="flex items-center gap-3 group">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                {patient.firstName[0]}{patient.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                    {patient.firstName} {patient.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">ID: {patient.id.slice(0, 8)}...</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td>
                                        <div className="space-y-1">
                                            <p className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3" />{patient.phone}</p>
                                            {patient.email && <p className="flex items-center gap-1 text-xs text-gray-500"><Mail className="w-3 h-3" />{patient.email}</p>}
                                        </div>
                                    </td>
                                    <td className="text-sm">{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
                                    <td><span className="badge badge-neutral">{t(`patients.gender_${patient.gender.toLowerCase()}`)}</span></td>
                                    <td className="text-sm font-medium">{patient._count?.appointments || 0}</td>
                                    <td>
                                        <Link to={`/patients/${patient.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                            {t('patients.view_details')} →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!patients?.data || patients.data.length === 0) && (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('patients.no_patients')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {patients && patients.meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
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

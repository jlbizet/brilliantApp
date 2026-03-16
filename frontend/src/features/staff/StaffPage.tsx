import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Mail, Phone, Edit2, Trash2, Shield, User as UserIcon, Users, UserCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api';
import { User, UserRole } from '../../types';
import StaffForm from './components/StaffForm';
import { getErrorMessage } from '../../utils/errors';

const ROLE_CONFIG: Record<UserRole, { color: string; bg: string; gradient: string }> = {
    ADMIN: { 
        color: 'text-purple-700 dark:text-purple-400', 
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        gradient: 'from-purple-500 to-purple-600'
    },
    DENTIST: { 
        color: 'text-blue-700 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        gradient: 'from-blue-500 to-blue-600'
    },
    HYGIENIST: { 
        color: 'text-emerald-700 dark:text-emerald-400', 
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        gradient: 'from-emerald-500 to-emerald-600'
    },
    RECEPTIONIST: { 
        color: 'text-amber-700 dark:text-amber-400', 
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        gradient: 'from-amber-500 to-amber-600'
    },
};

export default function StaffPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data: staffResponse, isLoading } = useQuery({
        queryKey: ['staff', search],
        queryFn: () => usersApi.getAll({ search: search || undefined, limit: 100 }),
    });

    const createMutation = useMutation({
        mutationFn: usersApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success(t('staff.create_success') || 'Staff member created successfully');
            setShowForm(false);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, t('staff.create_error'))),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => usersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success(t('staff.update_success') || 'Staff updated successfully');
            setEditingUser(null);
            setShowForm(false);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, t('staff.update_error'))),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => usersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success(t('staff.delete_success') || 'Staff member deleted successfully');
        },
        onError: (err: any) => toast.error('Failed to delete staff member'),
    });

    const handleFormSubmit = (data: any) => {
        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('staff.delete_confirm') || 'Are you sure you want to delete this staff member?')) {
            deleteMutation.mutate(id);
        }
    };

    const totalStaff = staffResponse?.data.length || 0;
    const activeStaff = staffResponse?.data.filter((u: User) => u.isActive).length || 0;
    const dentists = staffResponse?.data.filter((u: User) => u.role === 'DENTIST').length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('staff.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('staff.manage_description')}</p>
                </div>
                <button
                    onClick={() => { setEditingUser(null); setShowForm(!showForm); }}
                    className="btn-primary group flex items-center gap-2"
                >
                    <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-3 h-3" />
                    </div>
                    {t('staff.add')}
                </button>
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
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStaff}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('staff.total_staff')}</p>
                        </div>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeStaff}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('staff.active_staff')}</p>
                        </div>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 dark:bg-blue-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{dentists}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('staff.dentists')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="card animate-slide-up !p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                            {editingUser ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                {editingUser ? t('staff.edit_title') : t('staff.new_title')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {editingUser ? t('staff.edit_description') : t('staff.form_description')}
                            </p>
                        </div>
                    </div>
                    <StaffForm
                        initialData={editingUser || undefined}
                        onSubmit={handleFormSubmit}
                        onCancel={() => { setShowForm(false); setEditingUser(null); }}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                    />
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder={t('staff.search_placeholder')}
                    className="input-field pl-11 pr-4 py-2.5 w-full rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Staff Table */}
            {isLoading ? (
                <div className="card text-center py-12 text-gray-500">{t('common.loading')}</div>
            ) : (
                <div className="card overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('staff.table_member')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('staff.table_role')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('staff.table_contact')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('staff.table_specialization')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('staff.table_status')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {staffResponse?.data.map((member: User) => {
                                    const roleConfig = ROLE_CONFIG[member.role];
                                    return (
                                        <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                        {member.firstName?.[0]}{member.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {member.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${roleConfig.bg} ${roleConfig.color}`}>
                                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${roleConfig.gradient}`} />
                                                    {t(`staff.role_${member.role.toLowerCase()}`)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm space-y-1">
                                                    <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                        <div className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                                            <Mail className="w-3 h-3 text-primary-600" />
                                                        </div>
                                                        {member.email}
                                                    </p>
                                                    {member.phone && (
                                                        <p className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                            <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                                <Phone className="w-3 h-3 text-gray-500" />
                                                            </div>
                                                            {member.phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {member.specialization || '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`badge ${member.isActive ? 'badge-success' : 'badge-neutral'} text-xs`}>
                                                    {member.isActive ? t('staff.status_active') : t('staff.status_inactive')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(member)}
                                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title={t('common.edit')}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.id)}
                                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {staffResponse?.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    <UserIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                                {t('staff.no_results')}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

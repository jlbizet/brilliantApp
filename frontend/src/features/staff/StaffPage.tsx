import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Mail, Phone, Edit2, Trash2, Shield, User as UserIcon, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api';
import { User, UserRole } from '../../types';
import StaffForm from './components/StaffForm';

const ROLE_COLORS: Record<UserRole, string> = {
    ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    DENTIST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    HYGIENIST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    RECEPTIONIST: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
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
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || 'Failed to create staff member'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => usersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success(t('staff.update_success') || 'Staff updated successfully');
            setEditingUser(null);
            setShowForm(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || 'Failed to update staff'),
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('staff.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('staff.manage_description')}</p>
                </div>
                <button
                    onClick={() => { setEditingUser(null); setShowForm(!showForm); }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" /> {t('staff.add')}
                </button>
            </div>

            {showForm && (
                <div className="card animate-slide-up">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                        {editingUser ? t('staff.edit_title') : t('staff.new_title')}
                    </h3>
                    <StaffForm
                        initialData={editingUser || undefined}
                        onSubmit={handleFormSubmit}
                        onCancel={() => { setShowForm(false); setEditingUser(null); }}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                    />
                </div>
            )}

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('staff.search_placeholder')}
                        className="input-field pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('staff.table_member')}</th>
                                <th>{t('staff.table_role')}</th>
                                <th>{t('staff.table_contact')}</th>
                                <th>{t('staff.table_specialization')}</th>
                                <th>{t('staff.table_status')}</th>
                                <th>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffResponse?.data.map((member: User) => (
                                <tr key={member.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {member.firstName} {member.lastName}
                                                </p>
                                                <p className="text-[10px] text-gray-400">ID: {member.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${ROLE_COLORS[member.role]}`}>
                                            {t(`staff.role_${member.role.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="text-xs space-y-0.5">
                                            <p className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                <Mail className="w-3 h-3" /> {member.email}
                                            </p>
                                            {member.phone && (
                                                <p className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                    <Phone className="w-3 h-3" /> {member.phone}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {member.specialization || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${member.isActive ? 'badge-success' : 'badge-neutral'}`}>
                                            {member.isActive ? t('staff.status_active') : t('staff.status_inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(member)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {staffResponse?.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                        {t('staff.no_results')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

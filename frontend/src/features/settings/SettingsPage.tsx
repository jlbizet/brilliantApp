import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore, useUIStore } from '../../stores';
import { usersApi } from '../../api';
import { Moon, Sun, User, Shield, Building2, Edit, X, Check, Lock } from 'lucide-react';

export default function SettingsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore();
    const { darkMode, toggleDarkMode } = useUIStore();
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [profileData, setProfileData] = useState({
        phone: user?.phone || '',
        specialization: user?.specialization || '',
        licenseNumber: user?.licenseNumber || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => usersApi.update(user!.id, data),
        onSuccess: (updatedUser) => {
            setUser({ ...user!, ...updatedUser });
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success(t('settings.update_success') || 'Profile updated successfully');
            setIsEditingProfile(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || t('settings.update_error') || 'Failed to update profile'),
    });

    const updatePasswordMutation = useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string }) =>
            usersApi.updatePassword(user!.id, data),
        onSuccess: () => {
            toast.success(t('settings.password_success') || 'Password updated successfully');
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || t('settings.password_error') || 'Failed to update password'),
    });

    const handleProfileSave = () => {
        updateProfileMutation.mutate(profileData);
    };

    const handlePasswordSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error(t('settings.passwords_dont_match') || 'Passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error(t('settings.password_too_short') || 'Password must be at least 6 characters');
            return;
        }
        updatePasswordMutation.mutate({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        });
    };

    const handleCancelEdit = () => {
        setProfileData({
            phone: user?.phone || '',
            specialization: user?.specialization || '',
            licenseNumber: user?.licenseNumber || '',
        });
        setIsEditingProfile(false);
    };

    return (
        <div className="space-y-8 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">{t('settings.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('settings.subtitle')}</p>
                </div>
            </div>

            {/* Profile */}
            <div className="card overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.profile')}</h3>
                    </div>
                    {!isEditingProfile ? (
                        <button
                            onClick={() => setIsEditingProfile(true)}
                            className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Edit Profile"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancelEdit}
                                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Cancel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleProfileSave}
                                disabled={updateProfileMutation.isPending}
                                className="p-2.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                                title="Save Changes"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-6 mb-6 p-4 bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent rounded-2xl">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-primary-500/30">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                        <p className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{user?.firstName} {user?.lastName}</p>
                        <p className="text-gray-500 flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            {user?.email}
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-semibold rounded-full shadow-md shadow-primary-500/25">
                            {user?.role}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {isEditingProfile ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{t('settings.label_phone')}</label>
                                <input
                                    type="tel"
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-primary-500/30 transition-all duration-200"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    placeholder={t('common.phone')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{t('settings.label_specialization')}</label>
                                <input
                                    type="text"
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-primary-500/30 transition-all duration-200"
                                    value={profileData.specialization}
                                    onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                                    placeholder={t('settings.label_specialization')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{t('settings.label_license')}</label>
                                <input
                                    type="text"
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-primary-500/30 transition-all duration-200"
                                    value={profileData.licenseNumber}
                                    onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                                    placeholder={t('settings.label_license')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{t('settings.label_last_login')}</label>
                                <p className="font-medium text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('common.not_applicable')}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {[ 
                                [t('settings.label_phone'), user?.phone || t('common.not_set')],
                                [t('settings.label_specialization'), user?.specialization || t('common.not_applicable')],
                                [t('settings.label_license'), user?.licenseNumber || t('common.not_applicable')],
                                [t('settings.label_last_login'), user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('common.not_applicable')],
                            ].map(([label, value]) => (
                                <div key={label as string} className="p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl">
                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Appearance */}
            <div className="card overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-violet-500" />
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${darkMode ? 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/25' : 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/25'}`}>
                        {darkMode ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.appearance')}</h3>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">{t('settings.dark_mode')}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{t('settings.dark_mode_subtitle')}</p>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className={`relative w-16 h-9 rounded-full transition-colors duration-300 shadow-inner ${darkMode ? 'bg-violet-600' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-transform duration-300 flex items-center justify-center ${darkMode ? 'translate-x-8' : 'translate-x-1'}`}>
                            {darkMode ? <Moon className="w-4 h-4 text-violet-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
                        </div>
                    </button>
                </div>
            </div>

            {/* Security */}
            <div className="card overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.security')}</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-emerald-100/30 dark:from-emerald-900/20 dark:to-emerald-900/10 hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                                <Lock className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{t('settings.change_password')}</p>
                                <p className="text-sm text-gray-500 mt-0.5">{t('settings.change_password_subtitle')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            {t('common.edit')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Clinic Info */}
            <div className="card overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-500" />
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.clinic_info')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                        [t('settings.clinic_name'), 'BrilliantSmile Dental'],
                        [t('common.address'), '123 Healthcare Ave, Suite 100'],
                        [t('common.phone'), '+1 (555) 000-1234'],
                        [t('common.email'), 'info@brilliantsmile.com'],
                    ].map(([label, value]) => (
                        <div key={label as string} className="p-4 bg-gradient-to-r from-sky-50/50 to-sky-100/30 dark:from-sky-900/20 dark:to-sky-900/10 rounded-xl hover:shadow-md transition-all duration-300">
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl shadow-black/20 animate-slide-up overflow-hidden relative">
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                    <Lock className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('settings.change_password')}
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="p-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordSave} className="space-y-5">
                            <div className="space-y-2">
                                <label className="label text-sm font-semibold text-gray-700 dark:text-gray-300">{t('settings.current_password')}</label>
                                <input
                                    type="password"
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="label text-sm font-semibold text-gray-700 dark:text-gray-300">{t('settings.new_password')}</label>
                                <input
                                    type="password"
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                                <p className="text-xs text-gray-500">Minimum 6 characters</p>
                            </div>
                            <div className="space-y-2">
                                <label className="label text-sm font-semibold text-gray-700 dark:text-gray-300">{t('settings.confirm_password')}</label>
                                <input
                                    type="password"
                                    className="input-field bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="btn-secondary flex-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatePasswordMutation.isPending}
                                    className="btn-primary flex-1 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300"
                                >
                                    {updatePasswordMutation.isPending ? t('common.saving') : t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

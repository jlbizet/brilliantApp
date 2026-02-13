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
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
                <p className="text-gray-500 text-sm mt-1">{t('settings.subtitle')}</p>
            </div>

            {/* Profile */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.profile')}</h3>
                    </div>
                    {!isEditingProfile ? (
                        <button
                            onClick={() => setIsEditingProfile(true)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancelEdit}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleProfileSave}
                                disabled={updateProfileMutation.isPending}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                        <p className="text-gray-500">{user?.email}</p>
                        <span className="badge badge-info mt-1">{user?.role}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {isEditingProfile ? (
                        <>
                            <div>
                                <p className="text-gray-500 text-xs mb-1">{t('settings.label_phone')}</p>
                                <input
                                    type="tel"
                                    className="input-field"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    placeholder={t('common.phone')}
                                />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs mb-1">{t('settings.label_specialization')}</p>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profileData.specialization}
                                    onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                                    placeholder={t('settings.label_specialization')}
                                />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs mb-1">{t('settings.label_license')}</p>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profileData.licenseNumber}
                                    onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                                    placeholder={t('settings.label_license')}
                                />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs mb-1">{t('settings.label_last_login')}</p>
                                <p className="font-medium text-gray-900 dark:text-white py-2">
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
                                <div key={label as string}>
                                    <p className="text-gray-500 text-xs mb-1">{label}</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Appearance */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    {darkMode ? <Moon className="w-5 h-5 text-violet-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.appearance')}</h3>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{t('settings.dark_mode')}</p>
                        <p className="text-sm text-gray-500">{t('settings.dark_mode_subtitle')}</p>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            </div>

            {/* Security */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.security')}</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{t('settings.change_password')}</p>
                                <p className="text-sm text-gray-500">{t('settings.change_password_subtitle')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="btn-secondary text-sm !py-2"
                        >
                            {t('common.edit')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Clinic Info */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-sky-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.clinic_info')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                        [t('settings.clinic_name'), 'BrilliantSmile Dental'],
                        [t('common.address'), '123 Healthcare Ave, Suite 100'],
                        [t('common.phone'), '+1 (555) 000-1234'],
                        [t('common.email'), 'info@brilliantsmile.com'],
                    ].map(([label, value]) => (
                        <div key={label as string}>
                            <p className="text-gray-500 text-xs mb-1">{label}</p>
                            <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {t('settings.change_password')}
                            </h3>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordSave} className="space-y-4">
                            <div>
                                <label className="label">{t('settings.current_password')}</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">{t('settings.new_password')}</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="label">{t('settings.confirm_password')}</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatePasswordMutation.isPending}
                                    className="btn-primary flex-1"
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

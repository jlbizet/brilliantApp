import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from '../../stores';
import { Moon, Sun, User, Shield, Bell, Building2 } from 'lucide-react';

export default function SettingsPage() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { darkMode, toggleDarkMode } = useUIStore();

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
                <p className="text-gray-500 text-sm mt-1">{t('settings.subtitle')}</p>
            </div>

            {/* Profile */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.profile')}</h3>
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
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">{t('settings.two_factor')}</p>
                            <p className="text-sm text-gray-500">{t('settings.two_factor_subtitle')}</p>
                        </div>
                        <span className="badge badge-warning">{t('settings.not_enabled')}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">{t('settings.change_password')}</p>
                            <p className="text-sm text-gray-500">{t('settings.change_password_subtitle')}</p>
                        </div>
                        <button className="btn-secondary text-sm !py-2">{t('common.edit')}</button>
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
        </div>
    );
}

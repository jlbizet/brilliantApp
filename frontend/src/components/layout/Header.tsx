import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Moon, Sun, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from '../../stores';
import { authApi, notificationsApi } from '../../api';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
    const { user, setUser } = useAuthStore();
    const { darkMode, toggleDarkMode } = useUIStore();
    const { t } = useTranslation();

    // Fetch profile on mount
    useEffect(() => {
        if (!user) {
            authApi.getProfile().then(setUser).catch(() => { });
        }
    }, [user, setUser]);

    const { data: unreadCount } = useQuery({
        queryKey: ['unread-notifications'],
        queryFn: notificationsApi.getUnreadCount,
        refetchInterval: 30000,
    });

    return (
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-20">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        className="input-field pl-10 bg-gray-50 dark:bg-gray-800/50 border-transparent
              focus:bg-white dark:focus:bg-gray-800 focus:border-primary-300"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <button
                    onClick={toggleDarkMode}
                    className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    title={darkMode ? t('settings.light_mode') : t('settings.dark_mode')}
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                    <Bell className="w-5 h-5" />
                    {unreadCount && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {user && (
                    <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-200 dark:border-gray-700">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

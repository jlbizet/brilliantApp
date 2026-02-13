import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Search, Check, Trash2, Calendar, X, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from '../../stores';
import { authApi, notificationsApi } from '../../api';
import type { Notification } from '../../types';
import LanguageSwitcher from './LanguageSwitcher';
import { useNotificationsSocket } from '../../hooks/useNotificationsSocket';

export default function Header() {
    const { user, setUser } = useAuthStore();
    const { darkMode, toggleDarkMode } = useUIStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    
    // Initialize WebSocket connection for real-time notifications
    useNotificationsSocket();

    // Fetch profile on mount
    useEffect(() => {
        if (!user) {
            authApi.getProfile().then(setUser).catch(() => { });
        }
    }, [user, setUser]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { data: unreadCount } = useQuery({
        queryKey: ['unread-notifications'],
        queryFn: notificationsApi.getUnreadCount,
        refetchInterval: 30000,
    });

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationsApi.getAll,
        refetchInterval: 60000,
        enabled: showNotifications,
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationsApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: notificationsApi.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
        },
    });

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'APPOINTMENT_REMINDER':
                return <Calendar className="w-4 h-4 text-primary-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-400" />;
        }
    };

    const formatNotificationTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

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

                {/* Notification Bell with Dropdown */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount && unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Notifications
                                </h3>
                                {unreadCount && unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllReadMutation.mutate()}
                                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                    >
                                        <Check className="w-4 h-4" />
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {!notifications || notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((notification: Notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                                            className={`p-4 border-b border-gray-50 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                                                !notification.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${
                                                        !notification.isRead 
                                                            ? 'text-gray-900 dark:text-white' 
                                                            : 'text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatNotificationTime(notification.createdAt)}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* View All Link */}
                            <div 
                                className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => {
                                    setShowNotifications(false);
                                    navigate('/notifications');
                                }}
                            >
                                <div className="flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm">
                                    View all notifications
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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

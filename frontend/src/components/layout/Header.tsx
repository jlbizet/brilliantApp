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
        <header className="h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm shadow-gray-200/50 dark:shadow-black/20">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        className="input-field pl-10 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border-transparent
              focus:bg-white dark:focus:bg-gray-800 focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 shadow-sm"
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
                        className={`relative p-2.5 rounded-xl transition-all duration-300 ${showNotifications 
                            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 shadow-md' 
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'}`}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount && unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-gray-500/20 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animate-slide-up">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-primary-500" />
                                    Notifications
                                </h3>
                                {unreadCount && unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllReadMutation.mutate()}
                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all"
                                    >
                                        <Check className="w-4 h-4" />
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {!notifications || notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Bell className="w-8 h-8 text-primary-400" />
                                        </div>
                                        <p className="font-medium text-gray-500">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((notification: Notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                                            className={`p-4 border-b border-gray-50 dark:border-gray-800 cursor-pointer transition-all duration-200 hover:shadow-inner ${
                                                !notification.isRead 
                                                    ? 'bg-gradient-to-r from-primary-50/80 to-white dark:from-primary-900/20 dark:to-gray-900/50' 
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        notification.type === 'APPOINTMENT_REMINDER' 
                                                            ? 'bg-gradient-to-br from-primary-400 to-primary-500 shadow-md shadow-primary-500/25' 
                                                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                                    }`}>
                                                        {notification.type === 'APPOINTMENT_REMINDER' 
                                                            ? <Calendar className="w-4 h-4 text-white" />
                                                            : <Bell className="w-4 h-4 text-white" />
                                                        }
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold ${
                                                        !notification.isRead 
                                                            ? 'text-gray-900 dark:text-white' 
                                                            : 'text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-400 mt-1.5">
                                                        {formatNotificationTime(notification.createdAt)}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full mt-2 flex-shrink-0 animate-pulse shadow-sm shadow-primary-500/50" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* View All Link */}
                            <div 
                                className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 cursor-pointer hover:from-primary-50 hover:to-primary-100/30 dark:hover:from-primary-900/20 dark:hover:to-primary-900/10 transition-all duration-300"
                                onClick={() => {
                                    setShowNotifications(false);
                                    navigate('/notifications');
                                }}
                            >
                                <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:gap-3 transition-all duration-200">
                                    View all notifications
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {user && (
                    <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/30">
                            {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                {user.role}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

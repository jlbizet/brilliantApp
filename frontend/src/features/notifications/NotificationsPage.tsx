import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Trash2, Calendar, Filter, X, Clock } from 'lucide-react';
import { notificationsApi } from '../../api';
import type { Notification } from '../../types';
import { useNotificationsSocket } from '../../hooks/useNotificationsSocket';

const NOTIFICATION_TYPES = [
    { value: 'ALL', label: 'All' },
    { value: 'APPOINTMENT_REMINDER', label: 'Appointments' },
    { value: 'PAYMENT_DUE', label: 'Payments' },
    { value: 'TREATMENT_UPDATE', label: 'Treatments' },
    { value: 'SYSTEM', label: 'System' },
    { value: 'GENERAL', label: 'General' },
];

export default function NotificationsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { markAsRead: socketMarkAsRead } = useNotificationsSocket();
    const [filter, setFilter] = useState('ALL');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationsApi.getAll,
        refetchInterval: 30000,
    });

    const { data: unreadCount } = useQuery({
        queryKey: ['unread-notifications'],
        queryFn: notificationsApi.getUnreadCount,
        refetchInterval: 10000,
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

    const handleMarkAsRead = (notification: Notification) => {
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification.id);
            socketMarkAsRead(notification.id);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'APPOINTMENT_REMINDER':
                return <Calendar className="w-5 h-5 text-primary-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-400" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const filteredNotifications = notifications?.filter((notification: Notification) => {
        if (showUnreadOnly && notification.isRead) return false;
        if (filter !== 'ALL' && notification.type !== filter) return false;
        return true;
    });

    const unreadNotifications = notifications?.filter((n: Notification) => !n.isRead) || [];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        Notifications
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {unreadCount ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                                <span className="font-medium text-primary-600">{unreadCount} unread</span>
                            </span>
                        ) : 'No new notifications'}
                    </p>
                </div>
                {unreadNotifications.length > 0 && (
                    <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 p-1">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-900/10 rounded-xl">
                        <Filter className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">Filter</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {NOTIFICATION_TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setFilter(type.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    filter === type.value
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-0.5'
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${showUnreadOnly ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${showUnreadOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                            <span className="font-medium">Unread only</span>
                        </label>
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={(e) => setShowUnreadOnly(e.target.checked)}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="card text-center py-16">
                        <div className="animate-pulse flex flex-col items-center">
                            <Bell className="w-12 h-12 mb-4 text-gray-300" />
                            <div className="space-y-3 w-full max-w-md">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : filteredNotifications?.length === 0 ? (
                    <div className="card text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="w-12 h-12 text-primary-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No notifications
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            {showUnreadOnly 
                                ? "You've read all your notifications!" 
                                : filter !== 'ALL' 
                                    ? `No ${filter.toLowerCase().replace('_', ' ')} notifications found.`
                                    : "You don't have any notifications yet."}
                        </p>
                    </div>
                ) : (
                    filteredNotifications?.map((notification: Notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleMarkAsRead(notification)}
                            className={`group card p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden ${
                                !notification.isRead 
                                    ? 'bg-gradient-to-r from-primary-50/80 to-white dark:from-primary-900/20 dark:to-gray-900/50 border-l-4 border-l-primary-500' 
                                    : 'border-l-4 border-l-transparent hover:border-l-gray-300 dark:hover:border-l-gray-600'
                            }`}
                        >
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        notification.type === 'APPOINTMENT_REMINDER' 
                                            ? 'bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg shadow-primary-500/25' 
                                            : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg shadow-gray-500/25'
                                    }`}>
                                        {notification.type === 'APPOINTMENT_REMINDER' 
                                            ? <Calendar className="w-5 h-5 text-white" />
                                            : <Bell className="w-5 h-5 text-white" />
                                        }
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <h3 className={`text-lg font-semibold ${
                                                !notification.isRead 
                                                    ? 'text-gray-900 dark:text-white' 
                                                    : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                                {notification.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs font-medium text-gray-400 mt-2 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(notification.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!notification.isRead && (
                                                <div className="w-3 h-3 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex-shrink-0 animate-pulse shadow-lg shadow-primary-500/50" />
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 hover:shadow-md"
                                                title="Dismiss"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Trash2, Calendar, Filter, X } from 'lucide-react';
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Notifications
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {unreadCount ? `${unreadCount} unread` : 'No new notifications'}
                    </p>
                </div>
                {unreadNotifications.length > 0 && (
                    <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {NOTIFICATION_TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setFilter(type.value)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    filter === type.value
                                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showUnreadOnly}
                                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            Unread only
                        </label>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="card text-center py-12">
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                            ))}
                        </div>
                    </div>
                ) : filteredNotifications?.length === 0 ? (
                    <div className="card text-center py-16">
                        <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No notifications
                        </h3>
                        <p className="text-gray-500">
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
                            className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                                !notification.isRead 
                                    ? 'bg-primary-50/30 dark:bg-primary-900/10 border-l-4 border-l-primary-500' 
                                    : 'border-l-4 border-l-transparent'
                            }`}
                        >
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className={`font-semibold ${
                                                !notification.isRead 
                                                    ? 'text-gray-900 dark:text-white' 
                                                    : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                                {notification.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {formatTime(notification.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!notification.isRead && (
                                                <div className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0" />
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Could add delete functionality here
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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

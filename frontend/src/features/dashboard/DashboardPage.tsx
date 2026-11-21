import { useState, useMemo, memo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, Receipt, Package, TrendingUp, Activity, AlertTriangle, ArrowUpRight, Filter, X, ChevronDown, DollarSign, BarChart3, CalendarRange, PieChart as PieChartIcon, UserPlus, History, CheckCircle2, Clock, FileEdit, LogIn, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { analyticsApi } from '../../api';
import { useAuthStore } from '../../stores';
import { DatePicker } from '../../components/ui';
import { getDateLocale } from '../../utils/dateLocale';

const COLORS = ['#338dfc', '#22c55e', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9'];

// Type for Lucide icons
type IconType = React.ComponentType<{ className?: string }>;

// Quick filter options
const QUICK_FILTERS = [
    { labelKey: 'dashboard.quick_today', days: 0 },
    { labelKey: 'dashboard.quick_last_7_days', days: 7 },
    { labelKey: 'dashboard.quick_last_30_days', days: 30 },
    { labelKey: 'dashboard.quick_this_month', type: 'month' as const },
    { labelKey: 'dashboard.quick_last_3_months', months: 3 },
    { labelKey: 'dashboard.quick_this_year', type: 'year' as const },
];

// Memoized Revenue Chart component
interface RevenueChartProps {
    data: Array<{ month: string; revenue: number }> | undefined;
}

const RevenueChart = memo(function RevenueChart({ data }: RevenueChartProps) {
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#338dfc" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#338dfc" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#9ca3af' }} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                />
                <YAxis 
                    tick={{ fontSize: 11, fill: '#9ca3af' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
                    dx={-10}
                />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                        padding: '12px'
                    }}
                    formatter={(v: any) => [`$${v.toLocaleString()}`, 'Revenue']}
                    labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#338dfc" 
                    strokeWidth={3} 
                    fill="url(#revenueGrad)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#338dfc' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
});

// Revenue Summary Cards
interface RevenueSummaryProps {
    data: Array<{ month: string; revenue: number }> | undefined;
}

const RevenueSummary = memo(function RevenueSummary({ data }: RevenueSummaryProps) {
    const { t } = useTranslation();
    const summary = useMemo(() => {
        if (!data || data.length === 0) return { total: 0, average: 0, count: 0 };
        const total = data.reduce((sum, item) => sum + item.revenue, 0);
        return {
            total,
            average: Math.round(total / data.length),
            count: data.length
        };
    }, [data]);

    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl p-4 border border-primary-100 dark:border-primary-800/30">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('dashboard.total_revenue')}</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">${summary.total.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('dashboard.average')}</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">${summary.average.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10 rounded-xl p-4 border border-violet-100 dark:border-violet-800/30">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <CalendarRange className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('dashboard.periods')}</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.count}</p>
            </div>
        </div>
    );
});

// Modern Revenue Filter with Quick Options
interface RevenueFilterProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onApply: () => void;
    onClear: () => void;
    isActive: boolean;
    onQuickFilter: (filter: typeof QUICK_FILTERS[0]) => void;
}

const RevenueFilter = memo(function RevenueFilter({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onApply,
    onClear,
    isActive,
    onQuickFilter,
}: RevenueFilterProps) {
    const { t } = useTranslation();
    const canApply = startDate && endDate;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-1.5">
                {QUICK_FILTERS.slice(0, 4).map((filter) => (
                    <button
                        key={filter.labelKey}
                        onClick={() => onQuickFilter(filter)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        {t(filter.labelKey)}
                    </button>
                ))}
            </div>
            
            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700" />
            
            {/* Custom Date Range */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1">
                    <DatePicker
                        value={startDate}
                        onChange={onStartDateChange}
                        className="bg-transparent border-0 py-1.5 text-sm w-32"
                    />
                    <span className="text-gray-400 text-sm">→</span>
                    <DatePicker
                        value={endDate}
                        onChange={onEndDateChange}
                        className="bg-transparent border-0 py-1.5 text-sm w-32"
                    />
                </div>
                
                <div className="flex items-center gap-1">
                    <button
                        onClick={onApply}
                        disabled={!canApply}
                        className="btn-primary py-1.5 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('dashboard.filter_apply')}
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    {isActive ? (
                        <button
                            onClick={onClear}
                            className="btn-secondary py-1.5 px-3 text-sm"
                            title={t('dashboard.filter_clear')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
});

// Appointment Status Components
const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: IconType }> = {
    SCHEDULED: { color: '#338dfc', bgColor: 'bg-blue-50 dark:bg-blue-900/20', icon: Calendar },
    CONFIRMED: { color: '#22c55e', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
    IN_PROGRESS: { color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
    COMPLETED: { color: '#8b5cf6', bgColor: 'bg-violet-50 dark:bg-violet-900/20', icon: CheckCircle2 },
    CANCELLED: { color: '#ef4444', bgColor: 'bg-red-50 dark:bg-red-900/20', icon: X },
    NO_SHOW: { color: '#6b7280', bgColor: 'bg-gray-50 dark:bg-gray-800', icon: AlertTriangle },
};

interface AppointmentStatusSummaryProps {
    data: Array<{ name: string; value: number }>;
}

const AppointmentStatusSummary = memo(function AppointmentStatusSummary({ data }: AppointmentStatusSummaryProps) {
    const { t } = useTranslation();
    const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
    const completed = useMemo(() => data.find(d => d.name.toLowerCase().includes('completed'))?.value || 0, [data]);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <PieChartIcon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('dashboard.total')}</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{total}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('dashboard.completion')}</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{completionRate}%</p>
            </div>
        </div>
    );
});

// Patient Growth Components
interface PatientGrowthSummaryProps {
    data: Array<{ month: string; newPatients: number }> | undefined;
}

const PatientGrowthSummary = memo(function PatientGrowthSummary({ data }: PatientGrowthSummaryProps) {
    const { t } = useTranslation();
    const summary = useMemo(() => {
        if (!data || data.length === 0) return { total: 0, average: 0, thisMonth: 0 };
        const total = data.reduce((sum, item) => sum + item.newPatients, 0);
        const thisMonth = data[data.length - 1]?.newPatients || 0;
        return {
            total,
            average: Math.round(total / data.length),
            thisMonth
        };
    }, [data]);

    return (
        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <UserPlus className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{t('dashboard.total')}</span>
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{summary.total}</p>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-900/20 dark:to-sky-800/10 rounded-xl p-3 border border-sky-100 dark:border-sky-800/30">
                <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <BarChart3 className="w-3 h-3 text-sky-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{t('dashboard.avg')}</span>
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{summary.average}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10 rounded-xl p-3 border border-violet-100 dark:border-violet-800/30">
                <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-violet-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{t('dashboard.this_month')}</span>
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{summary.thisMonth}</p>
            </div>
        </div>
    );
});

// Recent Activity Components
const ACTIVITY_ICONS: Record<string, IconType> = {
    LOGIN: LogIn,
    CREATE: FileEdit,
    UPDATE: FileEdit,
    DELETE: Trash2,
};

const ACTIVITY_COLORS: Record<string, string> = {
    LOGIN: 'bg-emerald-500',
    CREATE: 'bg-primary-500',
    UPDATE: 'bg-amber-500',
    DELETE: 'bg-red-500',
};

interface ActivityItemProps {
    activity: any;
}

const ActivityItem = memo(function ActivityItem({ activity }: ActivityItemProps) {
    const { t, i18n } = useTranslation();
    const Icon = ACTIVITY_ICONS[activity.action] || FileEdit;
    const colorClass = ACTIVITY_COLORS[activity.action] || 'bg-gray-400';
    const timeAgo = format(new Date(activity.createdAt), 'MMM d, h:mm a', { locale: getDateLocale(i18n.language) });

    return (
        <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
            <div className={`w-8 h-8 rounded-lg ${colorClass}/10 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {activity.user?.firstName} {activity.user?.lastName}
                    </span>
                    <span className="text-gray-500"> {t(`dashboard.activity_${String(activity.action).toLowerCase()}`, { defaultValue: String(activity.action).toLowerCase() })} </span>
                    <span className="font-medium">{activity.entity}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
            </div>
        </div>
    );
});

export default function DashboardPage() {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedStartDate, setAppliedStartDate] = useState('');
    const [appliedEndDate, setAppliedEndDate] = useState('');

    // Derived state - computed during render, not stored in useState
    const dateFilterActive = Boolean(appliedStartDate && appliedEndDate);

    const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: analyticsApi.getDashboard });
    const { data: revenueChart } = useQuery({
        queryKey: ['revenue-chart', dateFilterActive, appliedStartDate, appliedEndDate],
        queryFn: () => {
            if (dateFilterActive) {
                return analyticsApi.getRevenueChart(undefined, appliedStartDate, appliedEndDate);
            }
            return analyticsApi.getRevenueChart(12);
        },
    });
    const { data: patientGrowth } = useQuery({ queryKey: ['patient-growth'], queryFn: () => analyticsApi.getPatientGrowth(12) });
    const { data: appointmentStats } = useQuery({ queryKey: ['appointment-stats'], queryFn: analyticsApi.getAppointmentStats });
    const { data: recentActivity } = useQuery({ queryKey: ['recent-activity'], queryFn: analyticsApi.getRecentActivity });

    const handleApplyFilter = useCallback(() => {
        if (startDate && endDate) {
            setAppliedStartDate(startDate);
            setAppliedEndDate(endDate);
        }
    }, [startDate, endDate]);

    const handleClearFilter = useCallback(() => {
        setStartDate('');
        setEndDate('');
        setAppliedStartDate('');
        setAppliedEndDate('');
    }, []);

    const handleQuickFilter = useCallback((filter: typeof QUICK_FILTERS[0]) => {
        const today = new Date();
        let start: Date;
        let end: Date = today;

        if ('days' in filter && filter.days !== undefined) {
            if (filter.days === 0) {
                // Today
                start = today;
                end = today;
            } else {
                start = subDays(today, filter.days);
            }
        } else if ('months' in filter && filter.months !== undefined) {
            start = subMonths(today, filter.months);
        } else if (filter.type === 'month') {
            start = startOfMonth(today);
            end = endOfMonth(today);
        } else if (filter.type === 'year') {
            start = startOfYear(today);
        } else {
            start = subDays(today, 30);
        }

        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        setStartDate(startStr);
        setEndDate(endStr);
        setAppliedStartDate(startStr);
        setAppliedEndDate(endStr);
    }, []);

    const isHygienist = user?.role === 'HYGIENIST';
    const canViewRevenue = ['ADMIN', 'RECEPTIONIST'].includes(user?.role as string);

    // Memoize stat cards to prevent recreation on every render
    const statCards = useMemo(() => [
        { label: t('dashboard.stat_total_patients'), value: stats?.totalPatients || 0, icon: Users, color: 'from-primary-500 to-primary-600', bgGlow: 'bg-primary-50 dark:bg-primary-950/20' },
        { label: t('dashboard.stat_today_appointments'), value: stats?.todayAppointments || 0, icon: Calendar, color: 'from-emerald-500 to-emerald-600', bgGlow: 'bg-emerald-50 dark:bg-emerald-950/20' },
        { label: t('dashboard.stat_monthly_revenue'), value: `$${(stats?.monthRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'from-amber-500 to-amber-600', bgGlow: 'bg-amber-50 dark:bg-amber-950/20', hide: isHygienist },
        { label: t('dashboard.stat_pending_invoices'), value: stats?.pendingInvoices || 0, icon: Receipt, color: 'from-violet-500 to-violet-600', bgGlow: 'bg-violet-50 dark:bg-violet-950/20', hide: isHygienist },
        { label: t('dashboard.stat_month_appointments'), value: stats?.monthAppointments || 0, icon: Activity, color: 'from-sky-500 to-sky-600', bgGlow: 'bg-sky-50 dark:bg-sky-950/20' },
        { label: t('dashboard.stat_low_stock'), value: stats?.lowStockItems || 0, icon: AlertTriangle, color: 'from-rose-500 to-rose-600', bgGlow: 'bg-rose-50 dark:bg-rose-950/20' },
    ].filter(card => !card.hide), [stats, isHygienist, t]);

    // Memoize pie data transformation
    const pieData = useMemo(() =>
        appointmentStats?.byStatus?.map((s: any) => ({
            name: t(`appointments.${s.status.toLowerCase()}`), value: s._count,
        })) || [],
        [appointmentStats, t]
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('dashboard.welcome')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer !p-5`}>
                        {/* Background gradient glow */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 ${card.bgGlow} rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity`} />
                        
                        <div className="relative flex items-center justify-between mb-4">
                            <div className={`w-11 h-11 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                            </div>
                        </div>
                        
                        <div className="relative">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{card.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className={`grid grid-cols-1 ${canViewRevenue ? 'lg:grid-cols-3' : ''} gap-6`}>
                {/* Revenue Chart */}
                {canViewRevenue ? (
                    <div className="lg:col-span-2 card !p-6">
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.revenue_overview')}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        {dateFilterActive 
                                            ? `${format(new Date(appliedStartDate), 'MMM d, yyyy', { locale: getDateLocale(i18n.language) })} - ${format(new Date(appliedEndDate), 'MMM d, yyyy', { locale: getDateLocale(i18n.language) })}`
                                            : t('dashboard.last_12_months')
                                        }
                                    </p>
                                </div>
                            </div>
                            <RevenueFilter
                                startDate={startDate}
                                endDate={endDate}
                                onStartDateChange={setStartDate}
                                onEndDateChange={setEndDate}
                                onApply={handleApplyFilter}
                                onClear={handleClearFilter}
                                isActive={dateFilterActive}
                                onQuickFilter={handleQuickFilter}
                            />
                        </div>
                        <RevenueSummary data={revenueChart} />
                        <RevenueChart data={revenueChart} />
                    </div>
                ) : null}

                {/* Appointment Status Pie */}
                <div className="card !p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.appointment_status')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.current_distribution')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                            <PieChartIcon className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <AppointmentStatusSummary data={pieData} />
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie 
                                data={pieData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={55} 
                                outerRadius={85} 
                                paddingAngle={3} 
                                dataKey="value"
                            >
                                {pieData.map((entry: any, i: number) => {
                                    const statusKey = Object.keys(STATUS_CONFIG).find(key => 
                                        entry.name.toLowerCase().includes(key.toLowerCase())
                                    ) || 'SCHEDULED';
                                    return <Cell key={i} fill={STATUS_CONFIG[statusKey]?.color || COLORS[i % COLORS.length]} />;
                                })}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                    padding: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {pieData.slice(0, 4).map((entry: any, i: number) => {
                            const statusKey = Object.keys(STATUS_CONFIG).find(key => 
                                entry.name.toLowerCase().includes(key.toLowerCase())
                            ) || 'SCHEDULED';
                            const config = STATUS_CONFIG[statusKey];
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <div 
                                        className="w-2.5 h-2.5 rounded-full" 
                                        style={{ backgroundColor: config?.color || COLORS[i % COLORS.length] }}
                                    />
                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {entry.name}: <span className="font-semibold">{entry.value}</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Growth */}
                <div className="card !p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.patient_growth')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.new_patients_per_month')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <PatientGrowthSummary data={patientGrowth} />
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={patientGrowth || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                            <XAxis 
                                dataKey="month" 
                                tick={{ fontSize: 10, fill: '#9ca3af' }} 
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis 
                                tick={{ fontSize: 10, fill: '#9ca3af' }} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                    padding: '12px'
                                }}
                                formatter={(v: any) => [t('dashboard.patients_count', { count: v }), t('dashboard.new_patients')]}
                            />
                            <Bar 
                                dataKey="newPatients" 
                                fill="url(#patientGradient)" 
                                radius={[8, 8, 0, 0]}
                                maxBarSize={40}
                            />
                            <defs>
                                <linearGradient id="patientGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Activity */}
                <div className="card !p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.recent_activity')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.latest_system_actions')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <History className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                        {(recentActivity || []).slice(0, 10).map((activity: any) => (
                            <ActivityItem key={activity.id} activity={activity} />
                        ))}
                        {(!recentActivity || recentActivity.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                    <History className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.no_activity')}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

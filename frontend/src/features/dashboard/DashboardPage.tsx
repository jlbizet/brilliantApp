import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, Receipt, Package, TrendingUp, Activity, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi } from '../../api';

const COLORS = ['#338dfc', '#22c55e', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9'];

export default function DashboardPage() {
    const { t } = useTranslation();
    const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: analyticsApi.getDashboard });
    const { data: revenueChart } = useQuery({ queryKey: ['revenue-chart'], queryFn: () => analyticsApi.getRevenueChart(12) });
    const { data: patientGrowth } = useQuery({ queryKey: ['patient-growth'], queryFn: () => analyticsApi.getPatientGrowth(12) });
    const { data: appointmentStats } = useQuery({ queryKey: ['appointment-stats'], queryFn: analyticsApi.getAppointmentStats });
    const { data: recentActivity } = useQuery({ queryKey: ['recent-activity'], queryFn: analyticsApi.getRecentActivity });

    const statCards = [
        { label: t('dashboard.stat_total_patients'), value: stats?.totalPatients || 0, icon: Users, color: 'from-primary-500 to-primary-600', bgGlow: 'bg-primary-50 dark:bg-primary-950/20' },
        { label: t('dashboard.stat_today_appointments'), value: stats?.todayAppointments || 0, icon: Calendar, color: 'from-emerald-500 to-emerald-600', bgGlow: 'bg-emerald-50 dark:bg-emerald-950/20' },
        { label: t('dashboard.stat_monthly_revenue'), value: `$${(stats?.monthRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'from-amber-500 to-amber-600', bgGlow: 'bg-amber-50 dark:bg-amber-950/20' },
        { label: t('dashboard.stat_pending_invoices'), value: stats?.pendingInvoices || 0, icon: Receipt, color: 'from-violet-500 to-violet-600', bgGlow: 'bg-violet-50 dark:bg-violet-950/20' },
        { label: t('dashboard.stat_month_appointments'), value: stats?.monthAppointments || 0, icon: Activity, color: 'from-sky-500 to-sky-600', bgGlow: 'bg-sky-50 dark:bg-sky-950/20' },
        { label: t('dashboard.stat_low_stock'), value: stats?.lowStockItems || 0, icon: AlertTriangle, color: 'from-rose-500 to-rose-600', bgGlow: 'bg-rose-50 dark:bg-rose-950/20' },
    ];

    const pieData = appointmentStats?.byStatus?.map((s: any) => ({
        name: t(`appointments.${s.status.toLowerCase()}`), value: s._count,
    })) || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('dashboard.welcome')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className={`card ${card.bgGlow} !p-4 group cursor-pointer`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center
                shadow-lg shadow-primary-500/10 group-hover:scale-110 transition-transform duration-200`}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.revenue_overview')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueChart || []}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#338dfc" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#338dfc" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                            <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, t('billing.revenue') || 'Revenue']} />
                            <Area type="monotone" dataKey="revenue" stroke="#338dfc" strokeWidth={2} fill="url(#revenueGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Appointment Status Pie */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.appointment_status')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                {pieData.map((_: any, i: number) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Growth */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.patient_growth')}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={patientGrowth || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                            <Tooltip />
                            <Bar dataKey="newPatients" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.recent_activity')}</h3>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto">
                        {(recentActivity || []).slice(0, 10).map((activity: any) => (
                            <div key={activity.id} className="flex items-start gap-3 text-sm">
                                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${activity.action === 'LOGIN' ? 'bg-emerald-500'
                                    : activity.action === 'CREATE' ? 'bg-primary-500'
                                        : activity.action === 'UPDATE' ? 'bg-amber-500'
                                            : 'bg-gray-400'
                                    }`} />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong>{activity.user?.firstName} {activity.user?.lastName}</strong> {activity.action.toLowerCase()} {activity.entity}
                                    </p>
                                    <p className="text-xs text-gray-400">{new Date(activity.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                        {(!recentActivity || recentActivity.length === 0) && (
                            <p className="text-gray-400 text-sm">{t('dashboard.no_activity')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

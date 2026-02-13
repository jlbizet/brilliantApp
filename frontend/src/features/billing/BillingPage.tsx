import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Receipt, DollarSign, Clock, CheckCircle, AlertTriangle, TrendingUp, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { billingApi } from '../../api';
import type { Invoice } from '../../types';
import CreateInvoiceModal from './components/CreateInvoiceModal';

const statusConfig: Record<string, { badge: string; icon: any; gradient: string }> = {
    PAID: { 
        badge: 'badge-success', 
        icon: <CheckCircle className="w-4 h-4" />,
        gradient: 'from-emerald-500 to-emerald-600'
    },
    PARTIAL: { 
        badge: 'badge-warning', 
        icon: <Clock className="w-4 h-4" />,
        gradient: 'from-amber-500 to-amber-600'
    },
    PENDING: { 
        badge: 'badge-info', 
        icon: <Clock className="w-4 h-4" />,
        gradient: 'from-blue-500 to-blue-600'
    },
    OVERDUE: { 
        badge: 'badge-danger', 
        icon: <AlertTriangle className="w-4 h-4" />,
        gradient: 'from-rose-500 to-rose-600'
    },
    REFUNDED: { 
        badge: 'badge-neutral', 
        icon: <DollarSign className="w-4 h-4" />,
        gradient: 'from-gray-500 to-gray-600'
    },
};

export default function BillingPage() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices', page],
        queryFn: () => billingApi.getInvoices({ page, limit: 10 }),
    });

    const totalRevenue = invoices?.data.reduce((sum: number, inv: Invoice) => sum + Number(inv.total), 0) || 0;
    const paidAmount = invoices?.data
        .filter((i: Invoice) => i.status === 'PAID')
        .reduce((sum: number, inv: Invoice) => sum + Number(inv.total), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('billing.manage')}</p>
                </div>
                <button
                    className="btn-primary group flex items-center gap-2"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Receipt className="w-3 h-3" />
                    </div>
                    {t('billing.new')}
                </button>
            </div>

            <CreateInvoiceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-50 dark:bg-primary-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.total_invoices')}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{invoices?.meta.total || 0}</p>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.paid')}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{invoices?.data.filter((i: Invoice) => i.status === 'PAID').length || 0}</p>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-50 dark:bg-amber-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.pending')}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{invoices?.data.filter((i: Invoice) => i.status === 'PENDING' || i.status === 'PARTIAL').length || 0}</p>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-50 dark:bg-rose-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.overdue')}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{invoices?.data.filter((i: Invoice) => i.status === 'OVERDUE').length || 0}</p>
                    </div>
                </div>
            </div>

            {/* Revenue Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card !p-5 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border-primary-100 dark:border-primary-800/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('billing.total_revenue')}</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <DollarSign className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>
                <div className="card !p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('billing.collected')}</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">${paidAmount.toLocaleString()}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">{t('billing.loading')}</div>
            ) : (
                <div className="card overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.invoice_number')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.patient')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.total') || 'Total'}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.status')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.due_date')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.payments')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {invoices?.data.map((inv: Invoice) => {
                                    const config = statusConfig[inv.status] || statusConfig.PENDING;
                                    return (
                                        <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-lg text-sm">
                                                    {inv.invoiceNumber}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                        {inv.patient?.firstName?.[0]}{inv.patient?.lastName?.[0]}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {inv.patient?.firstName} {inv.patient?.lastName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-gray-900 dark:text-white text-lg">${Number(inv.total).toLocaleString()}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`badge ${config.badge} flex items-center gap-1.5 w-fit text-xs`}>
                                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${config.gradient}`} />
                                                    {t(`billing.${inv.status.toLowerCase()}`)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {(inv as any)._count?.payments || 0} {t('billing.payments_count', { count: (inv as any)._count?.payments || 0 })}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!invoices?.data || invoices.data.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    <Receipt className="w-6 h-6 text-gray-400" />
                                                </div>
                                                {t('billing.no_invoices')}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {invoices && invoices.meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('common.pagination_info', { page: invoices.meta.page, totalPages: invoices.meta.totalPages, total: invoices.meta.total })}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-2 !px-3">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPage(p => Math.min(invoices.meta.totalPages, p + 1))} disabled={page >= invoices.meta.totalPages} className="btn-secondary !py-2 !px-3">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

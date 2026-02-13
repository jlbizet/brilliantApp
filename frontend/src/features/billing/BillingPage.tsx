import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Receipt, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { billingApi } from '../../api';
import type { Invoice } from '../../types';
import CreateInvoiceModal from './components/CreateInvoiceModal';

const statusConfig: Record<string, { badge: string; icon: any }> = {
    PAID: { badge: 'badge-success', icon: <CheckCircle className="w-4 h-4" /> },
    PARTIAL: { badge: 'badge-warning', icon: <Clock className="w-4 h-4" /> },
    PENDING: { badge: 'badge-info', icon: <Clock className="w-4 h-4" /> },
    OVERDUE: { badge: 'badge-danger', icon: <AlertTriangle className="w-4 h-4" /> },
    REFUNDED: { badge: 'badge-neutral', icon: <DollarSign className="w-4 h-4" /> },
};

export default function BillingPage() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices', page],
        queryFn: () => billingApi.getInvoices({ page, limit: 10 }),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('billing.manage')}</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Receipt className="w-4 h-4" /> {t('billing.new')}
                </button>
            </div>

            <CreateInvoiceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: t('billing.total_invoices'), value: invoices?.meta.total || 0, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-950/20' },
                    { label: t('billing.paid'), value: invoices?.data.filter((i: Invoice) => i.status === 'PAID').length || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                    { label: t('billing.pending'), value: invoices?.data.filter((i: Invoice) => i.status === 'PENDING' || i.status === 'PARTIAL').length || 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
                    { label: t('billing.overdue'), value: invoices?.data.filter((i: Invoice) => i.status === 'OVERDUE').length || 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20' },
                ].map((s) => (
                    <div key={s.label} className={`card ${s.bg} !p-4`}>
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Invoices Table */}
            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">{t('billing.loading')}</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('billing.invoice_number')}</th>
                                <th>{t('common.patient')}</th>
                                <th>{t('common.total') || 'Total'}</th>
                                <th>{t('common.status')}</th>
                                <th>{t('billing.due_date')}</th>
                                <th>{t('billing.payments')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices?.data.map((inv: Invoice) => {
                                const config = statusConfig[inv.status] || statusConfig.PENDING;
                                return (
                                    <tr key={inv.id}>
                                        <td className="font-mono font-semibold text-primary-600">{inv.invoiceNumber}</td>
                                        <td className="font-medium text-gray-900 dark:text-white">
                                            {inv.patient?.firstName} {inv.patient?.lastName}
                                        </td>
                                        <td className="font-bold text-gray-900 dark:text-white">${Number(inv.total).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${config.badge} flex items-center gap-1 w-fit`}>
                                                {config.icon} {t(`billing.${inv.status.toLowerCase()}`)}
                                            </span>
                                        </td>
                                        <td className="text-sm text-gray-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                        <td className="text-sm">{(inv as any)._count?.payments || 0} {t('billing.payments_count', { count: (inv as any)._count?.payments || 0 })}</td>
                                    </tr>
                                );
                            })}
                            {(!invoices?.data || invoices.data.length === 0) && (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('billing.no_invoices')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

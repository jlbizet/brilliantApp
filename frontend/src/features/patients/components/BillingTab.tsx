import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Download, CheckCircle, Clock, AlertCircle, TrendingUp, MoreVertical, Receipt, DollarSign, Wallet, Calendar, CreditCard } from 'lucide-react';
import { billingApi } from '../../../api';
import type { Invoice } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CreateInvoiceModal from '../../billing/components/CreateInvoiceModal';
import RecordPaymentModal from '../../billing/components/RecordPaymentModal';
import { Menu, Transition } from '@headlessui/react';
import { useAuthStore } from '../../../stores';
import { UserRole } from '../../../types';

interface BillingTabProps {
    patientId: string;
}

const STATUS_MAP = {
    PAID: { 
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', 
        gradient: 'from-emerald-500 to-teal-500',
        icon: CheckCircle 
    },
    PENDING: { 
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', 
        gradient: 'from-amber-400 to-orange-500',
        icon: Clock 
    },
    OVERDUE: { 
        color: 'text-red-600 bg-red-50 dark:bg-red-900/20', 
        gradient: 'from-red-500 to-rose-500',
        icon: AlertCircle 
    },
    PARTIAL: { 
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', 
        gradient: 'from-blue-500 to-indigo-500',
        icon: Clock 
    },
};

export default function BillingTab({ patientId }: BillingTabProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const handleRecordPayment = (inv: Invoice) => {
        setSelectedInvoice(inv);
        setIsPaymentModalOpen(true);
    };

    const { data: invoicesResponse, isLoading } = useQuery({
        queryKey: ['invoices', patientId],
        queryFn: () => billingApi.getInvoices({ patientId }),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => billingApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success(t('billing.status_updated') || 'Status updated');
        },
        onError: () => toast.error(t('billing.status_update_error') || 'Failed to update status'),
    });

    const invoices = invoicesResponse?.data;

    if (isLoading) return (
        <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            {t('billing.loading_history')}
        </div>
    );

    const totalBalance = invoices?.reduce((acc: number, inv: Invoice) =>
        inv.status !== 'PAID' ? acc + inv.total : acc, 0) || 0;

    const paidTotal = invoices?.reduce((acc: number, inv: Invoice) =>
        inv.status === 'PAID' ? acc + inv.total : acc, 0) || 0;

    return (
        <div className="space-y-6">
            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 p-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('billing.outstanding_balance')}</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">${totalBalance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 p-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center shadow-lg">
                            <Wallet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('billing.total_paid')}</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">${paidTotal.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 p-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center shadow-lg">
                            <CreditCard className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('billing.total_invoices')}</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">{invoices?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400" />
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                                <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            {t('billing.invoicing_history')}
                        </h3>
                        <div className="flex gap-3">
                            {['ADMIN', 'RECEPTIONIST'].includes(user?.role as string) && (
                                <button
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    <Receipt className="w-4 h-4" /> {t('billing.new_invoice')}
                                </button>
                            )}
                            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <Download className="w-4 h-4" /> {t('billing.download_all')}
                            </button>
                        </div>
                    </div>

                    <CreateInvoiceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} patientId={patientId} />
                    <RecordPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} invoice={selectedInvoice} />

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                    <th className="pb-4">{t('billing.invoice_number')}</th>
                                    <th className="pb-4">{t('common.date')}</th>
                                    <th className="pb-4">{t('billing.amount')}</th>
                                    <th className="pb-4">{t('common.status')}</th>
                                    <th className="pb-4 text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {invoices && invoices.length > 0 ? (
                                    invoices.map((inv: Invoice) => {
                                        const StatusIcon = STATUS_MAP[inv.status as keyof typeof STATUS_MAP]?.icon || Clock;
                                        const statusColor = STATUS_MAP[inv.status as keyof typeof STATUS_MAP]?.color || 'text-gray-500 bg-gray-50';
                                        const statusGradient = STATUS_MAP[inv.status as keyof typeof STATUS_MAP]?.gradient || 'from-gray-400 to-gray-500';

                                        return (
                                            <tr key={inv.id} className="group border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-bold text-gray-900 dark:text-white">{inv.invoiceNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {new Date(inv.dueDate).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="font-black text-lg text-gray-900 dark:text-white">${inv.total.toLocaleString()}</span>
                                                </td>
                                                <td className="py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${statusGradient}`} />
                                                        {t(`billing.${inv.status.toLowerCase()}`)}
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {['ADMIN', 'RECEPTIONIST'].includes(user?.role as string) && (
                                                            <Menu as="div" className="relative inline-block text-left">
                                                                <Menu.Button className="p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Menu.Button>
                                                                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                                                    <Menu.Items className="absolute right-0 z-10 mt-2 w-44 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 focus:outline-none overflow-hidden">
                                                                        <div className="p-1">
                                                                            <Menu.Item>
                                                                                {({ active }) => (
                                                                                    <button onClick={() => handleRecordPayment(inv)} className={`${active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'} group flex w-full items-center rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 mb-1`}>
                                                                                        <DollarSign className="w-4 h-4 mr-2 text-emerald-500" />
                                                                                        {t('billing.record_payment')}
                                                                                    </button>
                                                                                )}
                                                                            </Menu.Item>
                                                                            {['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].map((status) => (
                                                                                <Menu.Item key={status}>
                                                                                    {({ active }) => (
                                                                                        <button onClick={() => updateStatusMutation.mutate({ id: inv.id, status })} className={`${active ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'} group flex w-full items-center rounded-lg px-3 py-2 text-xs font-semibold`}>
                                                                                            {t(`billing.${status.toLowerCase()}`)}
                                                                                        </button>
                                                                                    )}
                                                                                </Menu.Item>
                                                                            ))}
                                                                        </div>
                                                                    </Menu.Items>
                                                                </Transition>
                                                            </Menu>
                                                        )}
                                                        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700" title={t('billing.download_pdf') || 'Download PDF'}>
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
                                                    <Receipt className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <p className="text-gray-400 italic">{t('billing.no_records')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

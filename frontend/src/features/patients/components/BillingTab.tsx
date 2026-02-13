import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Download, CheckCircle, Clock, AlertCircle, TrendingUp, MoreVertical, Receipt, DollarSign } from 'lucide-react';
import { billingApi } from '../../../api';
import type { Invoice } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CreateInvoiceModal from '../../billing/components/CreateInvoiceModal';
import RecordPaymentModal from '../../billing/components/RecordPaymentModal';
import { Menu, Transition } from '@headlessui/react';

interface BillingTabProps {
    patientId: string;
}

const STATUS_MAP = {
    PAID: { color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
    PENDING: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: Clock },
    OVERDUE: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: AlertCircle },
    PARTIAL: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: Clock },
};

export default function BillingTab({ patientId }: BillingTabProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
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

    if (isLoading) return <div className="text-center py-10 text-gray-400">{t('billing.loading_history')}</div>;

    const totalBalance = invoices?.reduce((acc: number, inv: Invoice) =>
        inv.status !== 'PAID' ? acc + inv.total : acc, 0) || 0;

    return (
        <div className="space-y-6">
            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-white dark:bg-gray-800 border-none shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('billing.outstanding_balance')}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">${totalBalance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                {/* Add more stats if needed */}
            </div>

            {/* Invoices List */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('billing.invoicing_history')}</h3>
                    <div className="flex gap-2">
                        <button
                            className="btn-primary py-1.5 px-4 text-xs flex items-center gap-2"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <Receipt className="w-4 h-4" /> {t('billing.new_invoice')}
                        </button>
                        <button className="btn-secondary py-1.5 text-xs">{t('billing.download_all')}</button>
                    </div>
                </div>

                <CreateInvoiceModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    patientId={patientId}
                />

                <RecordPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    invoice={selectedInvoice}
                />

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
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

                                    return (
                                        <tr key={inv.id} className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-primary-500 transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-gray-900 dark:text-white">{inv.invoiceNumber}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-gray-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                            <td className="py-4 font-bold text-gray-900 dark:text-white">${inv.total.toLocaleString()}</td>
                                            <td className="py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {t(`billing.${inv.status.toLowerCase()}`)}
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Menu as="div" className="relative inline-block text-left">
                                                        <Menu.Button className="p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Menu.Button>
                                                        <Transition
                                                            as={Fragment}
                                                            enter="transition ease-out duration-100"
                                                            enterFrom="transform opacity-0 scale-95"
                                                            enterTo="transform opacity-100 scale-100"
                                                            leave="transition ease-in duration-75"
                                                            leaveFrom="transform opacity-100 scale-100"
                                                            leaveTo="transform opacity-0 scale-95"
                                                        >
                                                            <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 focus:outline-none">
                                                                <div className="p-1">
                                                                    <Menu.Item>
                                                                        {({ active }) => (
                                                                            <button
                                                                                onClick={() => handleRecordPayment(inv)}
                                                                                className={`${active ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                                                                                    } group flex w-full items-center rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 mb-1 pb-2`}
                                                                            >
                                                                                <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                                                                                {t('billing.record_payment')}
                                                                            </button>
                                                                        )}
                                                                    </Menu.Item>
                                                                    {['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].map((status) => (
                                                                        <Menu.Item key={status}>
                                                                            {({ active }) => (
                                                                                <button
                                                                                    onClick={() => updateStatusMutation.mutate({ id: inv.id, status })}
                                                                                    className={`${active ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                                                                                        } group flex w-full items-center rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider`}
                                                                                >
                                                                                    {t(`billing.${status.toLowerCase()}`)}
                                                                                </button>
                                                                            )}
                                                                        </Menu.Item>
                                                                    ))}
                                                                </div>
                                                            </Menu.Items>
                                                        </Transition>
                                                    </Menu>
                                                    <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800" title={t('billing.download_pdf') || 'Download PDF'}>
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400 italic">{t('billing.no_records')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

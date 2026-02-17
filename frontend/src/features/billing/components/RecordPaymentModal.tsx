import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { X, DollarSign, Calendar, CreditCard, Banknote, Landmark, MoreHorizontal } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../../../api';
import toast from 'react-hot-toast';
import type { Invoice } from '../../../types';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
}

const PAYMENT_METHODS = [
    { id: 'CASH', label: 'billing.method_cash', icon: Banknote },
    { id: 'CARD', label: 'billing.method_card', icon: CreditCard },
    { id: 'TRANSFER', label: 'billing.method_transfer', icon: Landmark },
    { id: 'OTHER', label: 'billing.method_other', icon: MoreHorizontal },
];

export default function RecordPaymentModal({ isOpen, onClose, invoice }: RecordPaymentModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<string>('CASH');
    const [reference, setReference] = useState<string>('');

    // Update amount when invoice changes
    useState(() => {
        if (invoice) {
            setAmount(invoice.total.toString());
        }
    });

    const createPaymentMutation = useMutation({
        mutationFn: (data: any) => billingApi.createPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success(t('billing.payment_success'));
            onClose();
            // Reset form
            setReference('');
        },
        onError: () => {
            toast.error(t('billing.payment_error'));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;

        createPaymentMutation.mutate({
            invoiceId: invoice.id,
            amount: parseFloat(amount),
            method,
            reference,
            paidAt: new Date().toISOString(),
        });
    };

    if (!invoice) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="transition-all ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="transition-all ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl shadow-gray-900/10 dark:shadow-black/30 transition-all border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                            {t('billing.record_payment')}
                                        </Dialog.Title>
                                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                            {t('billing.record_payment_description')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Invoice Info */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/30 border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">{t('billing.invoice_number')}</span>
                                            <span className="font-black text-gray-900 dark:text-white uppercase tracking-wider">{invoice.invoiceNumber}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">{t('billing.total')}</span>
                                            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">${Number(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    {/* Amount Input */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('billing.payment_amount')}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                                    <DollarSign className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                required
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-14 pr-4 py-4 text-xl font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Method Selector */}
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('billing.payment_method')}
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {PAYMENT_METHODS.map((item) => {
                                                const Icon = item.icon;
                                                const isSelected = method === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setMethod(item.id)}
                                                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-50/50 dark:from-primary-900/30 dark:to-primary-900/10 text-primary-700 dark:text-primary-300 shadow-md shadow-primary-500/10'
                                                                : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                            }`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-100 dark:bg-primary-800/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-wider">{t(item.label)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Reference Input */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('billing.payment_reference')}
                                        </label>
                                        <input
                                            type="text"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3.5 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            placeholder={t('billing.payment_reference_placeholder') || 'Transaction reference...'}
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 px-6 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createPaymentMutation.isPending}
                                            className="flex-[2] px-6 py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {createPaymentMutation.isPending ? t('common.loading') : t('billing.record_payment')}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

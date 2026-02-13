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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                            {t('billing.record_payment')}
                                        </Dialog.Title>
                                        <p className="mt-2 text-sm text-gray-500 font-medium italic">
                                            {t('billing.record_payment_description')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Invoice Info */}
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">{t('billing.invoice_number')}</span>
                                            <span className="font-black text-gray-900 dark:text-white uppercase tracking-wider">{invoice.invoiceNumber}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">{t('billing.total')}</span>
                                            <span className="font-black text-primary-600 dark:text-primary-400">${invoice.total.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Amount Input */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                                            {t('billing.payment_amount')}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="input-primary pl-11 py-4 text-xl font-bold"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Method Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
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
                                                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${isSelected
                                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                                : 'border-gray-100 dark:border-gray-700 bg-transparent text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                                                            }`}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                        <span className="text-xs font-bold uppercase tracking-wider">{t(item.label)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Reference Input */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                                            {t('billing.payment_reference')}
                                        </label>
                                        <input
                                            type="text"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            className="input-primary py-3"
                                            placeholder={t('billing.payment_reference_placeholder') || 'Ref...'}
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 btn-secondary py-4 uppercase tracking-widest text-xs font-black"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createPaymentMutation.isPending}
                                            className="flex-2 btn-primary py-4 uppercase tracking-widest text-xs font-black"
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

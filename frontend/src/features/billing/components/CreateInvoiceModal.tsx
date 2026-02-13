import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Receipt, Plus, Trash2, Search, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, treatmentsApi, billingApi } from '../../../api';
import type { Patient, TreatmentPlan, Treatment } from '../../../types';
import toast from 'react-hot-toast';

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId?: string;
}

export default function CreateInvoiceModal({ isOpen, onClose, patientId: initialPatientId }: CreateInvoiceModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([]);
    const [tax, setTax] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const { data: patients } = useQuery({
        queryKey: ['patients', searchTerm],
        queryFn: () => patientsApi.getAll({ search: searchTerm, limit: 5 }),
        enabled: !initialPatientId && searchTerm.length > 2,
    });

    const { data: treatmentPlans } = useQuery({
        queryKey: ['treatment-plans', selectedPatientId],
        queryFn: () => treatmentsApi.getPlans(selectedPatientId),
        enabled: !!selectedPatientId,
    });

    const createInvoiceMutation = useMutation({
        mutationFn: (data: any) => billingApi.createInvoice(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success(t('billing.create_success') || 'Invoice created successfully');
            onClose();
            resetForm();
        },
        onError: () => toast.error(t('billing.create_error') || 'Failed to create invoice'),
    });

    const resetForm = () => {
        if (!initialPatientId) setSelectedPatientId('');
        setItems([]);
        setTax(0);
        setDiscount(0);
        setNotes('');
    };

    const addTreatmentItem = (treatment: Treatment) => {
        setItems([...items, { description: treatment.name, quantity: 1, unitPrice: Number(treatment.cost) }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal + Number(tax) - Number(discount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) return toast.error(t('billing.select_patient_error') || 'Please select a patient');
        if (items.length === 0) return toast.error(t('billing.empty_items_error') || 'Invoice must have items');

        createInvoiceMutation.mutate({
            patientId: selectedPatientId,
            items: items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
            tax: Number(tax),
            discount: Number(discount),
            dueDate,
            notes,
        });
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-2xl shadow-gray-900/10 dark:shadow-black/30 transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-8 border border-gray-100 dark:border-gray-800">
                                <div className="absolute right-0 top-0 pr-6 pt-6">
                                    <button
                                        type="button"
                                        className="rounded-full bg-gray-50 dark:bg-gray-800 p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-all duration-200 hover:scale-105"
                                        onClick={onClose}
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 sm:mx-0">
                                        <Receipt className="h-7 w-7" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                                        <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {t('billing.new_invoice')}
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                                            {t('billing.create_invoice_description') || 'Create a new invoice and add treatment items'}
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Side: Patient & Treatments */}
                                        <div className="space-y-6">
                                            {!initialPatientId && (
                                                <div className="space-y-2.5">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.patient')}</label>
                                                    <div className="relative">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            className="input-field pl-11 py-3 transition-all duration-200 focus:ring-2 focus:ring-primary-500/20"
                                                            placeholder={t('billing.search_patient_placeholder') || 'Search for a patient...'}
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                    {patients?.data && searchTerm.length > 2 && (
                                                        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xl shadow-gray-900/5 dark:shadow-black/20 bg-white dark:bg-gray-800">
                                                            {patients.data.map((p: Patient) => (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedPatientId(p.id);
                                                                        setSearchTerm(`${p.firstName} ${p.lastName}`);
                                                                    }}
                                                                    className="w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-all duration-150"
                                                                >
                                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                                                        {p.firstName[0]}{p.lastName[0]}
                                                                    </div>
                                                                    <span className="font-semibold text-gray-900 dark:text-white">{p.firstName} {p.lastName}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2.5">
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.select_treatments') || 'Select Treatments'}</label>
                                                <div className="max-h-[300px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3 bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-800/50 dark:to-gray-900/30 shadow-inner">
                                                    {treatmentPlans?.map((plan: TreatmentPlan) => (
                                                        <div key={plan.id} className="space-y-2">
                                                            <p className="text-[10px] font-black uppercase text-primary-500 dark:text-primary-400 tracking-tighter pl-1">{plan.name}</p>
                                                            {plan.treatments?.map((t: Treatment) => (
                                                                <button
                                                                    key={t.id}
                                                                    type="button"
                                                                    onClick={() => addTreatmentItem(t)}
                                                                    className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-200 group"
                                                                >
                                                                    <div className="flex flex-col items-start transition-transform group-active:scale-95">
                                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</span>
                                                                        <span className="text-[10px] text-gray-500 uppercase font-medium">{t.tooth ? `Tooth ${t.tooth}` : 'General'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-sm font-black text-primary-600 dark:text-primary-400">${Number(t.cost).toLocaleString()}</span>
                                                                        <div className="w-6 h-6 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                                                                            <Plus className="w-3.5 h-3.5 text-primary-500 transition-colors" />
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ))}
                                                    {(!treatmentPlans || treatmentPlans.length === 0) && (
                                                        <div className="text-center py-10 px-4">
                                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                                                                <Search className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                                                {selectedPatientId ? t('billing.no_treatments') || 'No treatments found for this patient' : t('billing.select_patient_hint') || 'Search for a patient to see their treatments'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Invoice Items & Totals */}
                                        <div className="space-y-6">
                                            <div className="space-y-2.5">
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.invoice_items') || 'Invoice Items'}</label>
                                                <div className="space-y-3 min-h-[200px]">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 group animate-slide-up">
                                                            <div className="flex-1 space-y-3">
                                                                <input
                                                                    className="w-full bg-transparent border-0 border-b border-gray-200 dark:border-gray-600 focus:border-primary-500 focus:ring-0 text-sm font-bold text-gray-900 dark:text-white py-1 px-0 transition-colors"
                                                                    value={item.description}
                                                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                                />
                                                                <div className="flex items-center gap-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{t('billing.qty') || 'Qty'}</label>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            className="w-16 rounded-lg border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-1 px-2 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                                            value={item.quantity}
                                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{t('billing.price') || 'Price'}</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            className="w-24 rounded-lg border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-1 px-2 text-xs font-bold text-primary-600 dark:text-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                                            value={item.unitPrice}
                                                                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(idx)}
                                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 p-2 rounded-lg"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {items.length === 0 && (
                                                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-12 bg-gray-50/50 dark:bg-gray-800/30">
                                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                                                                <Receipt className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                            <p className="text-sm text-gray-400 dark:text-gray-500">{t('billing.empty_items') || 'No items added yet'}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Totals & Options */}
                                            <div className="rounded-2xl p-6 space-y-5 bg-gradient-to-br from-primary-50/80 via-primary-50/50 to-white dark:from-primary-900/20 dark:via-primary-900/10 dark:to-gray-900/30 border border-primary-100/50 dark:border-primary-900/30 shadow-lg shadow-primary-500/5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{t('billing.due_date')}</label>
                                                        <input
                                                            type="date"
                                                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                            value={dueDate}
                                                            onChange={(e) => setDueDate(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 text-right">
                                                        <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{t('billing.subtotal') || 'Subtotal'}</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">${subtotal.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{t('billing.tax') || 'Tax'}</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                            value={tax}
                                                            onChange={(e) => setTax(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">{t('billing.discount') || 'Discount'}</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full rounded-xl border-amber-200 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10 py-2 px-3 text-sm text-amber-700 dark:text-amber-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                                            value={discount}
                                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-primary-200/50 dark:border-primary-800/30 flex justify-between items-center">
                                                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.total') || 'Total Amount'}</span>
                                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">${total.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('billing.notes')}</label>
                                                <textarea
                                                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none min-h-[100px]"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder={t('billing.notes_placeholder') || 'Add internal notes or payment instructions...'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createInvoiceMutation.isPending}
                                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {createInvoiceMutation.isPending ? t('common.saving') : t('billing.create_invoice') || 'Create Invoice'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

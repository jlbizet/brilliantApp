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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-8">
                                <div className="absolute right-0 top-0 pr-6 pt-6">
                                    <button
                                        type="button"
                                        className="rounded-full bg-gray-50 dark:bg-gray-800 p-2 text-gray-400 hover:text-gray-500 transition-colors"
                                        onClick={onClose}
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 sm:mx-0 sm:h-12 sm:w-12">
                                        <Receipt className="h-6 w-6" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                                        <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {t('billing.new_invoice')}
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {t('billing.create_invoice_description') || 'Create a new invoice and add treatment items'}
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Side: Patient & Treatments */}
                                        <div className="space-y-6">
                                            {!initialPatientId && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('common.patient')}</label>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            className="input-field pl-10"
                                                            placeholder={t('billing.search_patient_placeholder') || 'Search for a patient...'}
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                    {patients?.data && searchTerm.length > 2 && (
                                                        <div className="mt-2 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg shadow-black/5">
                                                            {patients.data.map((p: Patient) => (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedPatientId(p.id);
                                                                        setSearchTerm(`${p.firstName} ${p.lastName}`);
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                                                                        {p.firstName[0]}{p.lastName[0]}
                                                                    </div>
                                                                    <span className="font-semibold text-gray-900 dark:text-white">{p.firstName} {p.lastName}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('billing.select_treatments') || 'Select Treatments'}</label>
                                                <div className="max-h-[300px] overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-[2rem] p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
                                                    {treatmentPlans?.map((plan: TreatmentPlan) => (
                                                        <div key={plan.id} className="space-y-2">
                                                            <p className="text-[10px] font-black uppercase text-primary-500 tracking-tighter pl-1">{plan.name}</p>
                                                            {plan.treatments?.map((t: Treatment) => (
                                                                <button
                                                                    key={t.id}
                                                                    type="button"
                                                                    onClick={() => addTreatmentItem(t)}
                                                                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 hover:shadow-md transition-all group"
                                                                >
                                                                    <div className="flex flex-col items-start transition-transform group-active:scale-95">
                                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</span>
                                                                        <span className="text-[10px] text-gray-500 uppercase font-medium">{t.tooth ? `Tooth ${t.tooth}` : 'General'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-sm font-black text-primary-600">${Number(t.cost).toLocaleString()}</span>
                                                                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ))}
                                                    {(!treatmentPlans || treatmentPlans.length === 0) && (
                                                        <p className="text-center py-8 text-sm text-gray-400 italic">
                                                            {selectedPatientId ? t('billing.no_treatments') || 'No treatments found for this patient' : t('billing.select_patient_hint') || 'Search for a patient to see their treatments'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Invoice Items & Totals */}
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('billing.invoice_items') || 'Invoice Items'}</label>
                                                <div className="space-y-3 min-h-[200px]">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 group animate-slide-up">
                                                            <div className="flex-1 space-y-3">
                                                                <input
                                                                    className="input-field !py-1 !px-0 bg-transparent border-none text-sm font-bold !ring-0"
                                                                    value={item.description}
                                                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                                />
                                                                <div className="flex items-center gap-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-[10px] uppercase font-bold text-gray-400">{t('billing.qty') || 'Qty'}</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-16 input-field !py-0.5 !px-2 text-xs"
                                                                            value={item.quantity}
                                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-[10px] uppercase font-bold text-gray-400">{t('billing.price') || 'Price'}</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-24 input-field !py-0.5 !px-2 text-xs font-bold text-primary-600"
                                                                            value={item.unitPrice}
                                                                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(idx)}
                                                                className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {items.length === 0 && (
                                                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl py-12">
                                                            <Receipt className="w-8 h-8 text-gray-200 mb-2" />
                                                            <p className="text-sm text-gray-400 italic">{t('billing.empty_items') || 'No items added yet'}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Totals & Options */}
                                            <div className="card !p-6 space-y-4 bg-primary-50/30 dark:bg-primary-950/10 border-primary-100 dark:border-primary-900/20">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400">{t('billing.due_date')}</label>
                                                        <input
                                                            type="date"
                                                            className="input-field !py-1"
                                                            value={dueDate}
                                                            onChange={(e) => setDueDate(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 text-right">
                                                        <p className="text-[10px] uppercase font-bold text-gray-400">{t('billing.subtotal') || 'Subtotal'}</p>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">${subtotal.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400">{t('billing.tax') || 'Tax'}</label>
                                                        <input
                                                            type="number"
                                                            className="input-field !py-1"
                                                            value={tax}
                                                            onChange={(e) => setTax(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 text-amber-600">{t('billing.discount') || 'Discount'}</label>
                                                        <input
                                                            type="number"
                                                            className="input-field !py-1 text-amber-600 border-amber-200"
                                                            value={discount}
                                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-primary-100 dark:border-primary-900/20 flex justify-between items-center">
                                                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t('billing.total') || 'Total Amount'}</span>
                                                    <span className="text-3xl font-black text-primary-600">${total.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('billing.notes')}</label>
                                                <textarea
                                                    className="input-field min-h-[80px]"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder={t('billing.notes_placeholder') || 'Add internal notes or payment instructions...'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="btn-secondary px-8"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createInvoiceMutation.isPending}
                                            className="btn-primary px-8"
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

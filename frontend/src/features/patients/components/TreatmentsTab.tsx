import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Check, X, Stethoscope, AlertCircle, CheckCircle, Clock, ChevronDown, Trash2 } from 'lucide-react';
import { treatmentsApi } from '../../../api';
import { useAuthStore } from '../../../stores';
import toast from 'react-hot-toast';
import type { TreatmentPlan, Treatment } from '../../../types';
import { Menu } from '@headlessui/react';

interface TreatmentsTabProps {
    patientId: string;
}

const STATUS_COLORS: Record<string, string> = {
    COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    IN_PROGRESS: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
    PLANNED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function TreatmentsTab({ patientId }: TreatmentsTabProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [showForm, setShowForm] = useState(false);
    const [addingProcedureTo, setAddingProcedureTo] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        estimatedCost: '',
        status: 'PLANNED'
    });
    const [procedureData, setProcedureData] = useState({
        name: '',
        cost: '',
        tooth: ''
    });

    const STATUS_ICONS: Record<string, any> = {
        COMPLETED: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        IN_PROGRESS: <Clock className="w-4 h-4 text-sky-500" />,
        PLANNED: <AlertCircle className="w-4 h-4 text-gray-400" />,
        CANCELLED: <AlertCircle className="w-4 h-4 text-red-400" />,
    };

    const { data: plans, isLoading } = useQuery({
        queryKey: ['patient-treatments', patientId],
        queryFn: () => treatmentsApi.getPlans(patientId),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => treatmentsApi.createPlan({ ...data, patientId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-treatments', patientId] });
            queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
            toast.success(t('treatments.plan_create_success') || 'Treatment plan created');
            setShowForm(false);
            setFormData({ name: '', description: '', estimatedCost: '', status: 'PLANNED' });
        },
        onError: () => toast.error(t('treatments.plan_create_error') || 'Failed to create plan'),
    });

    const createTreatmentMutation = useMutation({
        mutationFn: (data: any) => treatmentsApi.createTreatment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-treatments', patientId] });
            toast.success(t('treatments.procedure_add_success') || 'Procedure added');
            setAddingProcedureTo(null);
            setProcedureData({ name: '', cost: '', tooth: '' });
        },
        onError: () => toast.error(t('treatments.procedure_add_error') || 'Failed to add procedure'),
    });

    const updateTreatmentMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => treatmentsApi.updateTreatment(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-treatments', patientId] });
            toast.success(t('treatments.procedure_update_success') || 'Procedure status updated');
        },
    });

    const updatePlanMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => treatmentsApi.updatePlan(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-treatments', patientId] });
            toast.success(t('treatments.plan_update_success') || 'Plan status updated');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            ...formData,
            estimatedCost: Number(formData.estimatedCost)
        });
    };

    const handleAddProcedure = (e: React.FormEvent, planId: string) => {
        e.preventDefault();
        createTreatmentMutation.mutate({
            treatmentPlanId: planId,
            name: procedureData.name,
            cost: Number(procedureData.cost),
            tooth: procedureData.tooth || undefined,
        });
    };

    if (isLoading) return <div className="text-center py-8 text-gray-400">{t('treatments.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">{t('treatments.title')}</h3>
                {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> {t('treatments.new_plan')}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card animate-slide-up bg-gray-50 dark:bg-gray-800/50 border border-primary-100 dark:border-primary-900/30">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('treatments.create_new_plan')}</h4>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">{t('treatments.plan_name_label')} *</label>
                                <input
                                    className="input-field"
                                    placeholder={t('treatments.plan_name_placeholder')}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">{t('treatments.estimated_cost_label')} ($)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={formData.estimatedCost}
                                    onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">{t('common.description')}</label>
                            <textarea
                                className="input-field"
                                rows={2}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('treatments.description_placeholder')}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
                            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                                {createMutation.isPending ? t('common.creating') : t('treatments.create_button')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {(plans && plans.length > 0) ? (
                    plans.map((plan: TreatmentPlan) => (
                        <div key={plan.id} className="card hover:shadow-md transition-shadow group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 rounded-xl flex items-center justify-center">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                        <p className="text-xs text-gray-500">{new Date(plan.createdAt || '').toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) ? (
                                        <Menu as="div" className="relative inline-block text-left mb-1">
                                            <Menu.Button className={`badge flex items-center gap-1 cursor-pointer ${STATUS_COLORS[plan.status]} hover:opacity-80`}>
                                                {t(`treatments.${plan.status.toLowerCase()}`)}
                                                <ChevronDown className="w-3 h-3" />
                                            </Menu.Button>
                                            <Menu.Items className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                {['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                                                    <Menu.Item key={status}>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={() => updatePlanMutation.mutate({ id: plan.id, status })}
                                                                className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center px-4 py-2 text-xs text-gray-900 dark:text-white`}
                                                            >
                                                                {t(`treatments.${status.toLowerCase()}`)}
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                ))}
                                            </Menu.Items>
                                        </Menu>
                                    ) : (
                                        <div className={`badge mb-1 ${STATUS_COLORS[plan.status]}`}>
                                            {t(`treatments.${plan.status.toLowerCase()}`)}
                                        </div>
                                    )}
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        ${Number(plan.estimatedCost).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {plan.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 pl-13">
                                    {plan.description}
                                </p>
                            )}

                            {/* Progress Bar */}
                            {plan.treatments && plan.treatments.length > 0 && (
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 w-full mb-3">
                                    <div
                                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(plan.treatments.filter(t => t.status === 'COMPLETED').length / plan.treatments.length) * 100}%` }}
                                    />
                                </div>
                            )}

                            {/* Procedure List */}
                            <div className="space-y-1 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2">
                                {plan.treatments && plan.treatments.length > 0 && plan.treatments.map(t_item => (
                                    <div key={t_item.id} className="flex items-center justify-between text-xs py-2 px-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                            {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) ? (
                                                <button
                                                    onClick={() => updateTreatmentMutation.mutate({
                                                        id: t_item.id,
                                                        status: t_item.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED'
                                                    })}
                                                    className="hover:scale-110 transition-transform"
                                                    title={t('treatments.toggle_completion')}
                                                >
                                                    {STATUS_ICONS[t_item.status]}
                                                </button>
                                            ) : (
                                                <div className="opacity-80">
                                                    {STATUS_ICONS[t_item.status]}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className={`${t_item.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
                                                    {t_item.name}
                                                </span>
                                                {t_item.tooth && <span className="text-[10px] text-gray-400">{t('odontogram.table_tooth')}: {t_item.tooth}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-500">${Number(t_item.cost).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Procedure Button/Form */}
                                {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                                    <>
                                        {addingProcedureTo === plan.id ? (
                                            <form onSubmit={(e) => handleAddProcedure(e, plan.id)} className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 animate-fade-in">
                                                <div className="grid grid-cols-3 gap-2 mb-2">
                                                    <input
                                                        className="input-field text-xs py-1"
                                                        placeholder={t('treatments.procedure_name_placeholder')}
                                                        value={procedureData.name}
                                                        onChange={e => setProcedureData({ ...procedureData, name: e.target.value })}
                                                        required
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="number"
                                                        className="input-field text-xs py-1"
                                                        placeholder={t('treatments.cost_placeholder')}
                                                        value={procedureData.cost}
                                                        onChange={e => setProcedureData({ ...procedureData, cost: e.target.value })}
                                                        required
                                                    />
                                                    <input
                                                        className="input-field text-xs py-1"
                                                        placeholder={t('treatments.tooth_opt_placeholder')}
                                                        value={procedureData.tooth}
                                                        onChange={e => setProcedureData({ ...procedureData, tooth: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddingProcedureTo(null)}
                                                        className="text-xs text-gray-500 hover:text-gray-700"
                                                    >
                                                        {t('common.cancel')}
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={createTreatmentMutation.isPending}
                                                        className="btn-primary py-1 px-2 text-xs"
                                                    >
                                                        {t('common.add')}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button
                                                onClick={() => setAddingProcedureTo(plan.id)}
                                                className="w-full py-1 text-center text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded border border-dashed border-primary-200 dark:border-primary-800 mt-2 transition-colors"
                                            >
                                                + {t('treatments.add_procedure')}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                        <Stethoscope className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">{t('treatments.no_plans')}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('treatments.create_plan_hint')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

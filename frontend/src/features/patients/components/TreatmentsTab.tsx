import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Check, X, Stethoscope, AlertCircle, CheckCircle, Clock, ChevronDown, Trash2, ClipboardList, Target } from 'lucide-react';
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

const STATUS_GRADIENTS: Record<string, string> = {
    COMPLETED: 'from-emerald-500 to-teal-500',
    IN_PROGRESS: 'from-sky-500 to-blue-500',
    PLANNED: 'from-gray-400 to-gray-500',
    CANCELLED: 'from-red-400 to-rose-500',
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
        COMPLETED: <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>,
        IN_PROGRESS: <div className="p-1 rounded-full bg-sky-100 dark:bg-sky-900/30"><Clock className="w-4 h-4 text-sky-500" /></div>,
        PLANNED: <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800"><AlertCircle className="w-4 h-4 text-gray-400" /></div>,
        CANCELLED: <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30"><AlertCircle className="w-4 h-4 text-red-400" /></div>,
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
            toast.success(t('treatments.plan_create_success'));
            setShowForm(false);
            setFormData({ name: '', description: '', estimatedCost: '', status: 'PLANNED' });
        },
        onError: () => toast.error(t('treatments.plan_create_error')),
    });

    const createTreatmentMutation = useMutation({
        mutationFn: (data: any) => treatmentsApi.createTreatment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-treatments', patientId] });
            toast.success(t('treatments.procedure_add_success'));
            setAddingProcedureTo(null);
            setProcedureData({ name: '', cost: '', tooth: '' });
        },
        onError: () => toast.error(t('treatments.procedure_add_error')),
    });

    const updateTreatmentMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => treatmentsApi.updateTreatment(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-treatments', patientId] });
            toast.success(t('treatments.procedure_update_success'));
        },
    });

    const updatePlanMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => treatmentsApi.updatePlan(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-treatments', patientId] });
            toast.success(t('treatments.plan_update_success'));
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

    if (isLoading) return (
        <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <p>{t('treatments.loading')}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30">
                        <ClipboardList className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    {t('treatments.title')}
                </h3>
                {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus className="w-4 h-4" /> {t('treatments.new_plan')}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-violet-200 dark:border-violet-800/50 p-6 animate-slide-up overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-violet-500" />
                    <div className="flex justify-between items-start mb-5">
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-violet-500" />
                            {t('treatments.create_new_plan')}
                        </h4>
                        <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label text-xs uppercase tracking-wider font-bold opacity-70">{t('treatments.plan_name_label')} *</label>
                                <input className="input-field rounded-xl" placeholder={t('treatments.plan_name_placeholder')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="label text-xs uppercase tracking-wider font-bold opacity-70">{t('treatments.estimated_cost_label')} ($)</label>
                                <input type="number" className="input-field rounded-xl" value={formData.estimatedCost} onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })} placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="label text-xs uppercase tracking-wider font-bold opacity-70">{t('common.description')}</label>
                            <textarea className="input-field rounded-xl min-h-[80px]" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder={t('treatments.description_placeholder')} />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('common.cancel')}</button>
                            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50">
                                {createMutation.isPending ? t('common.creating') : t('treatments.create_button')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                {(plans && plans.length > 0) ? (
                    plans.map((plan: TreatmentPlan) => (
                        <div key={plan.id} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden group hover:shadow-xl transition-all">
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${STATUS_GRADIENTS[plan.status]}`} />
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 flex items-center justify-center shadow-lg">
                                            <Stethoscope className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{plan.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{new Date(plan.createdAt || '').toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) ? (
                                            <Menu as="div" className="relative inline-block text-left mb-1">
                                                <Menu.Button className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105 ${STATUS_COLORS[plan.status]}`}>
                                                    {t(`treatments.${plan.status.toLowerCase()}`)}
                                                    <ChevronDown className="w-3 h-3" />
                                                </Menu.Button>
                                                <Menu.Items className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 focus:outline-none z-10 overflow-hidden">
                                                    {['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                                                        <Menu.Item key={status}>
                                                            {({ active }) => (
                                                                <button onClick={() => updatePlanMutation.mutate({ id: plan.id, status })} className={`${active ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' : 'text-gray-700 dark:text-white'} group flex w-full items-center px-4 py-2.5 text-xs font-semibold`}>
                                                                    {t(`treatments.${status.toLowerCase()}`)}
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    ))}
                                                </Menu.Items>
                                            </Menu>
                                        ) : (
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-1 ${STATUS_COLORS[plan.status]}`}>
                                                {t(`treatments.${plan.status.toLowerCase()}`)}
                                            </div>
                                        )}
                                        <p className="font-black text-2xl text-gray-900 dark:text-white">
                                            ${Number(plan.estimatedCost).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {plan.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 pl-16">
                                        {plan.description}
                                    </p>
                                )}

                                {plan.treatments && plan.treatments.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{Math.round((plan.treatments.filter(t => t.status === 'COMPLETED').length / plan.treatments.length) * 100)}% {t('treatments.complete_label')}</span>
                                            <span>{plan.treatments.filter(t => t.status === 'COMPLETED').length} / {plan.treatments.length}</span>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 w-full overflow-hidden">
                                            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-700" style={{ width: `${(plan.treatments.filter(t => t.status === 'COMPLETED').length / plan.treatments.length) * 100}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                                    {plan.treatments && plan.treatments.length > 0 && plan.treatments.map(t_item => (
                                        <div key={t_item.id} className="flex items-center justify-between text-sm py-2.5 px-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-white dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) ? (
                                                    <button onClick={() => updateTreatmentMutation.mutate({ id: t_item.id, status: t_item.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED' })} className="hover:scale-110 transition-transform" title={t('treatments.toggle_completion')}>
                                                        {STATUS_ICONS[t_item.status]}
                                                    </button>
                                                ) : (
                                                    <div>{STATUS_ICONS[t_item.status]}</div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${t_item.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
                                                        {t_item.name}
                                                    </span>
                                                    {t_item.tooth && <span className="text-[10px] text-gray-400 font-medium">{t('odontogram.table_tooth')}: {t_item.tooth}</span>}
                                                </div>
                                            </div>
                                            <span className="text-gray-500 font-semibold text-sm">${Number(t_item.cost).toLocaleString()}</span>
                                        </div>
                                    ))}

                                    {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                                        <>
                                            {addingProcedureTo === plan.id ? (
                                                <form onSubmit={(e) => handleAddProcedure(e, plan.id)} className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-800/50 animate-fade-in">
                                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                                        <input className="input-field text-xs py-2 rounded-lg" placeholder={t('treatments.procedure_name_placeholder')} value={procedureData.name} onChange={e => setProcedureData({ ...procedureData, name: e.target.value })} required autoFocus />
                                                        <input type="number" className="input-field text-xs py-2 rounded-lg" placeholder={t('treatments.cost_placeholder')} value={procedureData.cost} onChange={e => setProcedureData({ ...procedureData, cost: e.target.value })} required />
                                                        <input className="input-field text-xs py-2 rounded-lg" placeholder={t('treatments.tooth_opt_placeholder')} value={procedureData.tooth} onChange={e => setProcedureData({ ...procedureData, tooth: e.target.value })} />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button type="button" onClick={() => setAddingProcedureTo(null)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">{t('common.cancel')}</button>
                                                        <button type="submit" disabled={createTreatmentMutation.isPending} className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50">{t('common.add')}</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button onClick={() => setAddingProcedureTo(plan.id)} className="w-full mt-2 py-2.5 text-center text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl border border-dashed border-violet-200 dark:border-violet-800/30 transition-all">
                                                    + {t('treatments.add_procedure')}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                            <Stethoscope className="w-10 h-10 text-violet-300 dark:text-violet-600" />
                        </div>
                        <p className="text-gray-500 font-medium text-lg">{t('treatments.no_plans')}</p>
                        <p className="text-sm text-gray-400 mt-2">{t('treatments.create_plan_hint')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stethoscope, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { treatmentsApi } from '../../api';
import type { TreatmentPlan } from '../../types';

const statusIcons: Record<string, any> = {
    COMPLETED: <CheckCircle className="w-4 h-4 text-emerald-500 drop-shadow-sm" />,
    IN_PROGRESS: <Clock className="w-4 h-4 text-sky-500 drop-shadow-sm" />,
    PLANNED: <AlertCircle className="w-4 h-4 text-amber-500 drop-shadow-sm" />,
    CANCELLED: <AlertCircle className="w-4 h-4 text-red-500 drop-shadow-sm" />,
};

export default function TreatmentsPage() {
    const { t } = useTranslation();
    const { data: plans, isLoading } = useQuery({
        queryKey: ['treatment-plans'],
        queryFn: () => treatmentsApi.getPlans(),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent">{t('treatments.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('treatments.manage')}</p>
                </div>
            </div>

            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">
                    <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-30 animate-pulse" />
                    {t('treatments.loading')}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(plans || []).map((plan: TreatmentPlan) => (
                        <div key={plan.id} className="card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-violet-400 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow duration-300">
                                        <Stethoscope className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            {plan.patient?.firstName} {plan.patient?.lastName}
                                        </p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                                    plan.status === 'COMPLETED' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25'
                                    : plan.status === 'IN_PROGRESS' ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sky-500/25'
                                        : plan.status === 'CANCELLED' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25'
                                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-gray-500/25'
                                }`}>
                                    {statusIcons[plan.status]}
                                    {t(`treatments.${plan.status.toLowerCase()}`)}
                                </span>
                            </div>

                            {plan.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{plan.description}</p>
                            )}
                            <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                                ${Number(plan.estimatedCost).toLocaleString()}
                            </p>

                            {/* Progress bar */}
                            {plan.treatments && plan.treatments.length > 0 && (
                                <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl">
                                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                                        <span className="font-medium">{t('treatments.progress')}</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {plan.treatments.filter(t => t.status === 'COMPLETED').length}/{plan.treatments.length} {t('treatments.completed_count')}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white dark:bg-gray-800 rounded-full h-2.5 shadow-inner overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 rounded-full h-2.5 transition-all duration-700 shadow-lg shadow-emerald-500/30"
                                            style={{ width: `${(plan.treatments.filter(t => t.status === 'COMPLETED').length / plan.treatments.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Treatments list */}
                            {plan.treatments && (
                                <div className="space-y-2">
                                    {plan.treatments.map((tr) => (
                                        <div key={tr.id} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/80 dark:to-gray-800/50 text-sm hover:shadow-md hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-700/50 dark:hover:to-gray-800/50 transition-all duration-200 group/item">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    tr.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                                    : tr.status === 'IN_PROGRESS' ? 'bg-sky-100 dark:bg-sky-900/30'
                                                    : 'bg-gray-100 dark:bg-gray-800'
                                                }`}>
                                                    {statusIcons[tr.status]}
                                                </div>
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{tr.name}</span>
                                                {tr.tooth && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{t('treatments.tooth')} {tr.tooth}</span>}
                                            </div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900/50 px-3 py-1 rounded-full shadow-sm">
                                                ${Number(tr.cost).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {(!plans || plans.length === 0) && (
                        <div className="lg:col-span-2 card text-center py-16 text-gray-400">
                            <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Stethoscope className="w-10 h-10 text-violet-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{t('treatments.no_plans')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

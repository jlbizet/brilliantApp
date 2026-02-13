import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stethoscope, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { treatmentsApi } from '../../api';
import type { TreatmentPlan } from '../../types';

const statusIcons: Record<string, any> = {
    COMPLETED: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    IN_PROGRESS: <Clock className="w-4 h-4 text-sky-500" />,
    PLANNED: <AlertCircle className="w-4 h-4 text-gray-400" />,
    CANCELLED: <AlertCircle className="w-4 h-4 text-red-400" />,
};

export default function TreatmentsPage() {
    const { t } = useTranslation();
    const { data: plans, isLoading } = useQuery({
        queryKey: ['treatment-plans'],
        queryFn: () => treatmentsApi.getPlans(),
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('treatments.title')}</h1>
                <p className="text-gray-500 text-sm mt-1">{t('treatments.manage')}</p>
            </div>

            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">{t('treatments.loading')}</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(plans || []).map((plan: TreatmentPlan) => (
                        <div key={plan.id} className="card hover:shadow-glow transition-all duration-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
                                        <Stethoscope className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            {plan.patient?.firstName} {plan.patient?.lastName}
                                        </p>
                                    </div>
                                </div>
                                <span className={`badge ${plan.status === 'COMPLETED' ? 'badge-success'
                                    : plan.status === 'IN_PROGRESS' ? 'badge-info'
                                        : plan.status === 'CANCELLED' ? 'badge-danger'
                                            : 'badge-neutral'
                                    }`}>{t(`treatments.${plan.status.toLowerCase()}`)}</span>
                            </div>

                            {plan.description && <p className="text-sm text-gray-500 mb-3">{plan.description}</p>}
                            <p className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                ${Number(plan.estimatedCost).toLocaleString()}
                            </p>

                            {/* Progress bar */}
                            {plan.treatments && plan.treatments.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>{t('treatments.progress')}</span>
                                        <span>{plan.treatments.filter(t => t.status === 'COMPLETED').length}/{plan.treatments.length} {t('treatments.completed_count')}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full h-2 transition-all duration-500"
                                            style={{ width: `${(plan.treatments.filter(t => t.status === 'COMPLETED').length / plan.treatments.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Treatments list */}
                            {plan.treatments && (
                                <div className="space-y-2">
                                    {plan.treatments.map((tr) => (
                                        <div key={tr.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                                            <div className="flex items-center gap-2">
                                                {statusIcons[tr.status]}
                                                <span className="text-gray-700 dark:text-gray-300">{tr.name}</span>
                                                {tr.tooth && <span className="text-xs text-gray-400">({t('treatments.tooth')} {tr.tooth})</span>}
                                            </div>
                                            <span className="font-medium text-gray-600 dark:text-gray-400">${Number(tr.cost).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {(!plans || plans.length === 0) && (
                        <div className="lg:col-span-2 card text-center py-12 text-gray-400">{t('treatments.no_plans')}</div>
                    )}
                </div>
            )}
        </div>
    );
}

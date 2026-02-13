import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Plus, Trash2, Check, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores';
import OdontogramGrid from './odontogram/OdontogramGrid';
import { Surface, ConditionType } from './odontogram/Tooth';
import { patientsApi, odontogramApi } from '../../../api';

interface OdontogramTabProps {
    patientId: string;
}

export default function OdontogramTab({ patientId }: OdontogramTabProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [selectedTool, setSelectedTool] = useState<ConditionType>('CARIES');
    const [isChild, setIsChild] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const TOOLS = [
        { id: 'CARIES', label: t('odontogram.tool_caries'), color: '#ef4444', icon: AlertCircle },
        { id: 'FILLING', label: t('odontogram.tool_filling'), color: '#3b82f6', icon: PenTool },
        { id: 'EXTRACTION', label: t('odontogram.tool_extraction'), color: '#6b7280', icon: Trash2 },
        { id: 'CROWN', label: t('odontogram.tool_crown'), color: '#eab308', icon: Plus },
        { id: 'HEALTHY', label: t('odontogram.tool_healthy'), color: '#059669', icon: Check },
    ];

    const { data: odontogram, isLoading } = useQuery({
        queryKey: ['odontogram', patientId],
        queryFn: () => odontogramApi.get(patientId),
    });

    const addConditionMutation = useMutation({
        mutationFn: (data: any) => odontogramApi.addCondition(patientId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['odontogram', patientId] });
            toast.success(t('odontogram.update_success') || 'Condition updated');
        },
        onError: () => toast.error(t('odontogram.update_error') || 'Failed to update condition'),
    });

    const handleToothClick = (toothId: string, surface: Surface) => {
        if (!odontogram) return;

        const payload = {
            tooth: toothId,
            type: selectedTool,
            surfaces: selectedTool === 'EXTRACTION' || selectedTool === 'MISSING' ? [] : [surface],
            notes: `Added via odontogram (${selectedTool})`
        };

        addConditionMutation.mutate(payload);
    };

    const conditions = odontogram?.conditions || [];
    const totalPages = Math.ceil(conditions.length / pageSize);
    const paginatedConditions = conditions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (isLoading) return <div className="p-12 text-center text-gray-400">{t('odontogram.loading')}</div>;

    return (
        <div className="card space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('odontogram.title')}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsChild(false)}
                        className={`btn-sm ${!isChild ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        {t('odontogram.adult')}
                    </button>
                    <button
                        onClick={() => setIsChild(true)}
                        className={`btn-sm ${isChild ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        {t('odontogram.child')}
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-1 ${['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) ? 'lg:grid-cols-4' : ''} gap-6`}>
                {/* Tools Panel */}
                {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('common.tools')}</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                            {TOOLS.map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool.id as ConditionType)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedTool === tool.id
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                                        : 'border-transparent hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    <tool.icon className="w-5 h-5" style={{ color: tool.id === selectedTool ? undefined : tool.color }} />
                                    <span className="font-semibold text-sm">{tool.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-xs text-blue-600 dark:text-blue-400">
                            <p className="font-bold mb-1">{t('odontogram.how_to_use')}:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>{t('odontogram.instruction_1')}</li>
                                <li>{t('odontogram.instruction_2')}</li>
                                <li>{t('odontogram.instruction_3')}</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Chart Area */}
                <div className={`${['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) ? 'lg:col-span-3' : ''} bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex justify-center overflow-x-auto`}>
                    <OdontogramGrid
                        conditions={conditions}
                        onToothClick={['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) ? handleToothClick : () => { }}
                        isChild={isChild}
                    />
                </div>
            </div>

            {/* Condition List / History */}
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('odontogram.recent_conditions')}</h4>
                    {totalPages > 1 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn-secondary btn-sm disabled:opacity-50"
                            >
                                {t('common.previous')}
                            </button>
                            <span className="text-xs text-gray-500 flex items-center px-2">
                                {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn-secondary btn-sm disabled:opacity-50"
                            >
                                {t('common.next')}
                            </button>
                        </div>
                    )}
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                            <tr>
                                <th className="p-3">{t('odontogram.table_tooth')}</th>
                                <th className="p-3">{t('odontogram.table_condition')}</th>
                                <th className="p-3">{t('odontogram.table_surfaces')}</th>
                                <th className="p-3">{t('common.date')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedConditions.map((c: any) => (
                                <tr key={c.id}>
                                    <td className="p-3 font-bold text-gray-900 dark:text-white">{c.tooth}</td>
                                    <td className="p-3"><span className="badge badge-info">{t(`odontogram.tool_${c.type.toLowerCase()}`)}</span></td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{c.surfaces?.join(', ') || '-'}</td>
                                    <td className="p-3 opacity-60 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {!conditions.length && (
                                <tr><td colSpan={4} className="p-6 text-center text-gray-400">{t('odontogram.no_conditions')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

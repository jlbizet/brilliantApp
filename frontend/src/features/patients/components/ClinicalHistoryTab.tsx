import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Heart, AlertTriangle, Plus, X, Activity, Shield, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores';
import { patientsApi } from '../../../api';
import type { Patient } from '../../../types';

interface ClinicalHistoryTabProps {
    patient: Patient;
}

export default function ClinicalHistoryTab({ patient }: ClinicalHistoryTabProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [showConditionForm, setShowConditionForm] = useState(false);
    const [showAllergyForm, setShowAllergyForm] = useState(false);

    const [conditionData, setConditionData] = useState({ condition: '', description: '', isOngoing: true });
    const [allergyData, setAllergyData] = useState({ allergen: '', severity: 'moderate', reaction: '' });

    const conditionMutation = useMutation({
        mutationFn: (data: any) => patientsApi.addMedicalHistory(patient.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
            toast.success(t('patients.medical_history_success') || 'Medical history updated');
            setShowConditionForm(false);
            setConditionData({ condition: '', description: '', isOngoing: true });
        },
    });

    const allergyMutation = useMutation({
        mutationFn: (data: any) => patientsApi.addAllergy(patient.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
            toast.success(t('patients.allergy_success') || 'Allergy added');
            setShowAllergyForm(false);
            setAllergyData({ allergen: '', severity: 'moderate', reaction: '' });
        },
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medical History */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30">
                            <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        {t('patients.medical_conditions')}
                    </h3>
                    {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                        <button 
                            onClick={() => setShowConditionForm(true)} 
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-medium text-sm hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> {t('common.add')}
                        </button>
                    )}
                </div>

                {showConditionForm && (
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-rose-200 dark:border-rose-800/50 p-5 animate-slide-up overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-500" />
                        <button onClick={() => setShowConditionForm(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">{t('patients.add_condition')}</h4>
                        <form onSubmit={(e) => { e.preventDefault(); conditionMutation.mutate(conditionData); }} className="space-y-4">
                            <input className="input-field rounded-xl bg-gray-50 dark:bg-gray-700/50" placeholder={t('patients.condition_name_placeholder')} value={conditionData.condition} onChange={e => setConditionData({ ...conditionData, condition: e.target.value })} required />
                            <textarea className="input-field rounded-xl bg-gray-50 dark:bg-gray-700/50 min-h-[80px]" placeholder={t('patients.condition_notes_placeholder')} value={conditionData.description} onChange={e => setConditionData({ ...conditionData, description: e.target.value })} />
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 cursor-pointer">
                                <input type="checkbox" checked={conditionData.isOngoing} onChange={e => setConditionData({ ...conditionData, isOngoing: e.target.checked })} className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500" />
                                {t('patients.ongoing_condition')}
                            </label>
                            <button type="submit" disabled={conditionMutation.isPending} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {conditionMutation.isPending ? t('common.saving') : t('patients.add_condition')}
                            </button>
                        </form>
                    </div>
                )}

                <div className="space-y-4">
                    {patient.medicalHistory?.length ? (
                        patient.medicalHistory.map((h) => (
                            <div key={h.id} className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700/50 p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${h.isOngoing ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <div className="pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{h.condition}</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${h.isOngoing ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                                            {h.isOngoing ? t('patients.status_ongoing') : t('patients.status_resolved')}
                                        </span>
                                    </div>
                                    {h.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{h.description}</p>}
                                    <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                                        <Activity className="w-3 h-3" />
                                        {t('common.added_on')} {new Date().toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-rose-300 dark:text-rose-600" />
                            </div>
                            <p className="text-gray-500 font-medium">{t('patients.no_medical_history')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Allergies */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        {t('patients.allergies')}
                    </h3>
                    {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                        <button 
                            onClick={() => setShowAllergyForm(true)} 
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> {t('common.add')}
                        </button>
                    )}
                </div>

                {showAllergyForm && (
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-200 dark:border-amber-800/50 p-5 animate-slide-up overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
                        <button onClick={() => setShowAllergyForm(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">{t('patients.add_allergy')}</h4>
                        <form onSubmit={(e) => { e.preventDefault(); allergyMutation.mutate(allergyData); }} className="space-y-4">
                            <input className="input-field rounded-xl bg-gray-50 dark:bg-gray-700/50" placeholder={t('patients.allergen_placeholder')} value={allergyData.allergen} onChange={e => setAllergyData({ ...allergyData, allergen: e.target.value })} required />
                            <select className="input-field rounded-xl bg-gray-50 dark:bg-gray-700/50" value={allergyData.severity} onChange={e => setAllergyData({ ...allergyData, severity: e.target.value })}>
                                <option value="mild">{t('patients.severity_mild')}</option>
                                <option value="moderate">{t('patients.severity_moderate')}</option>
                                <option value="severe">{t('patients.severity_severe')}</option>
                            </select>
                            <input className="input-field rounded-xl bg-gray-50 dark:bg-gray-700/50" placeholder={t('patients.allergy_reaction_placeholder')} value={allergyData.reaction} onChange={e => setAllergyData({ ...allergyData, reaction: e.target.value })} />
                            <button type="submit" disabled={allergyMutation.isPending} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {allergyMutation.isPending ? t('common.saving') : t('patients.add_allergy')}
                            </button>
                        </form>
                    </div>
                )}

                <div className="space-y-4">
                    {patient.allergies?.length ? (
                        patient.allergies.map((a) => (
                            <div key={a.id} className="group relative bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-2xl shadow-md border border-red-100 dark:border-red-900/30 p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${a.severity === 'severe' ? 'bg-red-500' : a.severity === 'moderate' ? 'bg-amber-400' : 'bg-yellow-300'}`} />
                                <div className="pl-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle className={`w-4 h-4 ${a.severity === 'severe' ? 'text-red-500' : a.severity === 'moderate' ? 'text-amber-500' : 'text-yellow-400'}`} />
                                            <p className="font-bold text-red-700 dark:text-red-400 text-lg">{a.allergen}</p>
                                        </div>
                                        {a.reaction && <p className="text-xs text-red-500/80 mt-1">{a.reaction}</p>}
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${a.severity === 'severe' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : a.severity === 'moderate' ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/30' : 'bg-yellow-300 text-yellow-900'}`}>
                                        {t(`patients.severity_${a.severity.toLowerCase()}`)}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-emerald-400 dark:text-emerald-500" />
                            </div>
                            <p className="text-gray-500 font-medium">{t('patients.no_known_allergies')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

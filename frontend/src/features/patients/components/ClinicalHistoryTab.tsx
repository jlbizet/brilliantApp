import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Heart, AlertTriangle, Plus, X, Activity } from 'lucide-react';
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
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500" /> {t('patients.medical_conditions')}
                    </h3>
                    {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                        <button onClick={() => setShowConditionForm(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-primary-600">
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {showConditionForm && (
                    <div className="card bg-rose-50/30 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/20 relative animate-slide-up">
                        <button onClick={() => setShowConditionForm(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
                        <form onSubmit={(e) => { e.preventDefault(); conditionMutation.mutate(conditionData); }} className="space-y-3">
                            <input className="input-field bg-white" placeholder={t('patients.condition_name_placeholder')} value={conditionData.condition} onChange={e => setConditionData({ ...conditionData, condition: e.target.value })} required />
                            <textarea className="input-field bg-white" placeholder={t('patients.condition_notes_placeholder')} value={conditionData.description} onChange={e => setConditionData({ ...conditionData, description: e.target.value })} />
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <input type="checkbox" checked={conditionData.isOngoing} onChange={e => setConditionData({ ...conditionData, isOngoing: e.target.checked })} />
                                {t('patients.ongoing_condition')}
                            </label>
                            <button type="submit" disabled={conditionMutation.isPending} className="btn-primary w-full">{t('patients.add_condition')}</button>
                        </form>
                    </div>
                )}

                <div className="space-y-3">
                    {patient.medicalHistory?.length ? (
                        patient.medicalHistory.map((h) => (
                            <div key={h.id} className="p-3 rounded-xl bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-900 dark:text-white">{h.condition}</p>
                                    <span className={`badge ${h.isOngoing ? 'badge-warning' : 'badge-success'}`}>
                                        {h.isOngoing ? t('patients.status_ongoing') : t('patients.status_resolved')}
                                    </span>
                                </div>
                                {h.description && <p className="text-xs text-gray-500 mt-1">{h.description}</p>}
                                <p className="text-[10px] text-gray-400 mt-2">{t('common.added_on')} {new Date().toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic">{t('patients.no_medical_history')}</p>
                    )}
                </div>
            </div>

            {/* Allergies */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> {t('patients.allergies')}
                    </h3>
                    {['ADMIN', 'DENTIST', 'HYGIENIST'].includes(user?.role as string) && (
                        <button onClick={() => setShowAllergyForm(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-primary-600">
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {showAllergyForm && (
                    <div className="card bg-amber-50/30 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20 relative animate-slide-up">
                        <button onClick={() => setShowAllergyForm(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
                        <form onSubmit={(e) => { e.preventDefault(); allergyMutation.mutate(allergyData); }} className="space-y-3">
                            <input className="input-field bg-white" placeholder={t('patients.allergen_placeholder')} value={allergyData.allergen} onChange={e => setAllergyData({ ...allergyData, allergen: e.target.value })} required />
                            <select className="input-field bg-white" value={allergyData.severity} onChange={e => setAllergyData({ ...allergyData, severity: e.target.value })}>
                                <option value="mild">{t('patients.severity_mild')}</option>
                                <option value="moderate">{t('patients.severity_moderate')}</option>
                                <option value="severe">{t('patients.severity_severe')}</option>
                            </select>
                            <input className="input-field bg-white" placeholder={t('patients.allergy_reaction_placeholder')} value={allergyData.reaction} onChange={e => setAllergyData({ ...allergyData, reaction: e.target.value })} />
                            <button type="submit" disabled={allergyMutation.isPending} className="btn-primary w-full">{t('patients.add_allergy')}</button>
                        </form>
                    </div>
                )}

                <div className="space-y-3">
                    {patient.allergies?.length ? (
                        patient.allergies.map((a) => (
                            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20">
                                <div>
                                    <p className="font-semibold text-red-700 dark:text-red-400">{a.allergen}</p>
                                    {a.reaction && <p className="text-xs text-red-500">{a.reaction}</p>}
                                </div>
                                <span className={`badge ${a.severity === 'severe' ? 'badge-danger' : a.severity === 'moderate' ? 'badge-warning' : 'badge-neutral'}`}>
                                    {t(`patients.severity_${a.severity.toLowerCase()}`)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic">{t('patients.no_known_allergies')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

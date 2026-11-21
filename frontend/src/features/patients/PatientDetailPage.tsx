import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Phone, Mail, Calendar, Heart, AlertTriangle, FileText, Activity, Layers, Edit2, Check, X, Stethoscope } from 'lucide-react';
import { DatePicker } from '../../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores';
import { patientsApi } from '../../api';
import DocumentsTab from './components/DocumentsTab';
import ClinicalHistoryTab from './components/ClinicalHistoryTab';
import BillingTab from './components/BillingTab';
import TreatmentsTab from './components/TreatmentsTab';
import OdontogramTab from './components/OdontogramTab';

type TabType = 'overview' | 'clinical' | 'documents' | 'billing' | 'treatments' | 'odontogram';

export default function PatientDetailPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isEditing, setIsEditing] = useState(false);

    const { data: patient, isLoading } = useQuery({
        queryKey: ['patient', id],
        queryFn: () => patientsApi.getOne(id!),
        enabled: !!id,
    });

    const [editData, setEditData] = useState<any>(null);

    const ALLOWED_FIELDS = [
        'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
        'address', 'city', 'state', 'zipCode', 'emergencyContact', 'emergencyPhone',
        'insuranceProvider', 'insurancePolicyNumber', 'insuranceGroupNumber', 'notes'
    ];

    const updateMutation = useMutation({
        mutationFn: (data: any) => {
            const sanitizedData = Object.keys(data)
                .filter(key => ALLOWED_FIELDS.includes(key))
                .reduce((obj: any, key) => {
                    obj[key] = data[key];
                    return obj;
                }, {});

            if (sanitizedData.dateOfBirth) {
                sanitizedData.dateOfBirth = new Date(sanitizedData.dateOfBirth).toISOString();
            }

            return patientsApi.update(id!, sanitizedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient', id] });
            toast.success(t('patients.update_success'));
            setIsEditing(false);
        },
        onError: () => toast.error(t('patients.update_error')),
    });

    if (isLoading) return <div className="card text-center py-12 text-gray-400 animate-pulse">{t('patients.loading_details')}</div>;
    if (!patient) return <div className="card text-center py-12 text-gray-400">{t('patients.not_found')}</div>;

    const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const handleEditStart = () => {
        const formattedDate = new Date(patient.dateOfBirth).toISOString().split('T')[0];
        setEditData({ ...patient, dateOfBirth: formattedDate });
        setIsEditing(true);
    };

    const handleEditSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(editData);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back & Actions */}
            <div className="flex items-center justify-between">
                <Link to="/patients" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors group">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    {t('patients.back')}
                </Link>
                {['ADMIN', 'DENTIST', 'RECEPTIONIST'].includes(user?.role as string) && (
                    <div className="flex gap-3">
                        {!isEditing ? (
                            <button onClick={handleEditStart} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all">
                                <Edit2 className="w-4 h-4" /> {t('patients.edit_profile')}
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(false)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                                    <X className="w-4 h-4" /> {t('common.cancel')}
                                </button>
                                <button onClick={handleEditSave} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all">
                                    <Check className="w-4 h-4" /> {t('common.save')}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Patient Header Card */}
            <div className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 transition-all duration-300 ${isEditing ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}>
                {/* Background Glow Effect */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                
                <div className="relative p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-primary-400 via-primary-500 to-violet-600 rounded-3xl flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-2xl shadow-primary-500/30 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                <span className="relative z-10">{patient.firstName[0]}{patient.lastName[0]}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-gray-800" />
                        </div>

                        <div className="flex-1 space-y-3">
                            {isEditing ? (
                                <div className="flex gap-3 flex-wrap md:flex-nowrap">
                                    <input className="input-field !text-xl !py-2 font-bold flex-1 rounded-xl" value={editData?.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} placeholder={t('patients.first_name')} />
                                    <input className="input-field !text-xl !py-2 font-bold flex-1 rounded-xl" value={editData?.lastName} onChange={e => setEditData({ ...editData, lastName: e.target.value })} placeholder={t('patients.last_name')} />
                                </div>
                            ) : (
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    {patient.firstName} {patient.lastName}
                                </h1>
                            )}

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                {isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                        <span className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50"><Phone className="w-4 h-4 text-primary-500" /><input className="input-field !py-1 !rounded-lg bg-transparent border-0 focus:ring-0" value={editData?.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder={t('patients.phone')} /></span>
                                        <span className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50"><Mail className="w-4 h-4 text-primary-500" /><input className="input-field !py-1 !rounded-lg bg-transparent border-0 focus:ring-0" value={editData?.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} placeholder={t('patients.email')} /></span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                                            <Phone className="w-4 h-4 text-primary-500" />{patient.phone}
                                        </span>
                                        {patient.email && <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300"><Mail className="w-4 h-4 text-primary-500" />{patient.email}</span>}
                                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300"><Calendar className="w-4 h-4 text-primary-500" />{age}y • {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {!isEditing && (
                            <div className="hidden lg:flex gap-4 pr-4">
                                <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border border-primary-100 dark:border-primary-800/30 group cursor-pointer hover:shadow-lg hover:shadow-primary-500/10 transition-all" onClick={() => setActiveTab('overview')}>
                                    <p className="text-2xl font-black text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">{patient._count?.appointments || 0}</p>
                                    <p className="text-[10px] uppercase font-bold text-primary-500/70 tracking-widest">{t('patients.tab_overview_apts')}</p>
                                </div>
                                <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10 border border-violet-100 dark:border-violet-800/30 group cursor-pointer hover:shadow-lg hover:shadow-violet-500/10 transition-all" onClick={() => setActiveTab('documents')}>
                                    <p className="text-2xl font-black text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">{patient._count?.documents || 0}</p>
                                    <p className="text-[10px] uppercase font-bold text-violet-500/70 tracking-widest">{t('patients.tab_overview_docs')}</p>
                                </div>
                                <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border border-emerald-100 dark:border-emerald-800/30 group cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 transition-all" onClick={() => setActiveTab('billing')}>
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">{patient._count?.invoices || 0}</p>
                                    <p className="text-[10px] uppercase font-bold text-emerald-500/70 tracking-widest">{t('patients.tab_overview_paid')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-t border-gray-100 dark:border-gray-700/50 mt-6 overflow-x-auto scrollbar-none bg-gray-50/50 dark:bg-gray-800/30">
                    {[
                        { id: 'overview', label: t('patients.tab_overview'), icon: Layers },
                        { id: 'odontogram', label: t('patients.tab_odontogram'), icon: Activity },
                        { id: 'clinical', label: t('patients.tab_clinical'), icon: Heart },
                        { id: 'treatments', label: t('patients.tab_treatments'), icon: Stethoscope },
                        { id: 'documents', label: t('patients.tab_documents'), icon: FileText },
                        { id: 'billing', label: t('patients.tab_billing'), icon: Activity },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                disabled={isEditing}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all whitespace-nowrap ${isActive
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-transparent'}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                {tab.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-violet-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
                {(activeTab === 'overview' || isEditing) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Info Group */}
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-violet-500 to-primary-500" />
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
                                            <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        {t('patients.personal_info')}
                                    </h3>
                                    {isEditing ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.gender')}</label>
                                                <select className="input-field rounded-xl" value={editData?.gender} onChange={e => setEditData({ ...editData, gender: e.target.value })}>
                                                    <option value="MALE">{t('patients.gender_male')}</option>
                                                    <option value="FEMALE">{t('patients.gender_female')}</option>
                                                    <option value="OTHER">{t('patients.gender_other')}</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.date_of_birth')}</label>
                                                <DatePicker
                                                    value={editData?.dateOfBirth || ''}
                                                    onChange={(date) => setEditData({ ...editData, dateOfBirth: date })}
                                                    className="rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.address')}</label>
                                                <input className="input-field rounded-xl" value={editData?.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.city')}</label>
                                                <input className="input-field rounded-xl" value={editData?.city || ''} onChange={e => setEditData({ ...editData, city: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.state')}</label>
                                                <input className="input-field rounded-xl" value={editData?.state || ''} onChange={e => setEditData({ ...editData, state: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.zipCode')}</label>
                                                <input className="input-field rounded-xl" value={editData?.zipCode || ''} onChange={e => setEditData({ ...editData, zipCode: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.emergency_contact')}</label>
                                                <input className="input-field rounded-xl" value={editData?.emergencyContact || ''} onChange={e => setEditData({ ...editData, emergencyContact: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.emergency_contact_phone')}</label>
                                                <input className="input-field rounded-xl" value={editData?.emergencyPhone || ''} onChange={e => setEditData({ ...editData, emergencyPhone: e.target.value })} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                            {[
                                                [t('patients.gender'), patient.gender],
                                                [t('patients.date_of_birth'), new Date(patient.dateOfBirth).toLocaleDateString()],
                                                [t('patients.address'), [patient.address, patient.city, patient.state, patient.zipCode].filter(Boolean).join(', ') || t('common.not_applicable')],
                                                [t('patients.emergency_contact'), `${patient.emergencyContact || t('common.not_applicable')} (${patient.emergencyPhone || '-'})`],
                                                [t('patients.insurance_provider'), patient.insuranceProvider || t('common.not_applicable')],
                                                [t('patients.policy_number'), patient.insurancePolicyNumber || t('common.not_applicable')],
                                            ].map(([label, value]) => (
                                                <div key={label} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50">
                                                    <span className="text-gray-500 font-medium">{label}</span>
                                                    <span className="text-gray-900 dark:text-white font-semibold text-right">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('patients.insurance_info')}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.insurance_provider')}</label>
                                                <input className="input-field rounded-xl" value={editData?.insuranceProvider || ''} onChange={e => setEditData({ ...editData, insuranceProvider: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.policy_number')}</label>
                                                <input className="input-field rounded-xl" value={editData?.insurancePolicyNumber || ''} onChange={e => setEditData({ ...editData, insurancePolicyNumber: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.insurance_group_number')}</label>
                                                <input className="input-field rounded-xl" value={editData?.insuranceGroupNumber || ''} onChange={e => setEditData({ ...editData, insuranceGroupNumber: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('patients.notes')}</h3>
                                        <textarea className="input-field min-h-[120px] rounded-xl" value={editData?.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {!isEditing && (
                                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30">
                                                <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            {t('patients.treatment_progress')}
                                        </h3>
                                        {patient.treatmentPlans?.length ? (
                                            <div className="space-y-4">
                                                {patient.treatmentPlans.slice(0, 2).map((plan: any) => (
                                                    <div key={plan.id} className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/30 dark:to-gray-800/30 border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-shadow group">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="font-bold text-gray-900 dark:text-white text-lg">{plan.name}</span>
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                                                {t(`treatments.${plan.status.toLowerCase()}`)}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                                            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full w-2/3 rounded-full" />
                                                        </div>
                                                        <div className="flex justify-between mt-3 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                                            <span>{t('treatments.estimated_cost')}: <span className="text-violet-600 dark:text-violet-400">${Number(plan.estimatedCost).toLocaleString()}</span></span>
                                                            <span>66% {t('treatments.complete_label')}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 bg-gray-50/50 dark:bg-gray-700/20 rounded-xl">
                                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="italic">{t('patients.no_active_treatment_plans')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="space-y-6">
                                {/* Medical Alerts */}
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white shadow-xl shadow-rose-500/20">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative p-6">
                                        <h3 className="font-bold mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            {t('patients.medical_alerts')}
                                        </h3>
                                        <div className="space-y-3">
                                            {patient.allergies?.map((a: any) => (
                                                <div key={a.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors">
                                                    <div className="p-2 rounded-lg bg-amber-400/20">
                                                        <AlertTriangle className="w-5 h-5 text-amber-200" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{a.allergen}</p>
                                                        <p className="text-xs opacity-80">{t(`patients.severity_${a.severity.toLowerCase()}`)} {t('patients.severity')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {!patient.allergies?.length && (
                                                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                                                    <p className="text-sm opacity-80 italic">{t('patients.no_known_allergies')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Upcoming Appointments */}
                                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
                                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            {t('appointments.upcoming')}
                                        </h3>
                                        <div className="space-y-3">
                                            {patient.appointments?.filter((a: any) => new Date(a.startTime) > new Date()).slice(0, 3).map((a: any) => (
                                                <div key={a.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700/30">
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex flex-col items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20">
                                                        <span>{new Date(a.startTime).getDate()}</span>
                                                        <span className="text-[8px] uppercase">{new Date(a.startTime).toLocaleString('default', { month: 'short' })}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900 dark:text-white">{a.title}</p>
                                                        <p className="text-xs text-gray-500">{new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {!patient.appointments?.filter((a: any) => new Date(a.startTime) > new Date()).length && (
                                                <div className="text-center py-6 text-gray-400 bg-gray-50/50 dark:bg-gray-700/20 rounded-xl">
                                                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm italic">{t('appointments.no_upcoming')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!isEditing && (
                    <>
                        {activeTab === 'odontogram' && <OdontogramTab patientId={patient.id} />}
                        {activeTab === 'clinical' && <ClinicalHistoryTab patient={patient} />}
                        {activeTab === 'treatments' && <TreatmentsTab patientId={patient.id} />}
                        {activeTab === 'documents' && <DocumentsTab patientId={patient.id} />}
                        {activeTab === 'billing' && <BillingTab patientId={patient.id} />}
                    </>
                )}
            </div>
        </div>
    );
}

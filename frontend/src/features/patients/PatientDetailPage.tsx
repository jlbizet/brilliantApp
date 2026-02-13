import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Phone, Mail, Calendar, Heart, AlertTriangle, FileText, Activity, Layers, Edit2, Check, X, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
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

            // Format dateOfBirth to ISO if it's not already
            if (sanitizedData.dateOfBirth) {
                sanitizedData.dateOfBirth = new Date(sanitizedData.dateOfBirth).toISOString();
            }

            return patientsApi.update(id!, sanitizedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient', id] });
            toast.success(t('patients.update_success') || 'Patient profile updated');
            setIsEditing(false);
        },
        onError: () => toast.error(t('patients.update_error') || 'Update failed'),
    });

    if (isLoading) return <div className="card text-center py-12 text-gray-400 animate-pulse">{t('patients.loading_details')}</div>;
    if (!patient) return <div className="card text-center py-12 text-gray-400">{t('patients.not_found')}</div>;

    const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const handleEditStart = () => {
        // Prepare data for editing, ensuring date is in YYYY-MM-DD for input[type=date]
        const formattedDate = new Date(patient.dateOfBirth).toISOString().split('T')[0];
        setEditData({ ...patient, dateOfBirth: formattedDate });
        setIsEditing(true);
    };

    const handleEditSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(editData);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back & Actions */}
            <div className="flex items-center justify-between">
                <Link to="/patients" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {t('patients.back')}
                </Link>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <button onClick={handleEditStart} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2">
                            <Edit2 className="w-3.5 h-3.5" /> {t('patients.edit_profile')}
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(false)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2">
                                <X className="w-3.5 h-3.5" /> {t('common.cancel')}
                            </button>
                            <button onClick={handleEditSave} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2">
                                <Check className="w-3.5 h-3.5" /> {t('common.save')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Patient Header Card */}
            <div className={`card transition-all duration-300 ${isEditing ? 'border-primary-200 bg-primary-50/10' : ''}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-700 rounded-[2rem] flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-primary-500/20 relative group">
                        {patient.firstName[0]}{patient.lastName[0]}
                    </div>

                    <div className="flex-1 space-y-2">
                        {isEditing ? (
                            <div className="flex gap-2 flex-wrap md:flex-nowrap">
                                <input className="input-field !text-lg !py-1 font-bold flex-1" value={editData?.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} placeholder={t('patients.first_name')} />
                                <input className="input-field !text-lg !py-1 font-bold flex-1" value={editData?.lastName} onChange={e => setEditData({ ...editData, lastName: e.target.value })} placeholder={t('patients.last_name')} />
                            </div>
                        ) : (
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {patient.firstName} {patient.lastName}
                            </h1>
                        )}

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                            {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /><input className="input-field !py-0.5" value={editData?.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder={t('patients.phone')} /></span>
                                    <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /><input className="input-field !py-0.5" value={editData?.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} placeholder={t('patients.email')} /></span>
                                </div>
                            ) : (
                                <>
                                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-primary-500" />{patient.phone}</span>
                                    {patient.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-primary-500" />{patient.email}</span>}
                                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary-500" />{age}y • {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="hidden lg:flex gap-6 pr-4">
                            <div className="text-center group cursor-pointer" onClick={() => setActiveTab('overview')}>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{patient._count?.appointments || 0}</p>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{t('patients.tab_overview_apts')}</p>
                            </div>
                            <div className="text-center group cursor-pointer" onClick={() => setActiveTab('documents')}>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{patient._count?.documents || 0}</p>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{t('patients.tab_overview_docs')}</p>
                            </div>
                            <div className="text-center group cursor-pointer" onClick={() => setActiveTab('billing')}>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{patient._count?.invoices || 0}</p>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{t('patients.tab_overview_paid')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="flex border-t border-gray-100 dark:border-gray-800 mt-8 -mb-4 -mx-4 md:-mx-6 overflow-x-auto scrollbar-none">
                    {[
                        { id: 'overview', label: t('patients.tab_overview'), icon: Layers },
                        { id: 'odontogram', label: t('patients.tab_odontogram'), icon: Activity },
                        { id: 'clinical', label: t('patients.tab_clinical'), icon: Heart },
                        { id: 'treatments', label: t('patients.tab_treatments'), icon: Stethoscope },
                        { id: 'documents', label: t('patients.tab_documents'), icon: FileText },
                        { id: 'billing', label: t('patients.tab_billing'), icon: Activity },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                disabled={isEditing}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600 bg-primary-50/30'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {(activeTab === 'overview' || isEditing) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Info Group */}
                            <div className="card">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('patients.personal_info')}</h3>
                                {isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.gender')}</label>
                                            <select
                                                className="input-field"
                                                value={editData?.gender}
                                                onChange={e => setEditData({ ...editData, gender: e.target.value })}
                                            >
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.date_of_birth')}</label>
                                            <input
                                                type="date"
                                                className="input-field"
                                                value={editData?.dateOfBirth}
                                                onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.address')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.address || ''}
                                                onChange={e => setEditData({ ...editData, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.city')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.city || ''}
                                                onChange={e => setEditData({ ...editData, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.state')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.state || ''}
                                                onChange={e => setEditData({ ...editData, state: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.zipCode')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.zipCode || ''}
                                                onChange={e => setEditData({ ...editData, zipCode: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.emergency_contact')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.emergencyContact || ''}
                                                onChange={e => setEditData({ ...editData, emergencyContact: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.emergency_contact_phone')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.emergencyPhone || ''}
                                                onChange={e => setEditData({ ...editData, emergencyPhone: e.target.value })}
                                            />
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
                                            <div key={label} className="flex justify-between border-b border-gray-50 dark:border-gray-800 pb-2">
                                                <span className="text-gray-500 font-medium">{label}</span>
                                                <span className="text-gray-900 dark:text-white font-semibold text-right">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Insurance Info Card (Only showing in edit mode for clarity or as separate card) */}
                            {isEditing && (
                                <div className="card">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('patients.insurance_info')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.insurance_provider')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.insuranceProvider || ''}
                                                onChange={e => setEditData({ ...editData, insuranceProvider: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.policy_number')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.insurancePolicyNumber || ''}
                                                onChange={e => setEditData({ ...editData, insurancePolicyNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('patients.insurance_group_number')}</label>
                                            <input
                                                className="input-field"
                                                value={editData?.insuranceGroupNumber || ''}
                                                onChange={e => setEditData({ ...editData, insuranceGroupNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes Card */}
                            {isEditing && (
                                <div className="card">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('patients.notes')}</h3>
                                    <textarea
                                        className="input-field min-h-[100px]"
                                        value={editData?.notes || ''}
                                        onChange={e => setEditData({ ...editData, notes: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Recent Activity / Treatment Plans */}
                            {!isEditing && (
                                <div className="card">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('patients.treatment_progress')}</h3>
                                    {patient.treatmentPlans?.length ? (
                                        <div className="space-y-4">
                                            {patient.treatmentPlans.slice(0, 2).map((plan: any) => (
                                                <div key={plan.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-gray-900 dark:text-white">{plan.name}</span>
                                                        <span className="badge badge-info">{t(`treatments.${plan.status.toLowerCase()}`)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-primary-500 h-full w-2/3" />
                                                    </div>
                                                    <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                        <span>{t('treatments.estimated_cost')}: ${Number(plan.estimatedCost).toLocaleString()}</span>
                                                        <span>66% {t('treatments.complete_label')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 italic text-sm">{t('patients.no_active_treatment_plans')}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="space-y-6">
                                {/* Quick Stats / Contact Information */}
                                <div className="card bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
                                    <h3 className="font-bold mb-4 opacity-90">{t('patients.medical_alerts')}</h3>
                                    <div className="space-y-3">
                                        {patient.allergies?.map((a: any) => (
                                            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/20">
                                                <AlertTriangle className="w-5 h-5 text-amber-300" />
                                                <div>
                                                    <p className="text-sm font-bold">{a.allergen}</p>
                                                    <p className="text-[10px] opacity-70 uppercase tracking-wider">{t(`patients.severity_${a.severity.toLowerCase()}`)} {t('patients.severity')}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {!patient.allergies?.length && <p className="text-sm opacity-60 italic">{t('patients.no_known_allergies')}</p>}
                                    </div>
                                </div>

                                {/* Upcoming Appointments */}
                                <div className="card">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('appointments.upcoming')}</h3>
                                    {patient.appointments?.filter((a: any) => new Date(a.startTime) > new Date()).slice(0, 3).map((a: any) => (
                                        <div key={a.id} className="flex gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors">
                                            <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex flex-col items-center justify-center font-bold text-sm">
                                                <span>{new Date(a.startTime).getDate()}</span>
                                                <span className="text-[8px] uppercase">{new Date(a.startTime).toLocaleString('default', { month: 'short' })}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{a.title}</p>
                                                <p className="text-xs text-gray-500">{new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {!patient.appointments?.filter((a: any) => new Date(a.startTime) > new Date()).length && (
                                        <p className="text-sm text-gray-400 italic">{t('appointments.no_upcoming')}</p>
                                    )}
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

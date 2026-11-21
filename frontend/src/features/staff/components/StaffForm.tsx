import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { X, User, Mail, Phone, Shield, Award, FileText, Check, UserPlus } from 'lucide-react';
import { User as UserType, UserRole } from '../../../types';

interface StaffFormProps {
    isOpen?: boolean;
    onClose?: () => void;
    initialData?: Partial<UserType>;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ROLE_OPTIONS = [
    { value: 'ADMIN', label: 'staff.role_admin', icon: Shield, color: 'purple' },
    { value: 'DENTIST', label: 'staff.role_dentist', icon: User, color: 'blue' },
    { value: 'HYGIENIST', label: 'staff.role_hygienist', icon: User, color: 'cyan' },
    { value: 'RECEPTIONIST', label: 'staff.role_receptionist', icon: User, color: 'green' },
];

export default function StaffForm({ 
    isOpen = true, 
    onClose, 
    initialData, 
    onSubmit, 
    onCancel, 
    isLoading 
}: StaffFormProps) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'DENTIST' as UserRole,
        phone: '',
        specialization: '',
        licenseNumber: '',
        isActive: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                email: initialData.email || '',
                role: initialData.role || 'DENTIST',
                phone: initialData.phone || '',
                specialization: initialData.specialization || '',
                licenseNumber: initialData.licenseNumber || '',
                isActive: initialData.isActive ?? true,
                password: ''
            }));
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { firstName, lastName, email, role, phone, specialization, licenseNumber, isActive, password } = formData;

        const data: any = {
            firstName,
            lastName,
            email,
            role,
            isActive,
            phone: phone || undefined,
            specialization: specialization || undefined,
            licenseNumber: licenseNumber || undefined
        };

        if (password) {
            data.password = password;
        }

        onSubmit(data);
    };

    const handleClose = () => {
        if (onClose) onClose();
        onCancel();
    };

    const isEditMode = !!initialData?.id;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-0 text-left shadow-2xl shadow-gray-900/10 dark:shadow-black/30 transition-all w-full max-w-2xl border border-gray-100 dark:border-gray-800">
                                {/* Header */}
                                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/30 dark:to-gray-900/30">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
                                                {isEditMode ? <User className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                                    {isEditMode ? t('staff.edit_title') : t('staff.add_title')}
                                                </Dialog.Title>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {isEditMode ? t('staff.edit_description') : t('staff.add_description')}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* First Name */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <User className="w-3.5 h-3.5" />
                                                {t('staff.first_name')} *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.firstName}
                                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                placeholder={t('staff.first_name_placeholder')}
                                            />
                                        </div>

                                        {/* Last Name */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <User className="w-3.5 h-3.5" />
                                                {t('staff.last_name')} *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.lastName}
                                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                placeholder={t('staff.last_name_placeholder')}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5" />
                                                {t('staff.email')} *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                placeholder={t('staff.email_placeholder')}
                                            />
                                        </div>

                                        {/* Password (only for new users) */}
                                        {!isEditMode && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                    <Shield className="w-3.5 h-3.5" />
                                                    {t('staff.password')} *
                                                </label>
                                                <input
                                                    type="password"
                                                    required={!isEditMode}
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                    placeholder={t('staff.password_placeholder')}
                                                />
                                            </div>
                                        )}

                                        {/* Role */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Shield className="w-3.5 h-3.5" />
                                                {t('staff.role')} *
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {ROLE_OPTIONS.map((roleOption) => {
                                                    const Icon = roleOption.icon;
                                                    const isSelected = formData.role === roleOption.value;
                                                    const colorClasses = {
                                                        purple: isSelected ? 'from-purple-500 to-violet-600 shadow-purple-500/30' : 'bg-gray-100 dark:bg-gray-700',
                                                        blue: isSelected ? 'from-blue-500 to-blue-600 shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-700',
                                                        cyan: isSelected ? 'from-cyan-500 to-teal-600 shadow-cyan-500/30' : 'bg-gray-100 dark:bg-gray-700',
                                                        green: isSelected ? 'from-green-500 to-emerald-600 shadow-green-500/30' : 'bg-gray-100 dark:bg-gray-700',
                                                    };
                                                    
                                                    return (
                                                        <button
                                                            key={roleOption.value}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, role: roleOption.value as UserRole })}
                                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                                                                isSelected
                                                                    ? 'border-transparent bg-gradient-to-br ' + colorClasses[roleOption.color as keyof typeof colorClasses] + ' text-white'
                                                                    : 'border-gray-200 dark:border-gray-700 bg-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                            }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20' : ''}`}>
                                                                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                                                            </div>
                                                            <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {t(roleOption.label)}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5" />
                                                {t('staff.phone')}
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                placeholder={t('staff.phone_placeholder')}
                                            />
                                        </div>

                                        {/* Specialization */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Award className="w-3.5 h-3.5" />
                                                {t('staff.specialization')}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.specialization}
                                                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                placeholder={t('staff.specialization_placeholder')}
                                            />
                                        </div>

                                        {/* License Number */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5" />
                                                {t('staff.license_number')}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.licenseNumber}
                                                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                placeholder={t('staff.license_number_placeholder')}
                                            />
                                        </div>

                                        {/* Active Status */}
                                        <div className="md:col-span-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 w-full ${
                                                    formData.isActive
                                                        ? 'border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10'
                                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                                    formData.isActive
                                                        ? 'bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    <Check className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t('staff.active')}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formData.isActive ? t('staff.active_description') : t('staff.inactive_description')}</p>
                                                </div>
                                                <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {isLoading ? t('common.loading') : (isEditMode ? t('staff.update') : t('staff.create'))}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

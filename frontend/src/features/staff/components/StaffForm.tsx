import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, UserRole } from '../../../types';

interface StaffFormProps {
    initialData?: Partial<User>;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function StaffForm({ initialData, onSubmit, onCancel, isLoading }: StaffFormProps) {
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

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="label">{t('staff.first_name')} *</label>
                <input
                    className="input-field"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="label">{t('staff.last_name')} *</label>
                <input
                    className="input-field"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="label">{t('staff.email')} *</label>
                <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>
            {!initialData && (
                <div>
                    <label className="label">{t('staff.password')} *</label>
                    <input
                        type="password"
                        className="input-field"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required={!initialData}
                    />
                </div>
            )}
            <div>
                <label className="label">{t('staff.role')} *</label>
                <select
                    className="input-field"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    required
                >
                    <option value="ADMIN">{t('staff.role_admin')}</option>
                    <option value="DENTIST">{t('staff.role_dentist')}</option>
                    <option value="HYGIENIST">{t('staff.role_hygienist')}</option>
                    <option value="RECEPTIONIST">{t('staff.role_receptionist')}</option>
                </select>
            </div>
            <div>
                <label className="label">{t('staff.phone')}</label>
                <input
                    className="input-field"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
            </div>
            <div>
                <label className="label">{t('staff.specialization')}</label>
                <input
                    className="input-field"
                    value={formData.specialization}
                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                />
            </div>
            <div>
                <label className="label">{t('staff.license_number')}</label>
                <input
                    className="input-field"
                    value={formData.licenseNumber}
                    onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
            </div>
            <div className="flex items-center gap-2 mt-4">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('staff.active')}
                </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <button type="button" onClick={onCancel} className="btn-secondary">
                    {t('common.cancel')}
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary">
                    {isLoading ? t('common.loading') : (initialData ? t('staff.update') : t('staff.create'))}
                </button>
            </div>
        </form>
    );
}

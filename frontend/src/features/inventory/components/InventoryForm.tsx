import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Save, X, Package } from 'lucide-react';
import type { InventoryItem } from '../../../types';

interface InventoryFormProps {
    item?: InventoryItem | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function InventoryForm({ item, onSubmit, onCancel, isLoading }: InventoryFormProps) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: 0,
        minQuantity: 10,
        unitPrice: 0,
        supplier: ''
    });

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                minQuantity: item.minQuantity,
                unitPrice: Number(item.unitPrice),
                supplier: item.supplier || ''
            });
        }
    }, [item]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="card animate-slide-up !p-6 shadow-xl border-primary-100 dark:border-primary-900/30">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                        {item ? <Package className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            {item ? t('inventory.edit_item') : t('inventory.add_item')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('inventory.form_description')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('common.name')} *
                        </label>
                        <input
                            required
                            className="input-field w-full"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Surgical Masks (Box)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('inventory.category')} *
                        </label>
                        <input
                            required
                            className="input-field w-full"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            placeholder="e.g. PPE"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('inventory.supplier')}
                        </label>
                        <input
                            className="input-field w-full"
                            value={formData.supplier}
                            onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                            placeholder="e.g. MedSupply Co."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('inventory.quantity')}
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="input-field w-full"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('inventory.min_quantity')}
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="input-field w-full"
                            value={formData.minQuantity}
                            onChange={e => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('inventory.unit_price')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input-field w-full pl-7"
                                value={formData.unitPrice}
                                onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-secondary min-w-[100px]"
                        disabled={isLoading}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary min-w-[120px] flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {item ? t('common.save') : t('inventory.add_button')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

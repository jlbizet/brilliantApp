import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, Plus, Search, Boxes, TrendingDown, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores';
import { inventoryApi } from '../../api';
import type { InventoryItem } from '../../types';

export default function InventoryPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', category: '', quantity: 0, minQuantity: 10, unitPrice: 0, supplier: '' });

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory', page, search],
        queryFn: () => inventoryApi.getAll({ page, limit: 20, search: search || undefined }),
    });

    const { data: lowStock } = useQuery({
        queryKey: ['low-stock'],
        queryFn: inventoryApi.getLowStock,
    });

    const createMutation = useMutation({
        mutationFn: inventoryApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success(t('inventory.create_success') || 'Item added!');
            setShowForm(false);
        },
        onError: () => toast.error(t('inventory.create_error') || 'Failed to add item'),
    });

    const totalItems = inventory?.data.length || 0;
    const lowStockCount = (lowStock as any[])?.length || 0;
    const totalValue = inventory?.data.reduce((sum: number, item: InventoryItem) => sum + (item.quantity * item.unitPrice), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('inventory.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('inventory.manage')}</p>
                </div>
                {['ADMIN', 'RECEPTIONIST'].includes(user?.role as string) && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary group flex items-center gap-2"
                    >
                        <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-3 h-3" />
                        </div>
                        {t('inventory.add')}
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-50 dark:bg-primary-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <Boxes className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('inventory.total_items')}</p>
                        </div>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-50 dark:bg-rose-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockCount}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('inventory.low_stock_count')}</p>
                        </div>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 !p-5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalValue.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('inventory.total_value')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStock && (lowStock as any[]).length > 0 && (
                <div className="card !p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200 dark:border-amber-800/30">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800 dark:text-amber-400">{t('inventory.low_stock_alerts')}</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300/70">{t('inventory.restock_needed')}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(lowStock as any[]).map((item: any) => (
                            <span key={item.id} className="badge badge-warning text-xs py-1.5 px-3">
                                {item.name} ({item.quantity}/{item.min_quantity})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Form */}
            {showForm && (
                <div className="card animate-slide-up !p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{t('inventory.add_item')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.form_description')}</p>
                        </div>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.name')} *</label>
                            <input className="input-field mt-1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('inventory.category')} *</label>
                            <input className="input-field mt-1" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('inventory.quantity')}</label>
                            <input type="number" className="input-field mt-1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: +e.target.value })} />
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('inventory.min_quantity')}</label>
                            <input type="number" className="input-field mt-1" value={formData.minQuantity} onChange={e => setFormData({ ...formData, minQuantity: +e.target.value })} />
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('inventory.unit_price')}</label>
                            <input type="number" step="0.01" className="input-field mt-1" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: +e.target.value })} />
                        </div>
                        <div>
                            <label className="label text-sm font-medium text-gray-700 dark:text-gray-300">{t('inventory.supplier')}</label>
                            <input className="input-field mt-1" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                        </div>
                        <div className="md:col-span-3 flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
                            <button type="submit" className="btn-primary">{t('inventory.add_button')}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder={t('inventory.search_placeholder')}
                    className="input-field pl-11 pr-4 py-2.5 w-full rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {/* Inventory Table */}
            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">{t('inventory.loading')}</div>
            ) : (
                <div className="card overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('inventory.table_item')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('inventory.table_category')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('inventory.table_stock')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('inventory.table_min_stock')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('inventory.table_unit_price')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('inventory.table_supplier')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {inventory?.data.map((item: InventoryItem) => {
                                    const isLow = item.quantity <= item.minQuantity;
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isLow ? 'bg-gradient-to-br from-rose-400 to-rose-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}>
                                                        <Package className="w-5 h-5 text-white" />
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="badge badge-neutral text-xs">{item.category}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`font-bold text-lg ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{item.minQuantity}</td>
                                            <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">${Number(item.unitPrice).toFixed(2)}</td>
                                            <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{item.supplier || t('common.not_applicable')}</td>
                                            <td className="py-4 px-6">
                                                <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'} text-xs`}>
                                                    {isLow ? t('inventory.status_low_stock') : t('inventory.status_in_stock')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!inventory?.data || inventory.data.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                </div>
                                                {t('inventory.no_items')}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

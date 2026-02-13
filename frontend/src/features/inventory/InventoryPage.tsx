import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, Plus, Search } from 'lucide-react';
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('inventory.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('inventory.manage')}</p>
                </div>
                {['ADMIN', 'RECEPTIONIST'].includes(user?.role as string) && (
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                        <Plus className="w-4 h-4" /> {t('inventory.add')}
                    </button>
                )}
            </div>

            {/* Low Stock Alert */}
            {lowStock && (lowStock as any[]).length > 0 && (
                <div className="card !p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-amber-700 dark:text-amber-400">{t('inventory.low_stock_alerts')}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(lowStock as any[]).map((item: any) => (
                            <span key={item.id} className="badge badge-warning">{item.name} ({item.quantity}/{item.min_quantity})</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Form */}
            {showForm && (
                <div className="card animate-slide-up">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('inventory.add_item')}</h3>
                    <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="label">{t('common.name')} *</label><input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                        <div><label className="label">{t('inventory.category')} *</label><input className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required /></div>
                        <div><label className="label">{t('inventory.quantity')}</label><input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: +e.target.value })} /></div>
                        <div><label className="label">{t('inventory.min_quantity')}</label><input type="number" className="input-field" value={formData.minQuantity} onChange={e => setFormData({ ...formData, minQuantity: +e.target.value })} /></div>
                        <div><label className="label">{t('inventory.unit_price')}</label><input type="number" step="0.01" className="input-field" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: +e.target.value })} /></div>
                        <div><label className="label">{t('inventory.supplier')}</label><input className="input-field" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} /></div>
                        <div className="md:col-span-3 flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
                            <button type="submit" className="btn-primary">{t('inventory.add_button')}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder={t('inventory.search_placeholder')} className="input-field pl-10"
                    value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>

            {/* Inventory Table */}
            {isLoading ? (
                <div className="card text-center py-12 text-gray-400">{t('inventory.loading')}</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('inventory.table_item')}</th>
                                <th>{t('inventory.table_category')}</th>
                                <th>{t('inventory.table_stock')}</th>
                                <th>{t('inventory.table_min_stock')}</th>
                                <th>{t('inventory.table_unit_price')}</th>
                                <th>{t('inventory.table_supplier')}</th>
                                <th>{t('common.status')}</th></tr>
                        </thead>
                        <tbody>
                            {inventory?.data.map((item: InventoryItem) => {
                                const isLow = item.quantity <= item.minQuantity;
                                return (
                                    <tr key={item.id}>
                                        <td className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLow ? 'bg-red-50 dark:bg-red-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20'}`}>
                                                <Package className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-emerald-500'}`} />
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                        </td>
                                        <td><span className="badge badge-neutral">{item.category}</span></td>
                                        <td className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{item.quantity}</td>
                                        <td className="text-gray-500">{item.minQuantity}</td>
                                        <td className="text-gray-700 dark:text-gray-300">${Number(item.unitPrice).toFixed(2)}</td>
                                        <td className="text-sm text-gray-500">{item.supplier || t('common.not_applicable')}</td>
                                        <td>
                                            <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                                                {isLow ? t('inventory.status_low_stock') : t('inventory.status_in_stock')}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!inventory?.data || inventory.data.length === 0) && (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-400">{t('inventory.no_items')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, Plus, Search, Boxes, TrendingDown, DollarSign, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores';
import { inventoryApi } from '../../api';
import type { InventoryItem } from '../../types';
import InventoryForm from './components/InventoryForm';

export default function InventoryPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

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
            queryClient.invalidateQueries({ queryKey: ['low-stock'] });
            toast.success(t('inventory.create_success'));
            setShowForm(false);
        },
        onError: () => toast.error(t('inventory.create_error')),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => inventoryApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['low-stock'] });
            toast.success(t('inventory.update_success'));
            setEditingItem(null);
        },
        onError: () => toast.error(t('inventory.update_error')),
    });

    const deleteMutation = useMutation({
        mutationFn: inventoryApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['low-stock'] });
            toast.success(t('inventory.delete_success'));
        },
        onError: () => toast.error(t('inventory.delete_error')),
    });

    const handleDelete = (id: string) => {
        if (window.confirm(t('inventory.delete_confirm'))) {
            deleteMutation.mutate(id);
        }
    };

    const totalItems = inventory?.meta.total || 0;
    const lowStockCount = (lowStock as any[])?.length || 0;
    const totalValue = inventory?.data.reduce((sum: number, item: InventoryItem) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0) || 0;

    const canManageInventory = ['ADMIN', 'RECEPTIONIST'].includes(user?.role as string);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('inventory.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('inventory.manage')}</p>
                </div>
                {canManageInventory && (
                    <button
                        onClick={() => { setEditingItem(null); setShowForm(!showForm); }}
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
                                {item.name} ({item.quantity}/{item.minQuantity})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Forms */}
            {(showForm || editingItem) && (
                <InventoryForm
                    item={editingItem}
                    onSubmit={(data) => {
                        if (editingItem) {
                            updateMutation.mutate({ id: editingItem.id, data });
                        } else {
                            createMutation.mutate(data);
                        }
                    }}
                    onCancel={() => { setShowForm(false); setEditingItem(null); }}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder={t('inventory.search_placeholder')}
                    className="input-field pl-11 pr-4 py-2.5 w-full rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/20 underline-none shadow-none"
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
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('inventory.table_unit_price')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('inventory.table_supplier')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.status')}</th>
                                    {canManageInventory && <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.actions')}</th>}
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
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-lg ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-medium">Min: {item.minQuantity}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">${Number(item.unitPrice).toFixed(2)}</td>
                                            <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{item.supplier || '-'}</td>
                                            <td className="py-4 px-6">
                                                <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'} text-xs`}>
                                                    {isLow ? t('inventory.status_low_stock') : t('inventory.status_in_stock')}
                                                </span>
                                            </td>
                                            {canManageInventory && (
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { setEditingItem(item); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                                                            title={t('common.edit')}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                            title={t('common.delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
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
                    {/* Pagination */}
                    {inventory && inventory.meta.totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {t('common.pagination_info', { page: inventory.meta.page, totalPages: inventory.meta.totalPages, total: inventory.meta.total })}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-50"
                                >
                                    {t('common.previous')}
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(inventory.meta.totalPages, p + 1))}
                                    disabled={page === inventory.meta.totalPages}
                                    className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-50"
                                >
                                    {t('common.next')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

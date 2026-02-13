import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment, UserRole } from '../../../types';
import { useAuthStore } from '../../../stores';

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onStatusChange: (id: string, status: string) => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
}

export default function AppointmentDetailsModal({ isOpen, onClose, appointment, onStatusChange, onUpdate, onDelete }: AppointmentDetailsModalProps) {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>(appointment);

    useEffect(() => {
        if (appointment) {
            setEditData({ ...appointment });
            setIsEditing(false); // Reset editing mode when switching appointments
        }
    }, [appointment]);

    if (!appointment) return null;

    const STATUS_OPTIONS = [
        { value: 'SCHEDULED', label: t('appointments.scheduled'), color: 'bg-blue-100 text-blue-700', icon: Calendar },
        { value: 'CONFIRMED', label: t('appointments.confirmed'), color: 'bg-green-100 text-green-700', icon: CheckCircle },
        { value: 'IN_PROGRESS', label: t('appointments.in_progress'), color: 'bg-amber-100 text-amber-700', icon: Clock },
        { value: 'COMPLETED', label: t('appointments.completed'), color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
        { value: 'CANCELLED', label: t('appointments.cancelled'), color: 'bg-red-100 text-red-700', icon: XCircle },
        { value: 'NO_SHOW', label: t('appointments.no_show'), color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
    ];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                                            {isEditing ? t('appointments.edit') : t('appointments.modal_details_title')}
                                        </Dialog.Title>
                                    </div>
                                    <div className="flex gap-2">
                                        {['ADMIN', 'DENTIST', 'RECEPTIONIST'].includes(user?.role as string) && (
                                            <button onClick={() => {
                                                if (isEditing) {
                                                    onUpdate(appointment.id, editData);
                                                    setIsEditing(false);
                                                } else {
                                                    setIsEditing(true);
                                                }
                                            }} className="text-primary-500 hover:text-primary-600 font-bold text-sm px-2">
                                                {isEditing ? t('common.save') : t('common.edit')}
                                            </button>
                                        )}
                                        <button onClick={() => { setIsEditing(false); onClose(); }} className="text-gray-400 hover:text-gray-500 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Patient Info */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                {appointment.patient?.firstName?.[0]}{appointment.patient?.lastName?.[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                {appointment.patient?.firstName} {appointment.patient?.lastName}
                                            </h4>
                                            <p className="text-sm text-gray-500">{appointment.patient?.phone}</p>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1 col-span-2">
                                            <p className="text-gray-500 flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">{t('common.title')}</p>
                                            {isEditing ? (
                                                <input className="input-field" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} />
                                            ) : (
                                                <p className="font-medium text-gray-900 dark:text-white">{appointment.title}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t('common.date')}</p>
                                            {isEditing ? (
                                                <input type="date" className="input-field py-1" value={editData.startTime.split('T')[0]} onChange={e => {
                                                    const date = e.target.value;
                                                    const time = editData.startTime.split('T')[1];
                                                    setEditData({ ...editData, startTime: `${date}T${time}` });
                                                }} />
                                            ) : (
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {format(new Date(appointment.startTime), 'MMM d, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t('common.time')}</p>
                                            {isEditing ? (
                                                <input type="time" className="input-field py-1" value={editData.startTime.split('T')[1].slice(0, 5)} onChange={e => {
                                                    const time = e.target.value;
                                                    const date = editData.startTime.split('T')[0];
                                                    const currentEnd = new Date(editData.endTime);
                                                    const currentStart = new Date(editData.startTime);
                                                    const duration = currentEnd.getTime() - currentStart.getTime();
                                                    const newStart = new Date(`${date}T${time}`);
                                                    setEditData({
                                                        ...editData,
                                                        startTime: `${date}T${time}`,
                                                        endTime: new Date(newStart.getTime() + duration).toISOString()
                                                    });
                                                }} />
                                            ) : (
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {format(new Date(appointment.startTime), 'h:mm a')} - {format(new Date(appointment.endTime), 'h:mm a')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-gray-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {t('common.dentist')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                Dr. {appointment.dentist?.firstName} {appointment.dentist?.lastName}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-gray-500 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {t('common.type')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                {appointment.type}
                                            </p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <p className="text-gray-500 flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">{t('common.notes')}</p>
                                            {isEditing ? (
                                                <textarea className="input-field" rows={2} value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} />
                                            ) : (
                                                <p className="text-gray-900 dark:text-white text-sm">{appointment.notes || t('common.not_set')}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Selector */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('common.status')}</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {STATUS_OPTIONS.map((option) => {
                                                const Icon = option.icon;
                                                const isSelected = appointment.status === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => onStatusChange(appointment.id, option.value)}
                                                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${isSelected
                                                            ? option.color + ' ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 ring-current'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    {['ADMIN'].includes(user?.role as string) && (
                                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <button
                                                onClick={() => onDelete(appointment.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {t('common.delete')} {t('common.appointment')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

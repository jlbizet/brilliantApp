import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, X, ListTodo, Clock, CalendarDays, User as UserIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentsApi, usersApi, patientsApi, waitlistApi } from '../../api';
import type { Appointment } from '../../types';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';

const STATUS_COLORS: Record<string, string> = {
    SCHEDULED: '#338dfc', CONFIRMED: '#22c55e', IN_PROGRESS: '#f59e0b',
    COMPLETED: '#8b5cf6', CANCELLED: '#ef4444', NO_SHOW: '#6b7280',
};

export default function AppointmentsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const calendarRef = useRef<any>(null);
    const [showForm, setShowForm] = useState(false);
    const [showWaitlistForm, setShowWaitlistForm] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [formData, setFormData] = useState({
        patientId: '', dentistId: '', title: '', type: 'general',
        startTime: '', endTime: '', notes: '',
        isRecurring: false, recurringPattern: 'weekly', recurringEndDate: '',
    });
    const [waitlistData, setWaitlistData] = useState({
        patientId: '', priority: 0, preferredDays: '', preferredTime: '', notes: '',
    });

    const { data: appointments } = useQuery({
        queryKey: ['calendar-appointments', dateRange],
        queryFn: () => appointmentsApi.getCalendar({
            startDate: dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: dateRange.end || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        }),
    });

    const { data: dentists } = useQuery({
        queryKey: ['dentists'],
        queryFn: usersApi.getDentists,
    });

    const { data: patients } = useQuery({
        queryKey: ['patients-list'],
        queryFn: () => patientsApi.getAll({ limit: 100 }),
    });

    const { data: waitlist } = useQuery({
        queryKey: ['waitlist'],
        queryFn: waitlistApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: appointmentsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
            toast.success(t('appointments.create_success') || 'Appointment created!');
            setShowForm(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || t('appointments.create_error') || 'Failed to create appointment'),
    });

    const waitlistMutation = useMutation({
        mutationFn: waitlistApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['waitlist'] });
            toast.success(t('appointments.waitlist_success') || 'Added to waitlist!');
            setShowWaitlistForm(false);
            setWaitlistData({ patientId: '', priority: 0, preferredDays: '', preferredTime: '', notes: '' });
        },
        onError: (err: any) => toast.error(t('appointments.waitlist_error') || 'Failed to add to waitlist'),
    });

    const events = (appointments || []).map((apt: Appointment) => ({
        id: apt.id,
        title: `${apt.patient?.firstName} ${apt.patient?.lastName} - ${apt.title}`,
        start: apt.startTime,
        end: apt.endTime,
        backgroundColor: STATUS_COLORS[apt.status] || '#338dfc',
        borderColor: 'transparent',
        extendedProps: { ...apt },
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('appointments.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('appointments.manage')}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                    <Plus className="w-4 h-4" /> {t('appointments.new')}
                </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        {t(`appointments.${status.toLowerCase()}`)}
                    </div>
                ))}
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card animate-slide-up relative">
                    <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('appointments.new')}</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const submitData = { ...formData };
                        if (!submitData.isRecurring) {
                            delete (submitData as any).recurringPattern;
                            delete (submitData as any).recurringEndDate;
                        } else if (submitData.recurringEndDate) {
                            if (submitData.recurringEndDate.length === 10) {
                                submitData.recurringEndDate = `${submitData.recurringEndDate}T23:59:59Z`;
                            }
                        }
                        createMutation.mutate(submitData);
                    }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="label">{t('common.patient')} *</label>
                            <select className="input-field" value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })} required>
                                <option value="">{t('patients.select_patient')}</option>
                                {patients?.data.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                            </select>
                        </div>
                        <div><label className="label">{t('common.dentist')} *</label>
                            <select className="input-field" value={formData.dentistId} onChange={e => setFormData({ ...formData, dentistId: e.target.value })} required>
                                <option value="">{t('appointments.select_dentist')}</option>
                                {dentists?.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                            </select>
                        </div>
                        <div><label className="label">{t('common.title')} *</label><input className="input-field" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                        <div><label className="label">{t('common.type')}</label>
                            <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="general">{t('appointments.type_general')}</option><option value="cleaning">{t('appointments.type_cleaning')}</option><option value="emergency">{t('appointments.type_emergency')}</option><option value="follow-up">{t('appointments.type_follow_up')}</option><option value="consultation">{t('appointments.type_consultation')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">{t('common.date')} *</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={formData.startTime ? formData.startTime.split('T')[0] : ''}
                                    onChange={e => {
                                        const date = e.target.value;
                                        if (!date) return;
                                        const time = formData.startTime ? formData.startTime.split('T')[1]?.slice(0, 5) : '09:00';
                                        const start = `${date}T${time}`;
                                        const endDate = new Date(new Date(start).getTime() + 30 * 60000);
                                        setFormData({
                                            ...formData,
                                            startTime: start,
                                            endTime: endDate.toISOString().slice(0, 16)
                                        });
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">{t('common.time')} *</label>
                                <input
                                    type="time"
                                    className="input-field"
                                    value={formData.startTime ? formData.startTime.split('T')[1]?.slice(0, 5) : ''}
                                    onChange={e => {
                                        const time = e.target.value;
                                        if (!time) return;
                                        const date = formData.startTime ? formData.startTime.split('T')[0] : new Date().toISOString().split('T')[0];
                                        const start = `${date}T${time}`;
                                        const currentStart = new Date(formData.startTime);
                                        const currentEnd = new Date(formData.endTime);
                                        const durationMs = currentEnd.getTime() - currentStart.getTime();
                                        const newEnd = new Date(new Date(start).getTime() + (isNaN(durationMs) ? 30 * 60000 : durationMs));

                                        setFormData({
                                            ...formData,
                                            startTime: start,
                                            endTime: newEnd.toISOString().slice(0, 16)
                                        });
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-3">
                            <label className="label">{t('appointments.duration')}</label>
                            <div className="flex gap-2 mb-2">
                                {[15, 30, 45, 60].map(mins => (
                                    <button
                                        type="button"
                                        key={mins}
                                        onClick={() => {
                                            if (!formData.startTime) return;
                                            const start = new Date(formData.startTime);
                                            const end = new Date(start.getTime() + mins * 60000);
                                            setFormData({ ...formData, endTime: end.toISOString().slice(0, 16) });
                                        }}
                                        className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary-900/30 transition-colors"
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                            <div className="text-xs text-gray-500">
                                {t('appointments.end_time')}: {formData.endTime ? new Date(formData.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                        </div>

                        <div className="md:col-span-3"><label className="label">{t('common.notes')}</label><textarea className="input-field" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>

                        <div className="md:col-span-3 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                            <div className="flex items-center gap-2 mb-4">
                                <input type="checkbox" id="isRecurring" checked={formData.isRecurring} onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('appointments.recurring_label')}</label>
                            </div>

                            {formData.isRecurring && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                    <div>
                                        <label className="label">{t('appointments.repeats')}</label>
                                        <select className="input-field" value={formData.recurringPattern} onChange={e => setFormData({ ...formData, recurringPattern: e.target.value })}>
                                            <option value="daily">{t('appointments.daily')}</option>
                                            <option value="weekly">{t('appointments.weekly')}</option>
                                            <option value="biweekly">{t('appointments.biweekly')}</option>
                                            <option value="monthly">{t('appointments.monthly')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">{t('appointments.until')}</label>
                                        <input type="date" className="input-field" value={formData.recurringEndDate} onChange={e => setFormData({ ...formData, recurringEndDate: e.target.value })} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-3 flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
                            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                                {createMutation.isPending ? t('common.loading') : t('appointments.create_button')}
                            </button>
                        </div>
                    </form>
                    {createMutation.isError && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 animate-shake">
                            <AlertCircle className="w-4 h-4" />
                            {/* @ts-ignore */}
                            {createMutation.error?.response?.data?.message || t('appointments.create_error')}
                        </div>
                    )}
                </div>
            )}

            {/* Calendar & Waitlist Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Calendar */}
                <div className="lg:col-span-3 card !p-4">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
                        }}
                        events={events}
                        slotMinTime="07:00:00"
                        slotMaxTime="20:00:00"
                        allDaySlot={false}
                        nowIndicator
                        editable={true}
                        selectable
                        height="auto"
                        eventClick={(info: any) => {
                            const apt = info.event.extendedProps as Appointment;
                            setSelectedAppointment(apt);
                        }}
                        datesSet={(arg: any) => {
                            setDateRange({ start: arg.startStr, end: arg.endStr });
                        }}
                        eventDrop={(info: any) => {
                            const apt = info.event.extendedProps as Appointment;
                            const newStart = info.event.start?.toISOString();
                            const newEnd = info.event.end?.toISOString();
                            if (newStart && newEnd) {
                                appointmentsApi.update(apt.id, { startTime: newStart, endTime: newEnd })
                                    .then(() => toast.success(t('appointments.move_success') || 'Appointment moved'))
                                    .catch(() => {
                                        info.revert();
                                        toast.error(t('appointments.move_error') || 'Could not move appointment');
                                    });
                            }
                        }}
                    />
                </div>

                {/* Waitlist Panel */}
                <div className="space-y-4">
                    <div className="card h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <ListTodo className="w-5 h-5 text-primary-600" />
                            <h3 className="font-bold text-gray-900 dark:text-white">{t('common.waitlist')}</h3>
                        </div>

                        <div className="space-y-3">
                            {waitlist && waitlist.length > 0 ? (
                                waitlist.map((entry: any) => (
                                    <div key={entry.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:border-primary-200 transition-all cursor-pointer group"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                patientId: entry.patientId,
                                                notes: `Waitlist Request: ${entry.notes || ''}\nPref: ${entry.preferredDays || ''} ${entry.preferredTime || ''}`,
                                            });
                                            setShowForm(true);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary-600">
                                                {entry.patient?.firstName} {entry.patient?.lastName}
                                            </span>
                                            <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${entry.priority === 2 ? 'bg-red-100 text-red-600' :
                                                entry.priority === 1 ? 'bg-amber-100 text-amber-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                P{entry.priority}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                <CalendarDays className="w-3 h-3" />
                                                <span>{entry.preferredDays || t('appointments.any_day')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{entry.preferredTime || t('appointments.any_time')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <ListTodo className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400 italic">{t('appointments.waitlist_empty')}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowWaitlistForm(true)}
                            className="w-full mt-4 py-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-400 hover:text-primary-600 hover:border-primary-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-3 h-3" /> {t('common.add_to_waitlist')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Waitlist Modal */}
            {
                showWaitlistForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="card w-full max-w-md relative animate-slide-up">
                            <button onClick={() => setShowWaitlistForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            <h3 className="font-bold text-lg mb-4">{t('common.add_to_waitlist')}</h3>
                            <form onSubmit={(e) => { e.preventDefault(); waitlistMutation.mutate(waitlistData); }} className="space-y-4">
                                <div>
                                    <label className="label">{t('common.patient')} *</label>
                                    <select className="input-field" value={waitlistData.patientId} onChange={e => setWaitlistData({ ...waitlistData, patientId: e.target.value })} required>
                                        <option value="">{t('patients.select_patient')}</option>
                                        {patients?.data.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">{t('appointments.priority')}</label>
                                    <select className="input-field" value={waitlistData.priority} onChange={e => setWaitlistData({ ...waitlistData, priority: Number(e.target.value) })}>
                                        <option value={0}>{t('appointments.priority_low')}</option>
                                        <option value={1}>{t('appointments.priority_medium')}</option>
                                        <option value={2}>{t('appointments.priority_high')}</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">{t('appointments.pref_days')}</label>
                                        <input className="input-field" placeholder="e.g. Mon, Wed" value={waitlistData.preferredDays} onChange={e => setWaitlistData({ ...waitlistData, preferredDays: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">{t('appointments.pref_time')}</label>
                                        <select className="input-field" value={waitlistData.preferredTime} onChange={e => setWaitlistData({ ...waitlistData, preferredTime: e.target.value })}>
                                            <option value="">{t('appointments.any')}</option>
                                            <option value="Morning">{t('appointments.morning')}</option>
                                            <option value="Afternoon">{t('appointments.afternoon')}</option>
                                            <option value="Evening">{t('appointments.evening')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">{t('common.notes')}</label>
                                    <textarea className="input-field" rows={2} value={waitlistData.notes} onChange={e => setWaitlistData({ ...waitlistData, notes: e.target.value })} />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button type="button" onClick={() => setShowWaitlistForm(false)} className="btn-secondary">{t('common.cancel')}</button>
                                    <button type="submit" disabled={waitlistMutation.isPending} className="btn-primary">
                                        {waitlistMutation.isPending ? t('common.loading') : t('appointments.add_entry')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <AppointmentDetailsModal
                isOpen={!!selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                appointment={selectedAppointment}
                onStatusChange={(id, status) => {
                    appointmentsApi.update(id, { status })
                        .then(() => {
                            toast.success(`${t('appointments.status_marked')} ${t(`appointments.${status.toLowerCase()}`)}`);
                            queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
                            setSelectedAppointment(null);
                        })
                        .catch(() => toast.error(t('appointments.update_error') || 'Failed to update status'));
                }}
                onDelete={(id) => {
                    if (confirm(t('appointments.cancel_confirm') || 'Are you sure you want to cancel this appointment?')) {
                        appointmentsApi.delete(id)
                            .then(() => {
                                toast.success(t('appointments.cancel_success') || 'Appointment cancelled');
                                queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
                                setSelectedAppointment(null);
                            })
                            .catch(() => toast.error(t('appointments.cancel_error') || 'Failed to cancel appointment'));
                    }
                }}
            />
        </div >
    );
}

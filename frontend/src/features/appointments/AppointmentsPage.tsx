import { useState, useRef, useEffect } from 'react';
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
import { DatePicker, TimePicker } from '../../components/ui';
import { toISOString, toDateString } from '../../utils/timezone';
import { getErrorMessage } from '../../utils/errors';

function toLocalDateString(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
    const [selectedDentists, setSelectedDentists] = useState<string[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const { data: appointments } = useQuery({
        queryKey: ['calendar-appointments', dateRange, selectedDentists],
        queryFn: () => appointmentsApi.getCalendar({
            startDate: dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: dateRange.end || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            dentistIds: selectedDentists.length > 0 ? selectedDentists : undefined,
        }),
    });

    const { data: dentists } = useQuery({
        queryKey: ['dentists'],
        queryFn: usersApi.getDentists,
    });

    useEffect(() => {
        if (dentists && selectedDentists.length === 0) {
            setSelectedDentists(dentists.map((d: any) => d.id));
        }
    }, [dentists]);

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
            toast.success(t('appointments.create_success'));
            setShowForm(false);
            setFieldErrors({});
        },
        onError: (err: any) => {
            const response = err.response?.data;
            if (response?.errors && typeof response.errors === 'object') {
                setFieldErrors(response.errors);
                toast.error(getErrorMessage(err, t('appointments.create_error')));
            } else {
                toast.error(getErrorMessage(err, t('appointments.create_error')));
            }
        },
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

    useEffect(() => {
        console.log('[DEBUG] Appointments data from API:', appointments);
        if (appointments && appointments.length > 0) {
            console.log('[DEBUG] First appointment details:', {
                id: appointments[0].id,
                start: appointments[0].startTime,
                type: typeof appointments[0].startTime
            });
        }
        console.log('[DEBUG] Events mapped for FullCalendar:', events);
    }, [appointments, events]);

    const waitlistMutation = useMutation({
        mutationFn: waitlistApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['waitlist'] });
            toast.success(t('appointments.waitlist_success'));
            setShowWaitlistForm(false);
            setWaitlistData({ patientId: '', priority: 0, preferredDays: '', preferredTime: '', notes: '' });
        },
        onError: (err: any) => toast.error(t('appointments.waitlist_error')),
    });

    const toggleDentist = (id: string) => {
        setSelectedDentists(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('appointments.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('appointments.manage')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2 mr-4">
                        {Object.entries(STATUS_COLORS).map(([status, color]) => (
                            <div key={status} className="flex items-center gap-1.5 text-[10px] text-gray-500 whitespace-nowrap">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                {t(`appointments.${status.toLowerCase()}`)}
                            </div>
                        ))}
                    </div>
        <button
          onClick={() => {
            // Reset form data when creating new appointment
            setFormData({
              patientId: '',
              dentistId: '',
              title: '',
              type: 'general',
              startTime: '',
              endTime: '',
              notes: '',
              isRecurring: false,
              recurringPattern: 'weekly',
              recurringEndDate: '',
            });
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold">{t('appointments.new')}</span>
        </button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Create Form (Optional Popover approach would be better, but for now we keep it compatible) */}
                    {showForm && (
                        <div className="card animate-slide-up relative mb-6">
                            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('appointments.new')}</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                setFieldErrors({});
                                const submitData = { ...formData };
                                submitData.startTime = toISOString(new Date(formData.startTime));
                                submitData.endTime = toISOString(new Date(formData.endTime));
                                if (!submitData.isRecurring) {
                                    delete (submitData as any).recurringPattern;
                                    delete (submitData as any).recurringEndDate;
                                } else if (submitData.recurringEndDate) {
                                    if (submitData.recurringEndDate.length === 10) {
                                        submitData.recurringEndDate = `${submitData.recurringEndDate}T23:59:59`;
                                    } else {
                                        submitData.recurringEndDate = toISOString(new Date(submitData.recurringEndDate));
                                    }
                                }
                                createMutation.mutate(submitData);
                            }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="label">{t('common.patient')} *</label>
                                    <select className={`input-field ${fieldErrors.patientId ? 'border-red-500' : ''}`} value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })} required>
                                        <option value="">{t('patients.select_patient')}</option>
                                        {patients?.data.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                                    </select>
                                    {fieldErrors.patientId && <p className="text-red-500 text-xs mt-1">{fieldErrors.patientId}</p>}
                                </div>
                                <div><label className="label">{t('common.dentist')} *</label>
                                    <select className={`input-field ${fieldErrors.dentistId ? 'border-red-500' : ''}`} value={formData.dentistId} onChange={e => setFormData({ ...formData, dentistId: e.target.value })} required>
                                        <option value="">{t('appointments.select_dentist')}</option>
                                        {dentists?.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                                    </select>
                                    {fieldErrors.dentistId && <p className="text-red-500 text-xs mt-1">{fieldErrors.dentistId}</p>}
                                </div>
                                <div><label className="label">{t('common.title')} *</label><input className={`input-field ${fieldErrors.title ? 'border-red-500' : ''}`} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                                    {fieldErrors.title && <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>}
                                </div>
                                <div><label className="label">{t('common.type')}</label>
                                    <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="general">{t('appointments.type_general')}</option><option value="cleaning">{t('appointments.type_cleaning')}</option><option value="emergency">{t('appointments.type_emergency')}</option><option value="follow-up">{t('appointments.type_follow_up')}</option><option value="consultation">{t('appointments.type_consultation')}</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">{t('common.date')} *</label>
                                        <DatePicker
                                            value={toLocalDateString(formData.startTime)}
                                            onChange={date => {
                                                if (!date) return;
                                                const currentTime = formData.startTime ? new Date(formData.startTime) : new Date();
                                                const [year, month, day] = date.split('-').map(Number);
                                                const newDate = new Date(currentTime);
                                                newDate.setFullYear(year, month - 1, day);
                                                const end = new Date(newDate.getTime() + 30 * 60000);
                                                setFormData({ ...formData, startTime: toISOString(newDate), endTime: toISOString(end) });
                                            }}
                                            className={fieldErrors.startTime ? 'border-red-500' : ''}
                                        />
                                        {fieldErrors.startTime && <p className="text-red-500 text-xs mt-1">{fieldErrors.startTime}</p>}
                                    </div>
                                    <div>
                                        <label className="label">{t('common.time')} *</label>
                                        <TimePicker
                                            value={formData.startTime ? new Date(formData.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            onChange={time => {
                                                if (!time) return;
                                                const [hours, minutes] = time.split(':').map(Number);
                                                const newStart = formData.startTime ? new Date(formData.startTime) : new Date();
                                                newStart.setHours(hours, minutes, 0, 0);
                                                const currentStart = new Date(formData.startTime || newStart);
                                                const currentEnd = new Date(formData.endTime || new Date(currentStart.getTime() + 30 * 60000));
                                                const durationMs = currentEnd.getTime() - currentStart.getTime();
                                                const end = new Date(newStart.getTime() + (isNaN(durationMs) ? 30 * 60000 : durationMs));
                                                setFormData({ ...formData, startTime: toISOString(newStart), endTime: toISOString(end) });
                                            }}
                                            minuteStep={15}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="label">{t('appointments.duration')}</label>
                                    <div className="flex gap-2 mb-2">
                                        {[15, 30, 45, 60].map(mins => {
                                            const currentDuration = formData.startTime && formData.endTime
                                                ? Math.round((new Date(formData.endTime).getTime() - new Date(formData.startTime).getTime()) / 60000)
                                                : 0;
                                            const isSelected = mins === currentDuration;

                                            return (
                                                <button
                                                    type="button"
                                                    key={mins}
                                                    onClick={() => {
                                                        if (!formData.startTime) return;
                                                        const start = new Date(formData.startTime);
                                                        const end = new Date(start.getTime() + mins * 60000);
                                                        setFormData({ ...formData, endTime: toISOString(end) });
                                                    }}
                                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${isSelected
                                                        ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-gray-900'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary-900/30'
                                                        }`}
                                                >
                                                    {mins}m
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="md:col-span-3"><label className="label">{t('common.notes')}</label><textarea className="input-field" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>
                                <div className="md:col-span-3 flex gap-2 justify-end">
                                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
                                    <button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? t('common.loading') : t('appointments.create_button')}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 card !p-0 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-auto">
                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="timeGridWeek"
                                    headerToolbar={{
                                        left: 'today prev,next',
                                        center: 'title',
                                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
                                    }}
                                    events={events}
                                    slotMinTime="07:00:00"
                                    slotMaxTime="20:00:00"
                                    allDaySlot={false}
                                    nowIndicator
                                    editable={true}
                                    selectable={true}
                                    selectMirror={true}
                                    dayMaxEvents={true}
                                    weekends={true}
                                    height="100%"
                                    themeSystem="standard"
                                    eventClick={(info: any) => {
                                        const apt = info.event.extendedProps as Appointment;
                                        setSelectedAppointment(apt);
                                    }}
                                    datesSet={(arg: any) => {
                                        setDateRange({ start: arg.startStr, end: arg.endStr });
                                        setCurrentDate(arg.view.calendar.getDate());
                                    }}
                                    select={(info: any) => {
                                        console.log('[Trace] FullCalendar select info:', {
                                            start: info.start.toString(),
                                            end: info.end.toString(),
                                            startISO: info.start.toISOString(),
                                            browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        });

                                        setFormData({
                                            ...formData,
                                            startTime: toISOString(info.start),
                                            endTime: toISOString(info.end),
                                        });
                                        setShowForm(true);
                                        calendarRef.current?.getApi().unselect();
                                    }}
                                    eventDrop={(info: any) => {
                                        const apt = info.event.extendedProps as Appointment;
                                        const newStart = info.event.start ? toISOString(info.event.start) : null;
                                        const newEnd = info.event.end ? toISOString(info.event.end) : null;
                                        if (newStart && newEnd) {
                                            appointmentsApi.update(apt.id, { startTime: newStart, endTime: newEnd })
                                                .then(() => {
                                                    toast.success(t('appointments.move_success'));
                                                    queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
                                                })
                                                .catch(() => {
                                                    info.revert();
                                                    toast.error(t('appointments.move_error'));
                                                });
                                        }
                                    }}
                                    eventResize={(info: any) => {
                                        const apt = info.event.extendedProps as Appointment;
                                        const newEnd = info.event.end ? toISOString(info.event.end) : null;
                                        if (newEnd) {
                                            appointmentsApi.update(apt.id, { endTime: newEnd })
                                                .then(() => {
                                                    toast.success(t('appointments.resize_success'));
                                                    queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
                                                })
                                                .catch(() => {
                                                    info.revert();
                                                    toast.error(t('appointments.update_error'));
                                                });
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Waitlist Panel */}
                        <div className="space-y-4 overflow-auto">
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
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary-600">{entry.patient?.firstName} {entry.patient?.lastName}</span>
                                                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${entry.priority === 2 ? 'bg-red-100 text-red-600' : entry.priority === 1 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>P{entry.priority}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><CalendarDays className="w-3 h-3" /><span>{entry.preferredDays || t('appointments.any_day')}</span></div>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><Clock className="w-3 h-3" /><span>{entry.preferredTime || t('appointments.any_time')}</span></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8"><ListTodo className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400 italic">{t('appointments.waitlist_empty')}</p></div>
                                    )}
                                </div>
                                <button onClick={() => setShowWaitlistForm(true)} className="w-full mt-4 py-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-400 hover:text-primary-600 hover:border-primary-200 transition-all flex items-center justify-center gap-2">
                                    <Plus className="w-3 h-3" /> {t('common.add_to_waitlist')}
                                </button>
                            </div>
                        </div>
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
                                        <input className="input-field" placeholder={t('appointments.pref_days_placeholder')} value={waitlistData.preferredDays} onChange={e => setWaitlistData({ ...waitlistData, preferredDays: e.target.value })} />
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
                        .catch(() => toast.error(t('appointments.update_error')));
                }}
                onUpdate={(id, data) => {
                    appointmentsApi.update(id, data)
                        .then(() => {
                            toast.success(t('appointments.update_success'));
                            queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
                            setSelectedAppointment(null);
                        })
                        .catch(() => toast.error(t('appointments.update_error')));
                }}
                onDelete={(id) => {
                    if (confirm(t('appointments.delete_confirm'))) {
                        appointmentsApi.delete(id)
                            .then(() => {
                                toast.success(t('appointments.delete_success'));
                                queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
                                setSelectedAppointment(null);
                            })
                            .catch(() => toast.error(t('appointments.delete_error')));
                    }
                }}
            />
        </div >
    );
}

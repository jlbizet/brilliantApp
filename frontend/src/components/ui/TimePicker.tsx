import { useState, useMemo } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
    placeholder?: string;
    className?: string;
    minuteStep?: number;
}

export function TimePicker({ value, onChange, placeholder, className, minuteStep = 15 }: TimePickerProps) {
    const { t } = useTranslation();
    const [isAm, setIsAm] = useState(() => {
        if (!value) return true;
        const hour = parseInt(value.split(':')[0]);
        return hour < 12;
    });

    // Parse current value
    const { currentHour, currentMinute } = useMemo(() => {
        if (!value) return { currentHour: 12, currentMinute: 0 };
        const [h, m] = value.split(':').map(Number);
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return { currentHour: hour12, currentMinute: m };
    }, [value]);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);

    const handleSelect = (hour: number, minute: number, am: boolean) => {
        let hour24 = hour;
        if (am && hour === 12) hour24 = 0;
        if (!am && hour !== 12) hour24 = hour + 12;
        
        const formatted = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange(formatted);
    };

    const formatDisplay = (time: string) => {
        if (!time) return placeholder ?? t('common.select_time');
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
        <Popover className="relative">
            <PopoverButton
                className={cn(
                    'input-field flex items-center justify-between gap-2 text-left',
                    !value && 'text-gray-400',
                    className
                )}
            >
                <span>{formatDisplay(value)}</span>
                <Clock className="w-4 h-4 text-gray-400" />
            </PopoverButton>

            <PopoverPanel
                transition
                className={cn(
                    'absolute z-50 mt-1 p-4',
                    'card !p-4 shadow-lg',
                    'origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0'
                )}
                anchor="bottom start"
            >
                <div className="space-y-4">
                    {/* AM/PM Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAm(true);
                                if (value) handleSelect(currentHour, currentMinute, true);
                            }}
                            className={cn(
                                'flex-1 py-1.5 px-4 text-sm font-medium rounded-md transition-all',
                                isAm 
                                    ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            AM
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsAm(false);
                                if (value) handleSelect(currentHour, currentMinute, false);
                            }}
                            className={cn(
                                'flex-1 py-1.5 px-4 text-sm font-medium rounded-md transition-all',
                                !isAm 
                                    ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            PM
                        </button>
                    </div>

                    {/* Time Selection */}
                    <div className="flex gap-4">
                        {/* Hours */}
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 mb-2 block">{t('common.hour')}</label>
                            <div className="h-48 overflow-y-auto space-y-1">
                                {hours.map(hour => (
                                    <button
                                        key={hour}
                                        type="button"
                                        onClick={() => handleSelect(hour, currentMinute, isAm)}
                                        className={cn(
                                            'w-full py-2 px-3 text-sm rounded-lg transition-all text-center',
                                            currentHour === hour
                                                ? 'bg-primary-500 text-white'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                        )}
                                    >
                                        {hour}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Minutes */}
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 mb-2 block">{t('common.minute')}</label>
                            <div className="h-48 overflow-y-auto space-y-1">
                                {minutes.map(minute => (
                                    <button
                                        key={minute}
                                        type="button"
                                        onClick={() => handleSelect(currentHour, minute, isAm)}
                                        className={cn(
                                            'w-full py-2 px-3 text-sm rounded-lg transition-all text-center',
                                            currentMinute === minute
                                                ? 'bg-primary-500 text-white'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                        )}
                                    >
                                        {minute.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Select */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                {t('common.clear')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const now = new Date();
                                    const hour = now.getHours();
                                    const minute = Math.floor(now.getMinutes() / minuteStep) * minuteStep;
                                    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                    setIsAm(hour < 12);
                                    handleSelect(h12, minute, hour < 12);
                                }}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                                {t('common.now')}
                            </button>
                        </div>
                    </div>
                </div>
            </PopoverPanel>
        </Popover>
    );
}

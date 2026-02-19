import { useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
    min?: string;
    max?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Select date', className, min, max }: DatePickerProps) {
    // Helper to parse date string without timezone shift
    const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        // Append time to force local timezone interpretation
        return new Date(`${dateStr}T00:00:00`);
    };

    const [currentMonth, setCurrentMonth] = useState(value ? parseDate(value) || new Date() : new Date());
    const selectedDate = value ? parseDate(value) : null;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const handleSelect = (date: Date) => {
        const formatted = format(date, 'yyyy-MM-dd');
        onChange(formatted);
    };

    const isDisabled = (date: Date) => {
        if (min && date < (parseDate(min) || new Date(0))) return true;
        if (max && date > (parseDate(max) || new Date(8640000000000000))) return true;
        return false;
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
                <span>{value && selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder}</span>
                <CalendarIcon className="w-4 h-4 text-gray-400" />
            </PopoverButton>

            <PopoverPanel
                transition
                className={cn(
                    'absolute z-50 mt-2 w-72 p-4',
                    'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800',
                    'origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0'
                )}
                anchor="bottom start"
            >
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-sm">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 text-center">
                        {weekDays.map(day => (
                            <div key={day} className="text-xs font-medium text-gray-400 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isTodayDate = isToday(day);
                            const disabled = isDisabled(day);

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => handleSelect(day)}
                                    className={cn(
                                        'h-8 w-8 rounded-lg text-sm font-medium transition-all',
                                        'flex items-center justify-center',
                                        !isCurrentMonth && 'text-gray-300 dark:text-gray-600',
                                        isCurrentMonth && !isSelected && 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                                        isSelected && 'bg-primary-500 text-white hover:bg-primary-600',
                                        isTodayDate && !isSelected && 'ring-1 ring-primary-500 text-primary-600 dark:text-primary-400',
                                        disabled && 'opacity-40 cursor-not-allowed'
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelect(new Date())}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Today
                        </button>
                    </div>
                </div>
            </PopoverPanel>
        </Popover>
    );
}

// Simple timezone utilities - uses browser's local timezone

/**
 * Convert date to ISO string (preserves local time)
 */
export function toISOString(date: Date): string {
    return date.toISOString();
}

/**
 * Format date for display in local timezone
 */
export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format date for date picker input
 */
export function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

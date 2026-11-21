import { enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export function getDateLocale(language: string | undefined): Locale {
    return language?.toLowerCase().startsWith('es') ? es : enUS;
}

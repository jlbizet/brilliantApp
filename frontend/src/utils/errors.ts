import i18n from '../i18n';

export function getErrorMessage(error: any, fallback?: string): string {
    const response = error?.response?.data;
    const defaultMessage = i18n.t('errors.unexpected');

    if (!response) {
        return fallback || defaultMessage;
    }

    if (response.errors && typeof response.errors === 'object') {
        const firstError = Object.values(response.errors)[0];
        if (typeof firstError === 'string') {
            return firstError;
        }
    }

    if (response.message) {
        if (Array.isArray(response.message)) {
            return response.message[0];
        }
        if (typeof response.message === 'string') {
            return response.message;
        }
    }

    return fallback || defaultMessage;
}
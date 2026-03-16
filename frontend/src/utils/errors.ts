export function getErrorMessage(error: any, fallback?: string): string {
    const response = error?.response?.data;
    
    if (!response) {
        return fallback || 'An unexpected error occurred';
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

    return fallback || 'An unexpected error occurred';
}
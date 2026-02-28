import { format, parseISO, isValid } from 'date-fns';

/**
 * Safely format a date string or timestamp for display.
 * Handles ISO strings, numeric timestamps (strings or numbers), and SQLite literal timestamps.
 */
export const parseDateSafe = (dateInput: string | number | Date | null | undefined): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'number') return new Date(dateInput);

    if (typeof dateInput === 'string') {
        if (dateInput.includes('current_timestamp()')) return new Date();
        if (/^\d+\.?\d*$/.test(dateInput)) return new Date(parseFloat(dateInput));
        
        const nativeDate = new Date(dateInput);
        if (isValid(nativeDate)) {
            return nativeDate;
        }

        const parts = dateInput.split(/[-/]/);
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
           return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
        } else if (parts.length === 3 && parts[0].length === 4 && parts[2].length === 2) {
           return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
        } else {
           return parseISO(dateInput.replace(" ", "T"));
        }
    }
    return null;
};

export const formatDateSafe = (dateInput: string | number | Date | null | undefined, formatPattern: string = 'MMM dd, yyyy'): string => {
    const date = parseDateSafe(dateInput);
    if (!date) return "N/A";

    return isValid(date) ? format(date, formatPattern) : "N/A";
};

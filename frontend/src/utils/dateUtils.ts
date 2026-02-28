import { format, parseISO, isValid } from 'date-fns';

/**
 * Safely format a date string or timestamp for display.
 * Handles ISO strings, numeric timestamps (strings or numbers), and SQLite literal timestamps.
 */
export const formatDateSafe = (dateInput: string | number | null | undefined, formatPattern: string = 'MMM dd, yyyy'): string => {
    if (!dateInput) return "N/A";
    
    let date: Date;
    
    if (typeof dateInput === 'number') {
        date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
        // Handle literal SQLite string (rare but possible after schema corruption)
        if (dateInput.includes('current_timestamp()')) return "Just now";
        
        // Handle numeric strings like "1764672665000"
        if (/^\d+\.?\d*$/.test(dateInput)) {
            date = new Date(parseFloat(dateInput));
        } else {
            // Standard ISO parsing with space-to-T replacement for broad compatibility
            date = parseISO(dateInput.replace(" ", "T"));
        }
    } else {
        return "N/A";
    }

    return isValid(date) ? format(date, formatPattern) : "N/A";
};

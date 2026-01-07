export interface ShortcutItem {
    keys: string[]; // e.g., ['Alt', 'R']
    description: string;
    action?: () => void;
    group: string;
    pageSpecific?: boolean;
}

import type { ShortcutItem } from '../types/shortcuts';

export const GLOBAL_SHORTCUTS: ShortcutItem[] = [
    // General
    { keys: ['Alt', '/'], description: 'Keyboard Shortcuts', group: 'General' },
    
    // Actions
    { keys: ['Alt', 'L'], description: 'Logout', group: 'Actions' },
    { keys: ['Alt', 'W'], description: 'Toggle Theme', group: 'Actions' },
    { keys: ['Ctrl', 'R'], description: 'Reload Page', group: 'Actions' },
    
    // Navigation (Common)
    { keys: ['Alt', '1'], description: 'Dashboard', group: 'Navigation' },
    { keys: ['Alt', '2'], description: 'Schedule', group: 'Navigation' },
    { keys: ['Alt', '3'], description: 'Inquiry List', group: 'Navigation' },
    { keys: ['Alt', '4'], description: 'Registration List', group: 'Navigation' },
    { keys: ['Alt', '6'], description: 'Patients List', group: 'Navigation' },
];

export const DASHBOARD_SHORTCUTS: ShortcutItem[] = [
    // Dashboard Specific Navigation
    { keys: ['Alt', '5'], description: 'Cancelled List', group: 'Navigation' },
    
    // Modals & Features
    { keys: ['Alt', 'R'], description: 'New Registration', group: 'Dashboard' },
    { keys: ['Alt', 'T'], description: 'Book Test', group: 'Dashboard' },
    { keys: ['Alt', 'I'], description: 'New Inquiry', group: 'Dashboard' },
    { keys: ['Alt', 'Shift', 'I'], description: 'Test Inquiry', group: 'Dashboard' },
    { keys: ['Alt', 'C'], description: 'Toggle Chat', group: 'Dashboard' },
    { keys: ['Alt', 'N'], description: 'Notifications', group: 'Dashboard' },
    { keys: ['Alt', 'P'], description: 'Profile', group: 'Dashboard' },
    { keys: ['Alt', 'S'], description: 'Global Search', group: 'Dashboard' },
];

export const SCHEDULE_SHORTCUTS: ShortcutItem[] = [
    // Schedule Specific Navigation
    { keys: ['Alt', '5'], description: 'Tests Page', group: 'Navigation' }, 
    
    // Schedule Controls
    { keys: ['Alt', 'ArrowLeft'], description: 'Previous Week', group: 'Schedule' },
    { keys: ['Alt', 'ArrowRight'], description: 'Next Week', group: 'Schedule' },
    { keys: ['Alt', 'T'], description: 'Go to Today', group: 'Schedule' },
    { keys: ['Ctrl', 'R'], description: 'Refresh Schedule', group: 'Schedule' },
];

export const ALL_APP_SHORTCUTS: ShortcutItem[] = [
    ...GLOBAL_SHORTCUTS,
    ...DASHBOARD_SHORTCUTS,
    ...SCHEDULE_SHORTCUTS
];

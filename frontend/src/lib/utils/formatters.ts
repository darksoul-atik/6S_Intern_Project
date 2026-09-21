/**
 * Formats user names into 1 or 2 uppercase initials.
 */
export function getInitials(name?: string): string {
  if (!name) return 'U';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'U';
  if (words.length === 1) {
    return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
  }
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

/**
 * Formats dates for experience cards (e.g. 'Jan 2024' or 'Present').
 */
export function formatExpDate(val?: string): string {
  if (!val) return '';
  if (val.toLowerCase() === 'present') return 'Present';
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return val;
}

/**
 * Formats date into standard British / international string (e.g. '15 Jan 2026').
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Normalizes a date value into YYYY-MM-DD for HTML5 date inputs.
 */
export function toDateInputValue(val?: string): string {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}

/**
 * Formats a date into human-readable display string (e.g. '15 September 2024' or 'Present').
 */
export function formatDateDisplay(val?: string): string {
  if (!val) return '';
  if (val.toLowerCase() === 'present') return 'Present';
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return val;
}

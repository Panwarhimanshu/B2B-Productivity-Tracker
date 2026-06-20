import { format, parseISO } from 'date-fns';

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '-';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, fmt);
  } catch {
    return '-';
  }
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'An unexpected error occurred';

export const classNames = (...classes) => classes.filter(Boolean).join(' ');

import { format, parse } from 'date-fns';
import type { ClassType } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy');
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM');
}

export function formatMonth(month: string): string {
  const d = parse(month, 'yyyy-MM', new Date());
  return format(d, 'MMMM yyyy');
}

export function formatMonthShort(month: string): string {
  const d = parse(month, 'yyyy-MM', new Date());
  return format(d, 'MMM yyyy');
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/** Format an "HH:MM" (24h) time string into a 12-hour display like "2:30 PM". Empty/null → ''. */
export function formatTime(time?: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function getMonthFromDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM');
}

export function getPaymentWindow(month: string, startDay: number, endDay: number): string {
  const d = parse(month, 'yyyy-MM', new Date());
  // Payment window is in the month after the earning month
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const monthName = format(nextMonth, 'MMMM yyyy');
  return `${startDay}-${endDay} ${monthName}`;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/** Safe student-name lookup that tolerates an unpopulated or missing studentId (e.g. demo/substitute classes). */
export function getStudentName(
  studentId: { name?: string } | string | null | undefined,
  classType?: ClassType
): string {
  if (studentId && typeof studentId === 'object') return studentId.name || 'Student';
  if (!studentId) {
    if (classType === 'substitute') return 'Substitute Class';
    return 'Demo Class';
  }
  return 'Student';
}

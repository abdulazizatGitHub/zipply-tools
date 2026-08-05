import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `cn` — composes Tailwind class names with conflict resolution.
 * Every component uses this to merge incoming `className` with its defaults.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

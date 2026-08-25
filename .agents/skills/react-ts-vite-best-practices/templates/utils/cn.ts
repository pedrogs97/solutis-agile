import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário padrão para mesclagem de classes Tailwind CSS com solução de conflitos de especificidade.
 * Combina `clsx` (para condicionais) e `tailwind-merge` (para precedência correta de classes Tailwind).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn'; // Utilitário helper: twMerge(clsx(...))

/**
 * Template de Componente seguindo SOLID + Tailwind CSS (CVA & cn()):
 * 1. Extende props nativas HTML de elementos container (LSP)
 * 2. Aceita variantes estilizadas com CVA e slot props para composição (OCP)
 * 3. Mescla dinamicamente classes Tailwind sem conflitos de especificidade via `cn()` (Tailwind Best Practice)
 * 4. Focado estritamente em renderização de UI (SRP)
 * 5. Tipagem estrita com TypeScript e ForwardRef
 */

const cardVariants = cva(
  'rounded-lg p-4 transition-all duration-200 border',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border-border shadow-sm',
        outlined: 'bg-transparent border-2 border-primary text-primary',
        elevated: 'bg-card text-card-foreground shadow-lg border-border/50 hover:shadow-xl',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

export interface CardProps
  extends React.ComponentPropsWithRef<'div'>,
    VariantProps<typeof cardVariants> {
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  isLoading?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant,
      padding,
      headerSlot,
      footerSlot,
      isLoading = false,
      children,
      className,
      ...restProps
    }: CardProps,
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...restProps}
      >
        {headerSlot && (
          <div className="card-header border-b border-border pb-2 mb-3 font-semibold text-lg">
            {headerSlot}
          </div>
        )}

        <div className="card-body">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          ) : (
            children
          )}
        </div>

        {footerSlot && (
          <div className="card-footer border-t border-border pt-2 mt-3 text-sm text-muted-foreground">
            {footerSlot}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

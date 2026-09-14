import * as React from 'react';
import { FiChevronLeft, FiChevronRight, FiMoreHorizontal } from 'react-icons/fi';
import { cn } from '@/lib/utils';

export function Pagination({
  className,
  ...props
}: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

export function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('flex flex-row items-center gap-1.5', className)}
      {...props}
    />
  );
}

export function PaginationItem({
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return <li className={cn('', className)} {...props} />;
}

export type PaginationLinkProps = {
  isActive?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
} & React.ComponentProps<'a'>;

export function PaginationLink({
  className,
  isActive,
  size = 'icon',
  disabled,
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-xl text-xs font-semibold font-manrope transition-all duration-150 cursor-pointer select-none',
        size === 'default' && 'h-9 px-4 py-2 gap-1.5 text-xs font-medium',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'lg' && 'h-10 px-5 text-sm',
        size === 'icon' && 'h-9 w-9 min-w-[36px]',
        isActive
          ? 'bg-indigo-600 text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] border border-indigo-500 hover:bg-indigo-700'
          : 'bg-white/70 border border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs',
        disabled && 'opacity-40 pointer-events-none cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}

export function PaginationPrevious({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      disabled={disabled}
      className={cn('gap-1.5 pl-3 pr-4', className)}
      {...props}
    >
      <FiChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </PaginationLink>
  );
}

export function PaginationNext({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      disabled={disabled}
      className={cn('gap-1.5 pl-4 pr-3', className)}
      {...props}
    >
      <span>Next</span>
      <FiChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-9 w-9 items-center justify-center text-slate-400', className)}
      {...props}
    >
      <FiMoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

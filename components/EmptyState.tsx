'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
}

export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/50">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>

      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mx-auto">{description}</p>

      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) => {
            const classes =
              action.variant === 'secondary'
                ? 'rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors'
                : 'rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 transition-colors';

            if (action.href) {
              return (
                <Link key={action.label} href={action.href} className={classes}>
                  {action.label}
                </Link>
              );
            }

            return (
              <button key={action.label} onClick={action.onClick} className={classes}>
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

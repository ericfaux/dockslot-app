'use client';

import { useState } from 'react';
import { 
  Bell, 
  DollarSign, 
  FileSignature, 
  FileText, 
  AlertCircle,
  CheckCircle,
  ChevronRight,
  X
} from 'lucide-react';
import Link from 'next/link';

export interface ActionItem {
  id: string;
  type: 'payment' | 'waiver' | 'report' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  bookingId?: string;
}

interface ActionItemsWidgetProps {
  items: ActionItem[];
}

export function ActionItemsWidget({ items }: ActionItemsWidgetProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleItems = items.filter(item => !dismissed.has(item.id));
  const highPriorityCount = visibleItems.filter(i => i.priority === 'high').length;

  const handleDismiss = (itemId: string) => {
    setDismissed(prev => new Set([...prev, itemId]));
  };

  const getIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-5 w-5" />;
      case 'waiver':
        return <FileSignature className="h-5 w-5" />;
      case 'report':
        return <FileText className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high':
        return {
          border: 'border-l-red-500',
          bg: 'bg-red-500/10',
          icon: 'text-red-400',
          dot: 'bg-red-400',
        };
      case 'medium':
        return {
          border: 'border-l-amber-500',
          bg: 'bg-amber-500/10',
          icon: 'text-amber-400',
          dot: 'bg-amber-400',
        };
      case 'low':
        return {
          border: 'border-l-cyan-500',
          bg: 'bg-cyan-500/10',
          icon: 'text-cyan-400',
          dot: 'bg-cyan-400',
        };
    }
  };

  if (visibleItems.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex flex-col items-center justify-center py-4">
          <CheckCircle className="mb-3 h-12 w-12 text-emerald-400" />
          <h3 className="mb-1 text-lg font-semibold text-slate-100">
            All Clear! ✨
          </h3>
          <p className="text-sm text-slate-400">
            No pending action items. Smooth sailing ahead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-cyan-400" />
              {highPriorityCount > 0 && (
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {highPriorityCount}
                </div>
              )}
            </div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-slate-100">
              Action Items
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              {visibleItems.length} pending
            </span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-slate-700">
        {visibleItems.map((item) => {
          const colors = getPriorityColor(item.priority);
          
          return (
            <div
              key={item.id}
              className={`border-l-4 ${colors.border} ${colors.bg} px-6 py-4 transition hover:bg-slate-700/30`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`mt-0.5 flex-shrink-0 ${colors.icon}`}>
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium text-slate-100">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.description}
                      </p>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={() => handleDismiss(item.id)}
                      className="flex-shrink-0 rounded p-1 text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Action Button */}
                  {item.actionUrl && (
                    <Link
                      href={item.actionUrl}
                      className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-600"
                    >
                      {item.actionLabel || 'View'}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>

                {/* Priority Dot */}
                <div className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${colors.dot}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

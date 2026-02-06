'use client';

import { Lightbulb, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import type { ActionableInsight } from '../lib/analytics-utils';

interface Props {
  insights: ActionableInsight[];
}

export function ActionableInsights({ insights }: Props) {
  if (insights.length === 0) {
    return null;
  }

  const getIcon = (type: ActionableInsight['type']) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4 text-cyan-600" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
  };

  const getBorderColor = (type: ActionableInsight['type']) => {
    switch (type) {
      case 'tip':
        return 'border-cyan-500/30 bg-cyan-500/5';
      case 'opportunity':
        return 'border-green-500/30 bg-green-500/5';
      case 'alert':
        return 'border-amber-500/30 bg-amber-500/5';
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Insights</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`rounded-lg border p-3 ${getBorderColor(insight.type)}`}
          >
            <div className="flex items-start gap-2">
              <div className="shrink-0 mt-0.5">
                {getIcon(insight.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{insight.message}</p>
                {insight.metric && (
                  <p className="text-xs text-slate-400 mt-1">{insight.metric}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { Tag, TrendingUp, DollarSign, Hash, Percent } from 'lucide-react';
import type { PromoCodeAnalyticsData } from '@/app/actions/analytics';

interface Props {
  data: PromoCodeAnalyticsData;
}

export function PromoCodesTab({ data }: Props) {
  function formatCurrency(dollars: number) {
    return `$${dollars.toFixed(2)}`;
  }

  function formatDiscount(type: string, value: number) {
    if (type === 'percentage') return `${value}%`;
    return `$${(value / 100).toFixed(2)}`;
  }

  if (data.totalCodes === 0) {
    return (
      <div className="text-center py-16">
        <Tag className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Promo Codes Yet</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Create promo codes in Settings to start offering discounts and tracking their performance here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Codes</p>
              <p className="text-2xl font-bold text-white mt-1">
                {data.activeCodes}
                <span className="text-sm font-normal text-slate-500 ml-1">/ {data.totalCodes}</span>
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
              <Tag className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Uses</p>
              <p className="text-2xl font-bold text-white mt-1">{data.totalUses}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <Hash className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Discounts Given</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.totalDiscountGiven)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <Percent className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Revenue from Promos</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.totalRevenueFromPromos)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <DollarSign className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ROI Insight */}
      {data.totalDiscountGiven > 0 && data.totalRevenueFromPromos > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-300">
                Promo ROI: {((data.totalRevenueFromPromos / data.totalDiscountGiven - 1) * 100).toFixed(0)}x return
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Every $1 in discounts generated ${(data.totalRevenueFromPromos / data.totalDiscountGiven).toFixed(2)} in bookings
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      {data.usageByMonth.some(m => m.uses > 0) && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Usage</h3>
          <div className="space-y-3">
            {data.usageByMonth.map((month) => {
              const maxUses = Math.max(...data.usageByMonth.map(m => m.uses), 1);
              const barWidth = month.uses > 0 ? Math.max(4, (month.uses / maxUses) * 100) : 0;

              return (
                <div key={month.month} className="flex items-center gap-4">
                  <span className="w-10 text-sm text-slate-400 text-right">{month.label}</span>
                  <div className="flex-1 relative h-8 rounded bg-slate-800">
                    {barWidth > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-cyan-500/30"
                        style={{ width: `${barWidth}%` }}
                      />
                    )}
                    <div className="absolute inset-y-0 left-0 flex items-center px-3">
                      <span className="text-xs text-white font-medium">
                        {month.uses > 0
                          ? `${month.uses} uses / ${formatCurrency(month.revenue)} revenue / ${formatCurrency(month.discountGiven)} discounted`
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Code Performance */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Code Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-3 text-slate-400 font-medium">Code</th>
                <th className="pb-3 text-slate-400 font-medium">Discount</th>
                <th className="pb-3 text-slate-400 font-medium text-right">Uses</th>
                <th className="pb-3 text-slate-400 font-medium text-right">Discounts Given</th>
                <th className="pb-3 text-slate-400 font-medium text-right">Revenue</th>
                <th className="pb-3 text-slate-400 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.codePerformance.map((code) => (
                <tr key={code.id} className="border-b border-slate-800 last:border-0">
                  <td className="py-3">
                    <span className="font-mono font-bold text-cyan-400">{code.code}</span>
                    {code.validFrom && code.validTo && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {code.validFrom} to {code.validTo}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-white">
                    {formatDiscount(code.discountType, code.discountValue)}
                    <span className="text-slate-500 ml-1">
                      {code.discountType === 'percentage' ? 'off' : 'fixed'}
                    </span>
                  </td>
                  <td className="py-3 text-right text-white">
                    {code.uses}
                    {code.maxUses !== null && (
                      <span className="text-slate-500">/{code.maxUses}</span>
                    )}
                  </td>
                  <td className="py-3 text-right text-amber-400">
                    {formatCurrency(code.discountGiven)}
                  </td>
                  <td className="py-3 text-right text-emerald-400">
                    {formatCurrency(code.revenueGenerated)}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                      code.isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {code.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

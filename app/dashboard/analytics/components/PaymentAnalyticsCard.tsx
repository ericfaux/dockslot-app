'use client';

import { CreditCard, Banknote, Receipt, AlertCircle, Gift } from 'lucide-react';
import type { PaymentMetrics } from '../lib/analytics-utils';

interface Props {
  metrics: PaymentMetrics;
}

export function PaymentAnalyticsCard({ metrics }: Props) {
  const hasData = metrics.totalCollected > 0 || metrics.averageBookingValue > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-green-400" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Payment Analytics</h3>
      </div>

      {!hasData ? (
        <div className="text-center py-6 text-slate-400">
          <CreditCard className="h-10 w-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No payment data yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Payment metrics will appear after your first booking
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Collected - Hero */}
          <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-center">
            <p className="text-xs text-green-400/80 uppercase tracking-wide mb-1">Total Collected</p>
            <p className="text-3xl font-bold text-green-400">
              ${metrics.totalCollected.toLocaleString()}
            </p>
          </div>

          {/* Payment Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-4 w-4 text-cyan-600" />
                <span className="text-xs text-slate-400">Deposits</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                ${metrics.totalDeposits.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-slate-400">Balance Paid</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                ${metrics.totalBalancePayments.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Outstanding & Refunds */}
          <div className="space-y-2">
            {metrics.outstandingBalance > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-500/30 p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-600">Outstanding</span>
                </div>
                <span className="font-bold text-amber-600">
                  ${metrics.outstandingBalance.toLocaleString()}
                </span>
              </div>
            )}

            {metrics.refundsIssued > 0 && (
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Refunds Issued</span>
                <span className="text-rose-600">-${metrics.refundsIssued.toLocaleString()}</span>
              </div>
            )}

            {metrics.tipsReceived > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Gift className="h-4 w-4 text-purple-600" />
                  <span>Tips Received</span>
                </div>
                <span className="text-purple-600">+${metrics.tipsReceived.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Average Booking Value */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Avg Booking Value</span>
              <span className="text-lg font-bold text-slate-900">
                ${metrics.averageBookingValue.toFixed(0)}
              </span>
            </div>

            {/* Deposit vs Full Payment indicator */}
            {metrics.depositPercentage > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Deposit Only</span>
                  <span>Fully Paid</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${metrics.depositPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  {metrics.depositPercentage.toFixed(0)}% deposit only
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

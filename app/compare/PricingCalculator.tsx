'use client'

import { useState } from 'react'
import { Calculator, DollarSign } from 'lucide-react'

export function PricingCalculator() {
  const [bookingsPerMonth, setBookingsPerMonth] = useState(50)
  const [averagePrice, setAveragePrice] = useState(400)

  const dockslotCost = 29
  const fareharborRate = 0.06 // 6%
  const checkfrontBaseCost = 79

  const fareharborCost = bookingsPerMonth * averagePrice * fareharborRate
  const savings = fareharborCost - dockslotCost

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20">
          <Calculator className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Commission Calculator</h3>
          <p className="text-sm text-slate-400">See how much FareHarbor fees would cost you</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Bookings per month
          </label>
          <input
            type="range"
            min="10"
            max="150"
            step="5"
            value={bookingsPerMonth}
            onChange={(e) => setBookingsPerMonth(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-cyan-500"
          />
          <div className="mt-2 text-center text-2xl font-bold text-white">{bookingsPerMonth}</div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Average trip price
          </label>
          <input
            type="range"
            min="200"
            max="1000"
            step="50"
            value={averagePrice}
            onChange={(e) => setAveragePrice(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-cyan-500"
          />
          <div className="mt-2 text-center text-2xl font-bold text-white">${averagePrice}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 text-center">
          <p className="mb-1 text-sm text-cyan-300">DockSlot</p>
          <p className="text-3xl font-bold text-white">${dockslotCost}</p>
          <p className="text-xs text-slate-400">flat/month</p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
          <p className="mb-1 text-sm text-slate-400">Checkfront</p>
          <p className="text-3xl font-bold text-white">${checkfrontBaseCost}+</p>
          <p className="text-xs text-slate-500">base/month</p>
        </div>

        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-center">
          <p className="mb-1 text-sm text-rose-300">FareHarbor</p>
          <p className="text-3xl font-bold text-white">${fareharborCost.toLocaleString()}</p>
          <p className="text-xs text-slate-400">in commissions</p>
        </div>
      </div>

      {savings > 0 && (
        <div className="mt-6 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 p-4 text-center">
          <p className="text-sm text-slate-300">
            With DockSlot, you&apos;d save{' '}
            <span className="text-2xl font-bold text-emerald-400">
              ${savings.toLocaleString()}
            </span>{' '}
            per month vs FareHarbor
          </p>
          <p className="mt-1 text-sm text-slate-400">
            That&apos;s <strong className="text-white">${(savings * 12).toLocaleString()}</strong> per year back in your pocket.
          </p>
        </div>
      )}
    </div>
  )
}

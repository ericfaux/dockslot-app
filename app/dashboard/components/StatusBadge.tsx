'use client'

import { BookingStatus } from '@/lib/db/types'
import {
  Clock,
  CheckCircle,
  CloudRain,
  Calendar,
  XCircle,
  AlertCircle,
} from 'lucide-react'

interface StatusBadgeProps {
  status: BookingStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string
    icon: React.ElementType
    colors: {
      bg: string
      text: string
      border: string
      ring: string
    }
  }
> = {
  pending_deposit: {
    label: 'Awaiting Deposit',
    icon: Clock,
    colors: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-500/30',
      ring: 'ring-amber-500/20',
    },
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    colors: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-500/30',
      ring: 'ring-emerald-500/20',
    },
  },
  weather_hold: {
    label: 'Weather Hold',
    icon: CloudRain,
    colors: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-500/30',
      ring: 'ring-amber-500/20',
    },
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: Calendar,
    colors: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      border: 'border-blue-500/30',
      ring: 'ring-blue-500/20',
    },
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    colors: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      ring: 'ring-slate-500/20',
    },
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    colors: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-500/30',
      ring: 'ring-rose-500/20',
    },
  },
  no_show: {
    label: 'No Show',
    icon: AlertCircle,
    colors: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-500/30',
      ring: 'ring-rose-500/20',
    },
  },
}

export default function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.colors.bg} ${config.colors.text} ${config.colors.border} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  )
}

// Payment status badge variant
interface PaymentBadgeProps {
  status: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'partially_refunded' | 'fully_refunded'
  size?: 'sm' | 'md' | 'lg'
}

const PAYMENT_CONFIG = {
  unpaid: {
    label: 'Unpaid',
    colors: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
    },
  },
  deposit_paid: {
    label: 'Deposit Paid',
    colors: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-500/30',
    },
  },
  fully_paid: {
    label: 'Fully Paid',
    colors: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-500/30',
    },
  },
  partially_refunded: {
    label: 'Partial Refund',
    colors: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-600',
      border: 'border-purple-500/30',
    },
  },
  fully_refunded: {
    label: 'Refunded',
    colors: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-600',
      border: 'border-purple-500/30',
    },
  },
}

export function PaymentBadge({ status, size = 'md' }: PaymentBadgeProps) {
  const config = PAYMENT_CONFIG[status]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.colors.bg} ${config.colors.text} ${config.colors.border} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  )
}

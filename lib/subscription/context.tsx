'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { SubscriptionTier } from '@/lib/db/types'

interface SubscriptionContextValue {
  tier: SubscriptionTier
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: 'deckhand',
})

interface SubscriptionProviderProps {
  tier: SubscriptionTier
  children: ReactNode
}

export function SubscriptionProvider({ tier, children }: SubscriptionProviderProps) {
  return (
    <SubscriptionContext.Provider value={{ tier }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext)
}

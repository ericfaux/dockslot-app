'use client';

import { PaymentsClient } from '@/app/dashboard/payments/PaymentsClient';

interface PaymentsTabProps {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  businessName: string;
  email: string;
}

export function PaymentsTab(props: PaymentsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          Connect your Stripe account to accept deposits and payments from guests.
        </p>
      </div>

      <PaymentsClient
        stripeAccountId={props.stripeAccountId}
        stripeOnboardingComplete={props.stripeOnboardingComplete}
        businessName={props.businessName}
        email={props.email}
      />
    </div>
  );
}

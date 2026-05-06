export type StripeAccountStatus =
  | 'not_connected'
  | 'pending'
  | 'active'
  | 'restricted';

export interface ProfileStripeFields {
  stripe_account_id: string | null;
  stripe_account_status: StripeAccountStatus;
  stripe_connected_at: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
}

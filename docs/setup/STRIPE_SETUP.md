# Stripe Integration Setup Guide

## Required Environment Variables

Add these to both local `.env.local` and Vercel environment variables:

```bash
# Stripe API Keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production

# Stripe Webhook Secrets (from https://dashboard.stripe.com/webhooks)
# Two endpoints, two secrets — see "Two webhook endpoints" below.
STRIPE_WEBHOOK_SECRET_PLATFORM=whsec_... # platform-scoped events
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_...  # Connect-scoped events
```

## Two webhook endpoints

DockSlot runs two distinct Stripe webhook endpoints with separate signing
secrets. Stripe forces this split: each event destination has exactly one
scope ("Your account" or "Connected accounts"), and the events we need
land on different scopes. Keeping the routes and secrets separate also
isolates the platform billing path from the captain lifecycle path so a
misconfiguration on one side cannot poison the other.

| Endpoint | Stripe scope | Events | Signing secret |
|---|---|---|---|
| `/api/stripe/webhook` | Your account | `checkout.session.completed`, `payment_intent.succeeded`, `customer.subscription.*`, `invoice.payment_failed` | `STRIPE_WEBHOOK_SECRET_PLATFORM` |
| `/api/stripe/webhook-connect` | Connected accounts | `account.updated`, `account.application.deauthorized` | `STRIPE_WEBHOOK_SECRET_CONNECT` |

Do not merge these routes back into a single handler. Future agents that
touch this code: respect the split.

## Stripe Dashboard Setup

### 1. Get API Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)

### 2. Set Up Webhooks (two endpoints)

#### Platform endpoint (booking + subscription events)
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - **Development:** Use Stripe CLI or ngrok
   - **Production:** `https://dockslot-app.vercel.app/api/stripe/webhook`
4. **Event destination scope:** "Your account"
5. Select events to listen for:
   - `checkout.session.completed` ✅ (required)
   - `payment_intent.succeeded` (optional)
   - `payment_intent.payment_failed` (optional)
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` (subscription billing)
   - `invoice.payment_failed` (subscription billing)
6. Click "Add endpoint"
7. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET_PLATFORM`

#### Connect endpoint (captain account lifecycle)
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - **Production:** `https://dockslot-app.vercel.app/api/stripe/webhook-connect`
4. **Event destination scope:** "Connected accounts" (NOT "Your account" — this is the only thing distinguishing the two endpoints)
5. Select events to listen for:
   - `account.updated`
   - `account.application.deauthorized`
6. Click "Add endpoint"
7. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET_CONNECT`

### 3. Test in Development

**Option A: Stripe CLI (recommended)**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward platform-scoped webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
# This prints a whsec_... — add it to .env.local as STRIPE_WEBHOOK_SECRET_PLATFORM

# In a second terminal, forward Connect-scoped events for captain lifecycle
stripe listen --forward-connect-to localhost:3000/api/stripe/webhook-connect
# This prints a separate whsec_... — add it to .env.local as STRIPE_WEBHOOK_SECRET_CONNECT
```

**Option B: ngrok**
```bash
# Start your dev server
npm run dev

# In another terminal, expose it
ngrok http 3000

# Use the ngrok URL in Stripe webhook settings
# https://xxxx.ngrok.io/api/stripe/webhook
```

### 4. Test Payment Flow

1. Start dev server: `npm run dev`
2. Create a test booking
3. Use Stripe test cards:
   - **Success:** `4242 4242 4242 4242`
   - **Decline:** `4000 0000 0000 0002`
   - **Requires Auth:** `4000 0025 0000 3155`
   - Expiry: any future date
   - CVC: any 3 digits
   - ZIP: any 5 digits

4. Verify webhook is received and booking is updated

## Files Changed

- ✅ `app/api/stripe/checkout/route.ts` - Creates Stripe Checkout sessions
- ✅ `app/api/stripe/webhook/route.ts` - Handles payment confirmations
- ✅ `app/payment/success/page.tsx` - Payment success screen
- ✅ `components/booking/StripeCheckoutButton.tsx` - Payment button
- ✅ `app/book/[captainId]/[tripTypeId]/confirm/page.tsx` - Updated confirmation page

## Payment Flow

1. **Guest completes booking form** → Creates booking with status `pending_deposit`
2. **Guest clicks "Pay Deposit"** → Calls `/api/stripe/checkout`
3. **API creates Stripe Checkout session** → Returns checkout URL
4. **Guest redirected to Stripe** → Enters card details
5. **Payment succeeds** → Stripe sends webhook to `/api/stripe/webhook`
6. **Webhook updates booking**:
   - Sets `deposit_paid_cents`
   - Calculates `balance_due_cents`
   - Changes status to `confirmed`
   - Logs payment in `booking_logs`
7. **Guest redirected to success page** → Shows confirmation

## Security Notes

- ✅ Uses Stripe Checkout (PCI compliant, no card data touches our server)
- ✅ Webhook signature verification (prevents fake webhook calls)
- ✅ Service role client for database writes (bypasses RLS in webhook context)
- ✅ Booking metadata in Stripe session (links payment to booking)

## Next Steps

Once Stripe is configured:
- [ ] Add email confirmation sending (in webhook handler)
- [ ] Add captain notification email (new booking)
- [ ] Implement balance payment flow (before trip)
- [ ] Add refund handling (cancellations)
- [ ] Set up Stripe Connect for captain payouts (future)

## Testing Checklist

- [ ] Test successful payment (updates booking status)
- [ ] Test declined card (shows error, doesn't create booking)
- [ ] Test webhook signature verification
- [ ] Test payment success page displays correctly
- [ ] Test guest management link works after payment
- [ ] Test balance due calculation is correct

## Support

Stripe docs: https://stripe.com/docs
Webhook testing: https://stripe.com/docs/webhooks/test
Test cards: https://stripe.com/docs/testing

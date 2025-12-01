# Hybrid Pricing Implementation Guide

## Overview

This guide explains the implementation of the new hybrid pricing model for Data Rooms and Data Rooms Plus plans, which addresses customer confusion with the previous per-user only pricing.

## Problem Statement

**Before (Confusing for customers):**
- Pure per-user pricing with minimum quantities
- Customers couldn't reduce users below minimum without losing plan benefits
- Unclear pricing structure led to confusion

**After (Clear hybrid model):**
- Fixed base price for included users
- Additional per-user pricing for users above the base
- Clear minimum price guarantee with scalable additional users

## New Pricing Structure

### Data Rooms Plan
- **Base Price**: €149/month or €99/year (includes 3 users)
- **Additional Users**: €49/month or €33/month per additional user
- **Minimum**: Always pay for 3 users, even if you have fewer

### Data Rooms Plus Plan  
- **Base Price**: €349/month or €249/year (includes 5 users)
- **Additional Users**: €69/month or €49/month per additional user
- **Minimum**: Always pay for 5 users, even if you have fewer

## Implementation Steps

### 1. Set Up Stripe Products

First, create the additional user products in Stripe:

```bash
# Run the Stripe setup script
npx ts-node scripts/stripe-setup-hybrid-pricing.ts
```

This will create:
- Data Rooms additional user (monthly/yearly)
- Data Rooms Plus additional user (monthly/yearly)

### 2. Update Price IDs

Replace the placeholder price IDs in `ee/stripe/utils.ts` with the real ones from Stripe:

```typescript
// Replace these placeholder IDs with real ones from the setup script:
additionalUserPriceIds: {
  test: {
    old: "price_REAL_ID_HERE",
    new: "price_REAL_ID_HERE",
  },
  production: {
    old: "price_REAL_ID_HERE", 
    new: "price_REAL_ID_HERE",
  },
}
```

### 3. Test the Implementation

#### Test New Subscriptions

1. **Base Plan Only** (e.g., 3 users for Data Rooms):
   ```
   GET /api/teams/{teamId}/billing/upgrade?priceId={base_price_id}&users=3
   ```
   Expected: Single line item with base price

2. **Base + Additional Users** (e.g., 5 users for Data Rooms):
   ```
   GET /api/teams/{teamId}/billing/upgrade?priceId={base_price_id}&users=5
   ```
   Expected: Two line items - base price + 2 additional users

#### Test Webhook Handling

1. Create test subscription with hybrid pricing
2. Verify webhook correctly calculates total users from multiple line items
3. Check database limits are updated correctly

### 4. Migrate Existing Customers (Optional)

For existing customers who want to move to hybrid pricing:

```bash
# Dry run first to see what would happen
npx ts-node scripts/migrate-to-hybrid-pricing.ts

# Execute actual migration  
npx ts-node scripts/migrate-to-hybrid-pricing.ts --execute
```

## Key Files Modified

### Core Implementation
- `ee/stripe/utils.ts` - Updated plan configurations with hybrid pricing
- `ee/stripe/pricing-utils.ts` - New utility functions for hybrid pricing logic
- `pages/api/teams/[teamId]/billing/upgrade.ts` - Updated checkout to support hybrid line items

### Webhook Handlers
- `ee/stripe/webhooks/checkout-session-completed.ts` - Handle multiple subscription items
- `ee/stripe/webhooks/customer-subscription-updated.ts` - Calculate users from hybrid subscriptions

### UI Components
- `components/billing/hybrid-pricing-display.tsx` - Clear pricing display for customers
- `ee/stripe/constants.ts` - Updated pricing display strings

## Testing Checklist

### ✅ New Subscriptions
- [ ] Base plan subscription (minimum users)
- [ ] Base + additional users subscription  
- [ ] User count adjustments work in Stripe checkout
- [ ] Correct line items created for both base and additional users

### ✅ Webhook Processing
- [ ] Checkout session completed handles multiple line items
- [ ] Subscription updated correctly calculates total users
- [ ] Database user limits updated correctly
- [ ] Plan limits preserved for other features

### ✅ Existing Customers
- [ ] Legacy per-user pricing still works for old accounts
- [ ] New hybrid pricing only applies to new accounts
- [ ] Migration script works without breaking existing subscriptions

### ✅ Edge Cases
- [ ] User count below base users (should pay base price)
- [ ] User count at exactly base users (should pay base price only)
- [ ] Maximum user limits respected (50 users max)
- [ ] Downgrading users works correctly

## Customer Communication

### Before Migration
- Explain the benefits: "No more confusion about minimum users"
- Highlight: "Your price is now more predictable"
- Emphasize: "Same great features, clearer pricing"

### Pricing Display Examples

**Old Display:**
```
Data Rooms: €49.67 per user/month (minimum 3 users)
Total for 3 users: €149/month
```

**New Display:**  
```
Data Rooms: €149/month (3 users included) + €49/month per additional user
Total for 3 users: €149/month
Total for 5 users: €247/month (€149 base + €98 for 2 additional)
```

## Rollback Plan

If issues arise:

1. **Immediate Rollback**: Set `isHybridPricingPlan()` to return `false` for affected plans
2. **Customer Impact**: Minimal - existing subscriptions continue working
3. **New Subscriptions**: Fall back to legacy per-user pricing
4. **Database**: No schema changes required, just limit calculations

## Benefits Achieved

### For Customers
- ✅ Clear understanding of base vs additional user costs
- ✅ Predictable minimum pricing
- ✅ Easy to understand scaling costs
- ✅ No confusion about minimum user requirements

### For Business
- ✅ Maintains minimum revenue per plan
- ✅ Easier upselling of additional users
- ✅ Reduced customer support queries about pricing
- ✅ More transparent pricing model

## Monitoring

After deployment, monitor:
- Subscription creation success rates
- Webhook processing errors
- Customer support tickets about pricing
- Revenue impact from clearer pricing

## Support Scripts

### Check Current Pricing for Customer
```bash
npx ts-node -e "
import { calculateHybridPricing } from './ee/stripe/pricing-utils';
console.log(calculateHybridPricing('datarooms', 5, 'monthly'));
"
```

### Verify Stripe Products
```bash
# List all products to verify setup
stripe products list --limit=20
```

## Next Steps

1. **Phase 1**: Deploy to test environment and verify all functionality
2. **Phase 2**: Create Stripe products using the setup script
3. **Phase 3**: Deploy to production with feature flag
4. **Phase 4**: Gradually migrate interested existing customers
5. **Phase 5**: Update marketing materials and pricing pages

---

**Questions or Issues?**
- Check the implementation in `ee/stripe/pricing-utils.ts`
- Review webhook logic for subscription handling
- Test with Stripe's test mode before production deployment
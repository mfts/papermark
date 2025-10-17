import { useState } from "react";
import { calculateHybridPricing, formatHybridPricing } from "@/ee/stripe/pricing-utils";
import { PLAN_PRICING } from "@/ee/stripe/constants";

interface HybridPricingDisplayProps {
  planName: "Data Rooms" | "Data Rooms Plus";
  planSlug: "datarooms" | "datarooms-plus";
  period: "monthly" | "yearly";
  initialUsers?: number;
  onUserCountChange?: (userCount: number) => void;
  showUserSelector?: boolean;
}

export function HybridPricingDisplay({
  planName,
  planSlug,
  period,
  initialUsers = 3,
  onUserCountChange,
  showUserSelector = true,
}: HybridPricingDisplayProps) {
  const [userCount, setUserCount] = useState(initialUsers);
  
  const pricing = calculateHybridPricing(planSlug, userCount, period);
  const planPricing = PLAN_PRICING[planName];

  const handleUserCountChange = (newCount: number) => {
    setUserCount(newCount);
    onUserCountChange?.(newCount);
  };

  if (!pricing || !planPricing) {
    return <div>Pricing information not available</div>;
  }

  const periodLabel = period === "monthly" ? "month" : "year";
  const baseUsersIncluded = planSlug === "datarooms" ? 3 : 5;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{planName}</h3>
        <div className="text-right">
          <div className="text-2xl font-bold">
            €{pricing.totalPrice.toFixed(0)}/{periodLabel}
          </div>
          {period === "yearly" && (
            <div className="text-sm text-gray-600">
              (€{(pricing.totalPrice / 12).toFixed(0)}/month)
            </div>
          )}
        </div>
      </div>

      {showUserSelector && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Number of users
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleUserCountChange(Math.max(baseUsersIncluded, userCount - 1))}
              disabled={userCount <= baseUsersIncluded}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              -
            </button>
            <span className="px-3 py-1 border rounded min-w-[3rem] text-center">
              {userCount}
            </span>
            <button
              onClick={() => handleUserCountChange(Math.min(50, userCount + 1))}
              disabled={userCount >= 50}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Base plan ({baseUsersIncluded} users included)</span>
          <span>€{pricing.basePriceAmount}/{periodLabel}</span>
        </div>
        
        {pricing.additionalUsersCount > 0 && (
          <div className="flex justify-between">
            <span>
              Additional users ({pricing.additionalUsersCount} × {planPricing.extraUserPrice[period]})
            </span>
            <span>€{pricing.additionalUsersPrice.toFixed(0)}/{periodLabel}</span>
          </div>
        )}
        
        <hr className="my-2" />
        
        <div className="flex justify-between font-semibold">
          <span>Total for {userCount} users</span>
          <span>€{pricing.totalPrice.toFixed(0)}/{periodLabel}</span>
        </div>
      </div>

      {period === "yearly" && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
          💰 Save €{((pricing.totalPrice * 12) - (pricing.totalPrice * 10)).toFixed(0)} per year with yearly billing
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• You'll always pay for at least {baseUsersIncluded} users (base plan)</p>
        <p>• Additional users can be added or removed anytime</p>
        <p>• Pricing scales automatically as your team grows</p>
      </div>
    </div>
  );
}

// Comparison component to show old vs new pricing
interface PricingComparisonProps {
  planName: "Data Rooms" | "Data Rooms Plus";
  planSlug: "datarooms" | "datarooms-plus";
  period: "monthly" | "yearly";
  userCount: number;
}

export function PricingComparison({
  planName,
  planSlug,
  period,
  userCount,
}: PricingComparisonProps) {
  const newPricing = calculateHybridPricing(planSlug, userCount, period);
  
  // Calculate old pricing (pure per-user)
  const oldUnitPrice = planSlug === "datarooms" 
    ? (period === "monthly" ? 4967 : 3300) 
    : (period === "monthly" ? 6980 : 4980);
  const oldTotal = (oldUnitPrice / 100) * userCount;

  if (!newPricing) return null;

  const savings = oldTotal - newPricing.totalPrice;
  const periodLabel = period === "monthly" ? "month" : "year";

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-semibold">Pricing Comparison for {userCount} users</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600">Old Pricing (Per-User)</div>
          <div className="text-lg">€{oldTotal.toFixed(0)}/{periodLabel}</div>
          <div className="text-xs text-gray-600">
            {userCount} users × €{(oldUnitPrice / 100).toFixed(0)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-green-600">New Pricing (Hybrid)</div>
          <div className="text-lg">€{newPricing.totalPrice.toFixed(0)}/{periodLabel}</div>
          <div className="text-xs text-gray-600">
            Base + {newPricing.additionalUsersCount} additional
          </div>
        </div>
      </div>

      {savings > 0 && (
        <div className="bg-green-50 text-green-800 p-2 rounded text-sm">
          💰 Save €{savings.toFixed(0)}/{periodLabel} with new pricing!
        </div>
      )}
      
      {savings < 0 && (
        <div className="bg-blue-50 text-blue-800 p-2 rounded text-sm">
          ℹ️ New pricing: €{Math.abs(savings).toFixed(0)} more, but includes guaranteed base users
        </div>
      )}
    </div>
  );
}
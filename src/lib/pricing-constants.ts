// Base prices in USD
export const BASE_PRICES = {
  starter: 49,
  professional: 149,
  enterprise: null, // Custom pricing
} as const;

// Regional multipliers based on purchasing power and currency
export const REGIONAL_MULTIPLIERS: Record<string, number> = {
  'US': 1.0,
  'Europe': 0.93,
  'India': 82.76,
  'Pakistan': 293.1,
  'Malaysia': 4.66,
  'UAE': 3.62,
  'Saudi Arabia': 3.79,
  'Turkey': 34.48,
} as const;

// Regional currency symbols
export const REGIONAL_CURRENCIES: Record<string, string> = {
  'US': '$',
  'Europe': '€',
  'Pakistan': 'PKR ',
  'India': '₹',
  'Malaysia': 'RM ',
  'UAE': 'AED ',
  'Saudi Arabia': 'SAR ',
  'Turkey': '₺',
} as const;

// Calculate regional price for a given tier and region
export function calculateRegionalPrice(
  tier: 'starter' | 'professional',
  region: keyof typeof REGIONAL_MULTIPLIERS
): number {
  const basePrice = BASE_PRICES[tier];
  if (!basePrice) return 0;
  const multiplier = REGIONAL_MULTIPLIERS[region];
  return Math.round(basePrice * multiplier);
}

// Calculate discounted price for annual billing (20% off)
export function calculateAnnualPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 0.8);
}

// Get all regional pricing for a specific region
export function getRegionalPricing(region: keyof typeof REGIONAL_MULTIPLIERS) {
  return {
    currency: REGIONAL_CURRENCIES[region],
    starter: calculateRegionalPrice('starter', region),
    professional: calculateRegionalPrice('professional', region),
    enterprise: 'custom',
  };
}

// List of all available regions
export const AVAILABLE_REGIONS = Object.keys(
  REGIONAL_CURRENCIES
) as Array<keyof typeof REGIONAL_CURRENCIES>;

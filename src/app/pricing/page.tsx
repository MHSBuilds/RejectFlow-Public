'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getRegionalPricing,
  calculateAnnualPrice,
  AVAILABLE_REGIONS,
} from '@/lib/pricing-constants';

type BillingCycle = 'monthly' | 'annual';

export default function PricingPage() {
  const [selectedRegion, setSelectedRegion] = useState<typeof AVAILABLE_REGIONS[0]>('US');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const pricing = getRegionalPricing(selectedRegion);

  const generateMailto = (planName: string) => {
    const subject = `Interested in ${planName} Plan - ${selectedRegion}`;
    const body = `Hello,\n\nI am interested in the ${planName} Plan for RejectFlow.`;
    const params = new URLSearchParams({ subject, body });
    return `mailto:hassaan.sajjad@gmail.com?${params.toString()}`;
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent API Pricing</h1>
          <p className="text-xl text-gray-600 mb-6">
            Scale as you grow. All paid plans include 14-day trial with web app + API access.
          </p>

          {/* Region Selector */}
          <div className="flex justify-center items-center gap-3 mb-6">
            <label className="text-sm font-medium text-gray-700">Select your region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as typeof AVAILABLE_REGIONS[0])}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="US">🇺🇸 United States</option>
              <option value="Europe">🇪🇺 Europe</option>
              <option value="Pakistan">🇵🇰 Pakistan</option>
              <option value="India">🇮🇳 India</option>
              <option value="Malaysia">🇲🇾 Malaysia</option>
              <option value="UAE">🇦🇪 UAE</option>
              <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
              <option value="Turkey">🇹🇷 Turkey</option>
            </select>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-100 p-1 rounded-lg mb-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded font-medium transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              {billingCycle === 'annual' && (
                <span className="absolute -top-3 -right-8 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  💰 Save 20%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">{/* Free Plan */}
          <div className="rounded-lg p-8 border border-gray-200 bg-white flex flex-col h-full">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold">{pricing.currency}0</span>
                <span className="text-gray-600 ml-2">forever</span>
              </div>
              <p className="text-gray-600 text-sm">Try RejectFlow with our web application</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                '10 emails per month',
                'Manual candidate entry',
                'CSV/Excel upload',
                'Email template editor',
                'Company branding',
                'Basic analytics',
                'Community support',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button className="w-full py-3 rounded-lg font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors mt-auto">
              Get Started Free
            </button>
          </div>

          {/* Starter Plan */}
          <div className="rounded-lg p-8 border-2 border-blue-500 shadow-xl bg-white relative flex flex-col h-full">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold">
                  {pricing.currency}
                  {billingCycle === 'monthly'
                    ? pricing.starter
                    : calculateAnnualPrice(pricing.starter)}
                </span>
                <span className="text-gray-600 ml-2">
                  {billingCycle === 'monthly' ? 'per month' : 'per month (billed annually)'}
                </span>
              </div>
              <p className="text-gray-600 text-sm">Automate rejections with API integration</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                '2,500 emails/month via API',
                '1 API request = 1 email generated',
                'Single candidate generation per request',
                'Integrates with any ATS/HR system',
                'Email template customization',
                'Company branding',
                'Email support (24hr response)',
                'Up to 3 team members',
                '99.5% uptime SLA',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href={`/contact?plan=Starter`}
              className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors block text-center mt-auto"
            >
              Start 14-Day Trial
            </a>
          </div>

          {/* Professional Plan */}
          <div className="rounded-lg p-8 border border-gray-200 bg-white flex flex-col h-full">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold">
                  {pricing.currency}
                  {billingCycle === 'monthly'
                    ? pricing.professional
                    : calculateAnnualPrice(pricing.professional)}
                </span>
                <span className="text-gray-600 ml-2">
                  {billingCycle === 'monthly' ? 'per month' : 'per month (billed annually)'}
                </span>
              </div>
              <p className="text-gray-600 text-sm">Advanced API features for scaling teams</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                '10,000 emails/month via API',
                '1 API request = 1 email generated',
                'Bulk processing (up to 100 candidates/request)',
                'Integrates with any ATS/HR system',
                'Webhooks for real-time notifications',
                'Priority support (4hr response)',
                'Up to 10 team members',
                'Advanced analytics dashboard',
                '99.9% uptime SLA',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href={`/contact?plan=Professional`}
              className="w-full py-3 rounded-lg font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors block text-center mt-auto"
            >
              Start 14-Day Trial
            </a>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-lg p-8 border border-gray-200 bg-white flex flex-col h-full">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-600 text-sm">Full-scale API integration with dedicated support</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                'Unlimited API calls',
                '1 API request = 1 email generated',
                'Custom bulk processing limits',
                'Pre-built connectors (Workday, BambooHR, Greenhouse)',
                'Custom ATS integration support',
                'Webhooks + bi-directional sync',
                'Unlimited team members',
                'White-label options',
                '99.95% uptime SLA',
                'Dedicated account manager',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href={`/contact?plan=Enterprise`}
              className="w-full py-3 rounded-lg font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors block text-center mt-auto"
            >
              Contact Sales
            </a>
          </div>
        </div>

        {/* 14-Day Trial Section */}
        <div className="bg-white rounded-lg p-8 border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">14-Day Trial Includes</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="font-semibold mb-2">Web App Access</h3>
              <p className="text-sm text-gray-600">
                Test email quality and features through our interface. Perfect for decision-makers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="font-semibold mb-2">Full API Access</h3>
              <p className="text-sm text-gray-600">
                Your developers can test integration in parallel with full documentation.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-semibold mb-2">Trial Support</h3>
              <p className="text-sm text-gray-600">
                Get help from our team to ensure you see value quickly.
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            After 14 days, web app access ends. API access continues with your chosen plan.
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center">Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">Free</th>
                  <th className="text-center py-3 px-4">Starter</th>
                  <th className="text-center py-3 px-4">Professional</th>
                  <th className="text-center py-3 px-4">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Email Generation Method</td>
                  <td className="text-center py-3 px-4">Web App</td>
                  <td className="text-center py-3 px-4">API Only</td>
                  <td className="text-center py-3 px-4">API Only</td>
                  <td className="text-center py-3 px-4">API Only</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Monthly Volume</td>
                  <td className="text-center py-3 px-4">10 emails</td>
                  <td className="text-center py-3 px-4">2,500</td>
                  <td className="text-center py-3 px-4">10,000</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">API Conversion Rate</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">1 req = 1 email</td>
                  <td className="text-center py-3 px-4">1 req = 1 email</td>
                  <td className="text-center py-3 px-4">1 req = 1 email</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Additional Emails</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">$0.02/email</td>
                  <td className="text-center py-3 px-4">$0.015/email</td>
                  <td className="text-center py-3 px-4">Custom</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Candidates Per Request</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">1 (Single)</td>
                  <td className="text-center py-3 px-4">Up to 100 (Bulk)</td>
                  <td className="text-center py-3 px-4">Custom</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">ATS Integration</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">Your team integrates</td>
                  <td className="text-center py-3 px-4">Your team integrates</td>
                  <td className="text-center py-3 px-4">Pre-built Connectors</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Team Members</td>
                  <td className="text-center py-3 px-4">1</td>
                  <td className="text-center py-3 px-4">3</td>
                  <td className="text-center py-3 px-4">10</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Webhooks</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Pre-built ATS Connectors</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Support Response Time</td>
                  <td className="text-center py-3 px-4">Community</td>
                  <td className="text-center py-3 px-4">24 hours</td>
                  <td className="text-center py-3 px-4">4 hours</td>
                  <td className="text-center py-3 px-4">1 hour</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            <strong>All paid plans:</strong> Flexible API works with any ATS/HR system • <strong>Enterprise:</strong> Skip development with pre-built connectors
          </p>
          <p className="text-gray-600 mb-4">
            Need help choosing? <a href="/contact" className="text-blue-600 font-semibold hover:underline">Contact sales</a> with our team
          </p>
          <p className="text-sm text-gray-500">
            All plans include: Company branding • API documentation • Email templates • Analytics
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

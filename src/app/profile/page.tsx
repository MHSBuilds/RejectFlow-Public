'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedJson } from '@/lib/api-client';
import { useAuth } from '@/app/components/AuthProvider';

export default function ProfilePage() {
  const [senderName, setSenderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [hrApiKey, setHrApiKey] = useState('');
  const [maskedApiKey, setMaskedApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    if (!user) {
      return;
    }

    setUserEmail(user.email || '');

    // Fetch profile using authenticated API
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const { profile: profileData } = await response.json();
        const profile = profileData;

        if (profile) {
          setSenderName(profile.sender_name || '');
          setCompanyName(profile.company_name || '');
          const tier = profile.subscription_tier || 'free';
          setSubscriptionTier(tier);
          
          // For paid tiers, load from DB. For free tier, load from localStorage
          if (tier !== 'free') {
            setJobTitle(profile.job_title || '');
            setContactInfo(profile.contact_info || '');
          } else {
            // For free tier, load signature from localStorage (not stored in DB)
            const storedJobTitle = localStorage.getItem('job_title');
            const storedContactInfo = localStorage.getItem('contact_info');
            if (storedJobTitle) setJobTitle(storedJobTitle);
            if (storedContactInfo) setContactInfo(storedContactInfo);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }

    // Fetch API key info using authenticated API
    try {
      const response = await authenticatedJson('/api/profile/api-key', { method: 'GET' });
      const data = await response.json();
      
      if (data.apiKey) {
        setHrApiKey(data.apiKey);
        setMaskedApiKey(data.maskedKey || '');
      } else {
        setHrApiKey('');
        setMaskedApiKey('');
      }
      setHasApiKey(data.hasKey || false);
      
      if (data.subscriptionTier) {
        setSubscriptionTier(data.subscriptionTier);
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    }
    
    setLoading(false);
  };

  const generateApiKey = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      const response = await authenticatedJson('/api/profile/api-key', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.error) {
        alert('Failed to generate API key: ' + data.error);
      } else if (data.apiKey) {
        setHrApiKey(data.apiKey);
        setMaskedApiKey(data.maskedKey || `${data.apiKey.substring(0, 8)}${'•'.repeat(24)}${data.apiKey.substring(data.apiKey.length - 4)}`);
        setHasApiKey(true);
        alert('API key generated successfully! Make sure to copy it now - you won\'t be able to see it again.');
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
      alert('Failed to generate API key. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(hrApiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    // For free tier: store signature fields in localStorage only (NOT in database)
    // For paid tiers: store in database
    if (subscriptionTier === 'free') {
      localStorage.setItem('job_title', jobTitle);
      localStorage.setItem('contact_info', contactInfo);
    }

    // Save to database (sender_name and company_name always saved)
    const profileData: any = {
        user_id: user.id,
        sender_name: senderName,
        company_name: companyName,
        updated_at: new Date().toISOString()
    };

    // For paid tiers only, also save job_title and contact_info to DB
    if (subscriptionTier !== 'free') {
      profileData.job_title = jobTitle;
      profileData.contact_info = contactInfo;
    }

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.details || errorData.error || 'Unknown error';
      console.error('Profile save error:', errorData);
      alert('Failed to save profile: ' + errorMessage);
    } else {
      alert('Profile saved successfully!');
      // Reload profile to show updated data
      await loadProfile();
    }
    setSaving(false);
  };

  // Show loading state while auth is loading or profile is loading
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If auth finished loading and no user, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
      </div>

      {/* Subscription Tier Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-full font-medium ${
            subscriptionTier === 'enterprise' ? 'bg-gray-900 text-white' :
            subscriptionTier === 'professional' ? 'bg-purple-100 text-purple-800' :
            subscriptionTier === 'starter' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan
          </span>
          {subscriptionTier === 'free' && (
            <span className="text-gray-600">10 emails/month • Upgrade for more features</span>
          )}
          {subscriptionTier === 'starter' && (
            <span className="text-gray-600">100 API calls/month • HR Portal API</span>
          )}
          {subscriptionTier === 'professional' && (
            <span className="text-gray-600">500 API calls/month • Bulk Operations • Advanced API</span>
          )}
          {subscriptionTier === 'enterprise' && (
            <span className="text-gray-600">Unlimited API calls • Full Features</span>
          )}
        </div>
      </div>

      {/* HR Portal API Section - For paid plans */}
      {subscriptionTier !== 'free' ? (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔌 HR Portal API</h2>
          <p className="text-gray-600 mb-4">
            Integrate RejectFlow with your existing HR systems using this API key. 
            {subscriptionTier === 'starter' && ' Basic integration features available.'}
            {subscriptionTier === 'professional' && ' Advanced features including bulk operations.'}
            {subscriptionTier === 'enterprise' && ' Full enterprise features with webhooks.'}
          </p>
          
          {hasApiKey ? (
            <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <div className="flex gap-2">
              <input
                type="text"
                    value={hrApiKey || maskedApiKey}
                disabled
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    placeholder="rf_••••••••••••••••••••••••••••"
              />
              <button
                onClick={copyApiKey}
                    disabled={!hrApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {copiedApiKey ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Keep this key secure. Do not share it publicly. Store it in server environment variables only.
            </p>
                {maskedApiKey && !hrApiKey && (
                  <p className="text-xs text-yellow-600 mt-2">
                    ⚠️ For security, the full API key is only shown once when generated. Use the masked version above.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-900 mb-3">
                You don't have an API key yet. Generate one to start integrating with your HR systems.
              </p>
              <button
                onClick={generateApiKey}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {generating ? 'Generating...' : 'Generate API Key'}
              </button>
          </div>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">📖 API Documentation</h3>
            <p className="text-sm text-gray-600 mb-2">
              Base URL: <code className="bg-white px-2 py-1 rounded">https://rejectflow.vercel.app/api</code>
            </p>
            <p className="text-sm text-gray-600">
              Include your API key in the <code className="bg-white px-2 py-1 rounded">X-API-Key</code> header for all requests.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔌 HR Portal API</h2>
          <p className="text-gray-600 mb-4">
            API keys are available for Starter, Professional, and Enterprise plans. Upgrade to get access to our HR Portal API for integrating with your existing HR systems.
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 text-sm font-medium"
          >
            View Plans
          </a>
        </div>
      )}

      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sender Information</h2>
        <p className="text-gray-600 mb-6">
          Customize how your name appears in rejection emails. Recipients will see this name as the sender and can reply to your email address.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
            <input
              type="text"
              value={userEmail}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              Recipients will reply to this email address
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., John Doe"
            />
            <p className="text-sm text-gray-500 mt-1">
              This name will appear as the sender in emails
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., ABC Corporation"
            />
            <p className="text-sm text-gray-500 mt-1">
              Will appear in your email signature
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior HR Manager"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your job title for email signature
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Information</label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Phone: +1 (555) 123-4567 or Website: www.company.com"
            />
            <p className="text-sm text-gray-500 mt-1">
              Additional contact details for email signature
            </p>
            {subscriptionTier === 'free' && (
              <p className="text-xs text-yellow-600 mt-1">
                ℹ️ Free tier: This information is stored locally and not saved to database
              </p>
            )}
          </div>

          <div className="p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">📧 Email Preview (Free Tier)</h3>
            <p className="text-sm text-blue-800">
              <strong>From:</strong> {senderName || 'Recruitment Team'} &lt;noreply@rejectflow.app&gt;
            </p>
            <p className="text-sm text-blue-800">
              <strong>Reply-To:</strong> {userEmail}
            </p>
            {companyName && (
              <p className="text-sm text-blue-800">
                <strong>Company:</strong> {companyName}
              </p>
            )}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">Email Signature:</p>
              <p className="text-sm text-blue-800">{senderName || 'Your Name'}</p>
              {jobTitle && <p className="text-sm text-blue-800">{jobTitle}</p>}
              {companyName && <p className="text-sm text-blue-800">{companyName}</p>}
              {contactInfo && <p className="text-sm text-blue-800">{contactInfo}</p>}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              ℹ️ Free tier: RejectFlow sends emails. Paid tiers: Your HR system sends emails using our API.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';

export default function AddCandidatesPage() {
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage/check', {
        credentials: 'include', // Include cookies for NextAuth
      });
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Add Candidates</h1>
          <p className="text-gray-600 text-lg">
            Choose how you'd like to add candidates to generate rejection emails
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Manual Form Option */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow flex flex-col">
            <div className="text-center flex-1 flex flex-col">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Manual Form</h3>
              <p className="text-gray-600 mb-6">
                Traditional form entry. Fill out candidate details and feedback manually.
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6 flex-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Structured input</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Detailed feedback</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Familiar interface</span>
                </div>
              </div>
              <a
                href="/candidates/form"
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl inline-block mt-auto"
              >
                Open Form →
              </a>
            </div>
          </div>

          {/* Bulk Upload Option */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow flex flex-col">
            <div className="text-center flex-1 flex flex-col">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bulk Upload</h3>
              <p className="text-gray-600 mb-6">
                Upload CSV or Excel files for multiple candidates at once.
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6 flex-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>CSV & Excel support</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Batch processing</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Time efficient</span>
                </div>
              </div>
              <a
                href="/upload"
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl inline-block mt-auto"
              >
                Upload File →
              </a>
            </div>
          </div>
        </div>

        {/* Usage Banner */}
        {usage && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-gray-900">
                    Monthly Usage
                  </p>
                  <p className="text-sm text-gray-600">
                    {usage.used} of {usage.limit} emails sent this month
                    {usage.usageType === 'api_calls' && (
                      <span className="text-xs text-gray-500 block mt-1">(1 API request = 1 email generated)</span>
                    )}
                  </p>
                </div>
              </div>
              {usage.remaining === 0 ? (
                <a
                  href="/pricing"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700"
                >
                  Upgrade Plan
                </a>
              ) : (
                <a
                  href="/pricing"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Plans →
                </a>
              )}
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
              />
            </div>
            {usage.remaining === 0 && (
              <p className="text-xs text-red-600 mt-2">
                You've reached your monthly limit. Upgrade to send more emails.
              </p>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

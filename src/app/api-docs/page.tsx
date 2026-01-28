'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function APIDocsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'single', label: 'Single Generation' },
    { id: 'bulk', label: 'Bulk Generation' },
    { id: 'examples', label: 'Code Examples' }
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">HR Portal API Documentation</h1>
          <p className="text-xl text-gray-600">
            Integrate RejectFlow's AI-powered rejection email generation into your existing HR systems.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">API Overview</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Base URL</h3>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm">
                    https://rejectflow.vercel.app/api/hr
                  </code>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Your HR system calls our API with candidate details</li>
                    <li>We generate professional rejection email content using AI</li>
                    <li>You receive the generated content and send it using your own email system</li>
                    <li>You maintain full control over email delivery and branding</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Endpoints</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">POST</span>
                      <code className="text-sm">/generate-rejection</code>
                      <span className="text-gray-600 text-sm">Generate single rejection email</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">POST</span>
                      <code className="text-sm">/generate-bulk</code>
                      <span className="text-gray-600 text-sm">Generate multiple rejection emails (Professional+)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Why This Approach?</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• You keep using your existing email system (Outlook, Gmail, company SMTP)</li>
                    <li>• Emails come from your verified domain automatically</li>
                    <li>• No need to change your current HR workflows</li>
                    <li>• Full control over email delivery and tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'authentication' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">API Key</h3>
                  <p className="text-gray-600 mb-3">
                    All API requests require an API key in the request header. You can find your API key in your profile settings.
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <code className="text-sm">
                      X-API-Key: your-api-key-here
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate Limits</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly API Calls</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulk Limit</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Free</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No API access</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Starter</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100 calls</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Professional</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">500 calls</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25 candidates</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Enterprise</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Unlimited</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100 candidates</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Security Note</h4>
                  <p className="text-yellow-800 text-sm">
                    Keep your API key secure and never expose it in client-side code. 
                    Store it securely in your server environment variables.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'single' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Single Generation API</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Endpoint</h3>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm">
                    POST /api/hr/generate-rejection
                  </code>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Body</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{`{
  "candidate_name": "John Doe",
  "candidate_email": "john@example.com",
  "position": "Software Engineer",
  "rating": 6,
  "rejection_reasons": ["Skills gap", "Experience level"],
  "notes": "Good technical skills but lacks experience in our tech stack",
  "areas_for_improvement": ["Communication", "Leadership"]
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{`{
  "success": true,
  "rejection_email": {
    "subject": "Update on your application for Software Engineer",
    "content": "Dear John Doe,\\n\\nThank you for your interest...",
    "html_content": "<p>Dear John Doe,</p><p>Thank you for your interest...</p>",
    "candidate_name": "John Doe",
    "candidate_email": "john@example.com",
    "position": "Software Engineer",
    "rating": 6,
    "generated_at": "2024-01-15T10:30:00Z"
  }
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Fields</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li><code className="bg-gray-100 px-1 rounded">candidate_name</code> - Full name of the candidate</li>
                    <li><code className="bg-gray-100 px-1 rounded">candidate_email</code> - Email address of the candidate</li>
                    <li><code className="bg-gray-100 px-1 rounded">position</code> - Position they applied for</li>
                    <li><code className="bg-gray-100 px-1 rounded">rating</code> - Interview rating (1-10)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Optional Fields</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li><code className="bg-gray-100 px-1 rounded">rejection_reasons</code> - Array of rejection reasons</li>
                    <li><code className="bg-gray-100 px-1 rounded">notes</code> - Additional interview notes</li>
                    <li><code className="bg-gray-100 px-1 rounded">areas_for_improvement</code> - Areas for improvement</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bulk Generation API</h2>
              
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🔒 Professional+ Only</h4>
                  <p className="text-blue-800 text-sm">
                    Bulk operations are available for Professional and Enterprise plans only.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Endpoint</h3>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm">
                    POST /api/hr/generate-bulk
                  </code>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Body</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{`{
  "candidates": [
    {
      "candidate_name": "John Doe",
      "candidate_email": "john@example.com",
      "position": "Software Engineer",
      "rating": 6,
      "rejection_reasons": ["Skills gap"],
      "notes": "Good technical skills but lacks experience"
    },
    {
      "candidate_name": "Jane Smith",
      "candidate_email": "jane@example.com",
      "position": "Product Manager",
      "rating": 4,
      "rejection_reasons": ["Experience level", "Cultural fit"],
      "notes": "Not a good fit for our team"
    }
  ]
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{`{
  "success": true,
  "processed": 2,
  "total": 2,
  "errors": 0,
  "results": [
    {
      "index": 0,
      "success": true,
      "rejection_email": {
        "subject": "Update on your application for Software Engineer",
        "content": "Dear John Doe...",
        "html_content": "<p>Dear John Doe...</p>",
        "candidate_name": "John Doe",
        "candidate_email": "john@example.com",
        "position": "Software Engineer",
        "rating": 6,
        "generated_at": "2024-01-15T10:30:00Z"
      }
    }
  ]
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Bulk Limits</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li><strong>Professional:</strong> Up to 25 candidates per request</li>
                    <li><strong>Enterprise:</strong> Up to 100 candidates per request</li>
                    <li>Each candidate counts as 1 API call toward your monthly limit</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Examples</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript/Node.js</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{`const generateRejectionEmail = async (candidateData) => {
  const response = await fetch('https://rejectflow.vercel.app/api/hr/generate-rejection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.REJECTFLOW_API_KEY
    },
    body: JSON.stringify(candidateData)
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }

  return await response.json();
};

// Usage
const candidateData = {
  candidate_name: "John Doe",
  candidate_email: "john@example.com",
  position: "Software Engineer",
  rating: 6,
  rejection_reasons: ["Skills gap", "Experience level"],
  notes: "Good technical skills but lacks experience"
};

const result = await generateRejectionEmail(candidateData);
console.log(result.rejection_email.content);`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Python</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{`import requests
import os

def generate_rejection_email(candidate_data):
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': os.getenv('REJECTFLOW_API_KEY')
    }
    
    response = requests.post(
        'https://rejectflow.vercel.app/api/hr/generate-rejection',
        json=candidate_data,
        headers=headers
    )
    
    if response.status_code != 200:
        raise Exception(f"API Error: {response.status_code}")
    
    return response.json()

# Usage
candidate_data = {
    "candidate_name": "John Doe",
    "candidate_email": "john@example.com",
    "position": "Software Engineer",
    "rating": 6,
    "rejection_reasons": ["Skills gap", "Experience level"],
    "notes": "Good technical skills but lacks experience"
}

result = generate_rejection_email(candidate_data)
print(result['rejection_email']['content'])`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">cURL</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{`curl -X POST https://rejectflow.vercel.app/api/hr/generate-rejection \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key-here" \\
  -d '{
    "candidate_name": "John Doe",
    "candidate_email": "john@example.com",
    "position": "Software Engineer",
    "rating": 6,
    "rejection_reasons": ["Skills gap", "Experience level"],
    "notes": "Good technical skills but lacks experience"
  }'`}</pre>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">💡 Integration Tips</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Store your API key in environment variables</li>
                    <li>• Implement retry logic for failed requests</li>
                    <li>• Cache generated content if needed for your workflow</li>
                    <li>• Monitor your API usage to stay within limits</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


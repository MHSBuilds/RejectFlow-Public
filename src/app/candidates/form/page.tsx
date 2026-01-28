'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authenticatedJson } from '@/lib/api-client';

export default function ManualFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    position: '',
    rating: 5,
    notes: '',
    rejection_reasons: [] as string[],
    areas_for_improvement: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const rejectionReasons = [
    'Skills gap',
    'Experience level',
    'Cultural fit',
    'Communication',
    'Technical knowledge',
    'Leadership potential',
    'Salary expectations',
    'Location mismatch'
  ];

  const improvementAreas = [
    'Technical skills',
    'Communication skills',
    'Leadership abilities',
    'Industry knowledge',
    'Problem solving',
    'Team collaboration',
    'Time management',
    'Adaptability',
    'Strategic thinking',
    'Analytical skills',
    'Presentation skills',
    'Project management',
    'Attention to detail',
    'Decision making',
    'Conflict resolution',
    'Customer focus'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const handleCheckboxChange = (field: 'rejection_reasons' | 'areas_for_improvement', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Validate rejection reasons
    if (formData.rejection_reasons.length === 0) {
      setResult({ error: 'Please select at least one rejection reason' });
      setLoading(false);
      return;
    }

    try {
      // Call new manual add API with JSON data
      const response = await authenticatedJson('/api/candidates/add-manual', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || 'Failed to create candidate' });
      } else {
        setResult({ success: true, message: 'Candidate added successfully! Draft email generated.' });
        // Redirect to drafts page after a short delay
        setTimeout(() => {
          router.push('/drafts');
        }, 1000);
      }
    } catch (error) {
      setResult({ error: 'Network error: Failed to create candidate' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Candidate</h1>
          <p className="text-gray-600">
            Fill out the candidate details and interview feedback to generate a rejection email
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {result?.error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {result.error}
            </div>
          )}

          {result?.success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {result.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Candidate Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior Software Engineer"
                  required
                />
              </div>
            </div>

            {/* Interview Feedback */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Interview Feedback</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1-10) *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    name="rating"
                    min="1"
                    max="10"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-blue-600 w-8 text-center">
                    {formData.rating}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the interview, strengths, concerns, etc."
                />
              </div>
            </div>

            {/* Rejection Reasons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Rejection Reasons *
                {formData.rejection_reasons.length === 0 && result?.error?.includes('rejection reason') && (
                  <span className="text-sm text-red-600 ml-2">(Required - select at least one)</span>
                )}
              </h3>
              <div className={`grid grid-cols-2 gap-3 ${formData.rejection_reasons.length === 0 && result?.error?.includes('rejection reason') ? 'border-2 border-red-300 rounded-lg p-3' : ''}`}>
                {rejectionReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rejection_reasons.includes(reason)}
                      onChange={() => handleCheckboxChange('rejection_reasons', reason)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
              <div className="grid grid-cols-2 gap-3">
                {improvementAreas.map((area) => (
                  <label key={area} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.areas_for_improvement.includes(area)}
                      onChange={() => handleCheckboxChange('areas_for_improvement', area)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating Candidate...
                  </span>
                ) : (
                  'Create Candidate & Generate Email'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

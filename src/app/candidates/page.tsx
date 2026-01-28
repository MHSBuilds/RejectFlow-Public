'use client';

import { useState, useEffect } from 'react';
import { CandidateWithFeedback } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates', {
        credentials: 'include', // Include cookies for NextAuth
      });
      
      const data = await response.json();
      const fetchedCandidates = data.candidates || [];
      setCandidates(fetchedCandidates);
      
      // Check if there are candidates with NULL user_id (orphan candidates)
      const hasOrphanCandidates = fetchedCandidates.some((c: any) => !c.user_id);
      setShowMigrationBanner(hasOrphanCandidates);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateUserData = async () => {
    setMigrating(true);
    try {
      const response = await fetch('/api/migrate/user-data', {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Migration successful! ${data.migrated.candidates} candidates and ${data.migrated.drafts} drafts migrated.`);
        setShowMigrationBanner(false);
        // Refresh candidates list
        await fetchCandidates();
      } else {
        alert('Migration failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Migration error:', error);
      alert('Failed to migrate data');
    } finally {
      setMigrating(false);
    }
  };

  const generateDraft = async (candidateId: string, feedbackId: string) => {
    setGenerating(candidateId);
    try {
      const response = await fetch('/api/drafts/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for NextAuth
        body: JSON.stringify({ candidate_id: candidateId, feedback_id: feedbackId }),
      });

      const data = await response.json();
      if (data.draft) {
        // Refresh candidates to show updated draft status
        fetchCandidates();
        alert('Draft email generated successfully!');
      } else {
        alert('Failed to generate draft: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to generate draft');
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Candidates</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Candidates</h1>
        
        {showMigrationBanner && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Legacy Data Detected
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Some candidates were created before the authentication update. Click below to assign them to your account.
                </p>
              </div>
              <button
                onClick={migrateUserData}
                disabled={migrating}
                className="ml-4 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {migrating ? 'Migrating...' : 'Migrate Data'}
              </button>
            </div>
          </div>
        )}
        
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No candidates found.</p>
            <a href="/candidates/add" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
              Add Candidates
            </a>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <li key={candidate.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {candidate.full_name}
                          </h3>
                          <p className="text-sm text-gray-600">{candidate.email}</p>
                          <p className="text-sm text-gray-500">{candidate.position}</p>
                        </div>
                        
                        {candidate.feedback && (
                          <div className="text-right">
                            <div className="flex items-center space-x-4">
                              <div>
                                <span className="text-sm text-gray-500">Rating:</span>
                                <span className="ml-1 text-sm font-medium">
                                  {candidate.feedback.rating}/10
                                </span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Status:</span>
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                  candidate.rejection_email?.status === 'sent' ? 'bg-green-100 text-green-800' :
                                  candidate.rejection_email?.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                  candidate.rejection_email?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {candidate.rejection_email?.status || 'No draft'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {candidate.feedback && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {candidate.feedback.notes}
                          </p>
                          {candidate.feedback.rejection_reasons.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Rejection Reasons:</span>{' '}
                              {candidate.feedback.rejection_reasons.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      {candidate.feedback ? (
                        candidate.rejection_email ? (
                          <a
                            href={`/drafts/${candidate.rejection_email.id}`}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                          >
                            View Draft
                          </a>
                        ) : (
                          <button
                            onClick={() => generateDraft(candidate.id, candidate.feedback!.id)}
                            disabled={generating === candidate.id}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                          >
                            {generating === candidate.id ? 'Generating...' : 'Generate Draft'}
                          </button>
                        )
                      ) : (
                        <span className="text-sm text-gray-500">No feedback</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

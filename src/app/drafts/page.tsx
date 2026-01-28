'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DraftWithDetails } from '@/types';

// ensure fresh data; client already fetches but SSR caches can interfere
export const dynamic = 'force-dynamic';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    fetchDrafts();
  }, []);

  // Refresh drafts when navigating back to this page
  useEffect(() => {
    if (pathname === '/drafts') {
      fetchDrafts();
    }
  }, [pathname]);

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/api/drafts', {
        cache: 'no-store',
        credentials: 'include', // Include cookies for NextAuth
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch drafts');
      }
      
      const data = await response.json();
      setDrafts(data.drafts || []);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      setDrafts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Draft Emails</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">Loading drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Draft Emails</h1>
      
      {drafts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No draft emails found.</p>
          <a href="/candidates" className="btn btn-primary">
            View Candidates
          </a>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {drafts.map((draft) => (
              <li key={draft.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {draft.candidate.full_name}
                        </h3>
                        <p className="text-sm text-gray-600">{draft.candidate.email}</p>
                        <p className="text-sm text-gray-500">{draft.candidate.position}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="text-sm text-gray-500">Version:</span>
                            <span className="ml-1 text-sm font-medium">{draft.version}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Status:</span>
                            <span className={`ml-1 status-badge ${
                              draft.status === 'sent' ? 'status-sent' :
                              draft.status === 'approved' ? 'status-approved' :
                              draft.status === 'rejected' ? 'status-rejected' :
                              'status-draft'
                            }`}>
                              {draft.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Created:</span>
                            <span className="ml-1 text-sm text-gray-600">
                              {new Date(draft.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {draft.draft_content.substring(0, 200)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex-shrink-0">
                    <a
                      href={`/drafts/${draft.id}`}
                      className="btn btn-secondary"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

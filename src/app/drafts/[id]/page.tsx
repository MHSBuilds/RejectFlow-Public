'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DraftWithDetails } from '@/types';
import { authenticatedJson } from '@/lib/api-client';

interface DraftPageProps {
  params: { id: string }
}

export default function DraftDetailPage({ params }: DraftPageProps) {
  const [draft, setDraft] = useState<DraftWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [redraftInstructions, setRedraftInstructions] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    fetchDraft();
  }, [params.id]);

  // Refresh draft when navigating back to this page to prevent stale data
  useEffect(() => {
    if (pathname === `/drafts/${params.id}`) {
      fetchDraft();
    }
  }, [pathname, params.id]);

  const fetchDraft = async () => {
    try {
      // Always fetch fresh data, no cache
      const response = await fetch(`/api/drafts/${params.id}`, { cache: 'no-store' });
      const data = await response.json();
      if (data.draft) {
      setDraft(data.draft);
      }
    } catch (error) {
      console.error('Failed to fetch draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      const response = await fetch('/api/drafts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: params.id }),
      });

      const data = await response.json();
      if (data.draft) {
        setDraft(data.draft);
        // Refresh draft data to ensure UI is up to date
        await fetchDraft();
        alert('Draft approved successfully!');
      } else {
        alert('Failed to approve draft: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to approve draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRedraft = async () => {
    if (!redraftInstructions.trim()) {
      alert('Please provide redraft instructions');
      return;
    }

    setActionLoading('redraft');
    try {
      const response = await fetch('/api/drafts/redraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          draft_id: params.id, 
          instructions: redraftInstructions 
        }),
      });

      const data = await response.json();
      if (data.draft) {
        // Redirect to the new draft
        window.location.href = `/drafts/${data.draft.id}`;
      } else {
        alert('Failed to create redraft: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to create redraft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async () => {
    setActionLoading('send');
    try {
      // For free tier, get signature from localStorage (not stored in DB)
      const jobTitle = localStorage.getItem('job_title') || '';
      const contactInfo = localStorage.getItem('contact_info') || '';
      
      const response = await authenticatedJson('/api/send-email', { 
        method: 'POST', 
        body: { 
          draft_id: params.id,
          job_title: jobTitle || undefined,
          contact_info: contactInfo || undefined
        } 
      });

      const data = await response.json();
      if (data.draft) {
        setDraft(data.draft);
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to send email');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Draft Details</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Draft Details</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">Draft not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <a href="/drafts" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Drafts
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Draft Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Info */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Candidate Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Name</label>
                <p className="text-gray-900">{draft.candidate.full_name}</p>
              </div>
              <div>
                <label className="form-label">Email</label>
                <p className="text-gray-900">{draft.candidate.email}</p>
              </div>
              <div>
                <label className="form-label">Position</label>
                <p className="text-gray-900">{draft.candidate.position}</p>
              </div>
              <div>
                <label className="form-label">Rating</label>
                <p className="text-gray-900">{draft.feedback.rating}/10</p>
              </div>
            </div>
          </div>

          {/* Interview Feedback */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Interview Feedback</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Notes</label>
                <p className="text-gray-900">{draft.feedback.notes}</p>
              </div>
              <div>
                <label className="form-label">Rejection Reasons</label>
                <p className="text-gray-900">
                  {draft.feedback.rejection_reasons.join(', ')}
                </p>
              </div>
              <div>
                <label className="form-label">Areas for Improvement</label>
                <p className="text-gray-900">
                  {draft.feedback.areas_for_improvement.join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Email Content</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <div 
                className="text-sm text-gray-900"
                style={{ lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ 
                  __html: (() => {
                    let html = draft.draft_content;
                    // Convert markdown bold to HTML
                    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                    // Convert double newlines to paragraph breaks
                    html = html.replace(/\n\n+/g, '</p><p>');
                    // Convert single newlines to line breaks
                    html = html.replace(/\n/g, '<br>');
                    // Wrap in paragraph tags with styling
                    html = `<p style="margin: 0 0 1em 0; padding: 0;">${html}</p>`;
                    return html;
                  })()
                }}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`ml-2 status-badge ${
                  draft.status === 'sent' ? 'status-sent' :
                  draft.status === 'approved' ? 'status-approved' :
                  draft.status === 'rejected' ? 'status-rejected' :
                  'status-draft'
                }`}>
                  {draft.status}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Version:</span>
                <span className="ml-2 text-sm font-medium">{draft.version}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {new Date(draft.created_at).toLocaleString()}
                </span>
              </div>
              {(draft as any).updated_at && (
                <div>
                  <span className="text-sm text-gray-500">Last Updated:</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {new Date((draft as any).updated_at).toLocaleString()}
                  </span>
                </div>
              )}
              {draft.sent_at && (
                <div>
                  <span className="text-sm text-gray-500">Sent:</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {new Date(draft.sent_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              {draft.status === 'draft' && (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading === 'approve'}
                  className="w-full btn btn-success disabled:opacity-50"
                >
                  {actionLoading === 'approve' ? 'Approving...' : 'Approve Draft'}
                </button>
              )}

              {draft.status === 'approved' && (
                <button
                  onClick={handleSend}
                  disabled={actionLoading === 'send'}
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  {actionLoading === 'send' ? 'Sending...' : 'Send Email'}
                </button>
              )}

              {draft.status !== 'sent' && (
                <div className="space-y-2">
                  <label className="form-label">Request Redraft</label>
                  <textarea
                    value={redraftInstructions}
                    onChange={(e) => setRedraftInstructions(e.target.value)}
                    placeholder="Provide instructions for the redraft..."
                    className="form-input"
                    rows={3}
                  />
                  <button
                    onClick={handleRedraft}
                    disabled={actionLoading === 'redraft' || !redraftInstructions.trim()}
                    className="w-full btn btn-warning disabled:opacity-50"
                  >
                    {actionLoading === 'redraft' ? 'Creating...' : 'Request Redraft'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  position: string;
  created_at: string;
}

export interface InterviewFeedback {
  id: string;
  candidate_id: string;
  interviewer_name: string;
  rating: number;
  notes: string;
  rejection_reasons: string[];
  areas_for_improvement: string[];
  created_at: string;
}

export interface RejectionEmail {
  id: string;
  candidate_id: string;
  feedback_id: string;
  draft_content: string;
  status: 'draft' | 'approved' | 'rejected' | 'sent';
  version: number;
  redraft_instructions?: string;
  created_at: string;
  sent_at?: string;
}

export interface CandidateWithFeedback extends Candidate {
  feedback?: InterviewFeedback;
  rejection_email?: RejectionEmail;
}

export interface DraftWithDetails extends RejectionEmail {
  candidate: Candidate;
  feedback: InterviewFeedback;
}

export interface UploadData {
  full_name: string;
  email: string;
  position: string;
  rating: number;
  notes: string;
  rejection_reasons: string;
  areas_for_improvement: string;
}

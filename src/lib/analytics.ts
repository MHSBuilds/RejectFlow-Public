import { supabase } from './supabase';

export async function trackEvent(eventType: string, eventData?: any) {
  if (!supabase) return;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_analytics')
    .insert({
      user_id: user.id,
      event_type: eventType,
      event_data: eventData
    });
}

// Track common events
export const analytics = {
  candidateAdded: (method: 'chat' | 'form' | 'upload') => 
    trackEvent('candidate_added', { method }),
  
  draftGenerated: () => 
    trackEvent('draft_generated'),
  
  emailSent: () => 
    trackEvent('email_sent'),
  
  draftRedrafted: () => 
    trackEvent('draft_redrafted'),
};



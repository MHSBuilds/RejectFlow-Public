import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified custom domain email for RejectFlow
const DEFAULT_SENDER = 'noreply@rejectflow.app';

/**
 * Process email content to:
 * 1. Convert markdown bold (**text**) to HTML bold (<strong>text</strong>)
 * 2. Remove placeholder fields like [Your Name], [Your Job Title], etc.
 * 3. Convert newlines to HTML tags for Outlook/non-Gmail compatibility
 */
export function processEmailContent(content: string): string {
  let processed = content;
  
  // Convert markdown bold (**text**) to HTML bold
  // Handle both single and multiple bold sections
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Remove "Subject:" lines if AI includes them in the email body
  // Match patterns like "Subject: ..." or "Subject:..." on their own line or with text after
  // Also handle cases where it might be at the start of the content
  processed = processed.replace(/^Subject\s*:\s*.+$/gim, '');
  // Also remove if it appears anywhere in the content (not just start of line)
  processed = processed.replace(/Subject\s*:\s*[^\n]+/gi, '');
  // Clean up any double newlines that might result
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  // Remove placeholder fields
  const placeholders = [
    '[Your Name]',
    '[Your Job Title]',
    '[Your Company]',
    '[Your Contact Information]'
  ];
  
  placeholders.forEach((placeholder) => {
    // Remove placeholder on its own line
    processed = processed.replace(new RegExp(`^\\s*${placeholder.replace(/[\[\]]/g, '\\$&')}\\s*$`, 'gm'), '');
    // Remove placeholder inline (with surrounding text)
    processed = processed.replace(new RegExp(placeholder.replace(/[\[\]]/g, '\\$&'), 'g'), '');
  });
  
  // Clean up multiple consecutive newlines (max 2 consecutive)
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  // Fix "Best Regards" spacing - reduce spacing after it (only one newline, no extra)
  // Match patterns like "Best regards,\n\n\n" and normalize to "Best regards,\n"
  processed = processed.replace(/(Best regards,?|Warm regards,?|Sincerely,?)\s*\n{2,}/g, '$1\n');
  
  // Remove any trailing newlines before signature/closing
  processed = processed.replace(/\n{3,}(Best regards|Warm regards|Sincerely)/g, '\n$1');
  
  // Convert newlines to HTML for Outlook/non-Gmail compatibility
  // Double newlines = paragraph breaks, single newlines = line breaks
  processed = processed.replace(/\n\n+/g, '</p><p>'); // Multiple newlines = paragraph break
  processed = processed.replace(/\n/g, '<br>'); // Single newline = line break
  
  // Wrap in paragraph tags
  processed = `<p>${processed}</p>`;
  
  // Trim whitespace
  processed = processed.trim();
  
  return processed;
}

export async function sendRejectionEmail(
  to: string,
  subject: string,
  content: string,
  candidateName: string,
  userEmail?: string,
  senderName?: string,
  companyName?: string,
  jobTitle?: string,
  contactInfo?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Log signature fields for debugging
    console.log('sendRejectionEmail - Signature fields:', {
      senderName: senderName || '(empty)',
      companyName: companyName || '(empty)',
      jobTitle: jobTitle || '(empty)',
      contactInfo: contactInfo || '(empty)',
      companyNameLength: companyName?.length || 0,
      companyNameTrimmed: companyName?.trim() || '(empty after trim)'
    });
    
    // Process email content: convert markdown to HTML and remove placeholders
    const processedContent = processEmailContent(content);
    
    // Build the display name
    const displayName = senderName || companyName || 'Recruitment Team';
    
    // Use default sender for free tier (paid tiers use HR Portal API)
    const fromHeader = `${displayName} <${DEFAULT_SENDER}>`;
    
    // Log the from header for debugging
    console.log('sendRejectionEmail - From header:', {
      displayName,
      senderName: senderName || '(not provided)',
      companyName: companyName || '(not provided)',
      fromHeader,
      defaultSender: DEFAULT_SENDER
    });
    
    const { data, error } = await resend.emails.send({
      from: fromHeader,
      reply_to: userEmail,
      to: [to],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            p { margin: 12px 0; word-wrap: break-word; }
            strong { font-weight: bold; }
            .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666666; font-size: 13px; line-height: 1.5; }
            .signature div { margin-bottom: 4px; }
            .signature-name { font-weight: bold; }
            .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; color: #999999; font-size: 11px; }
          </style>
        </head>
        <body>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 20px; background-color: #f5f5f5;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="background-color: #ffffff; padding: 0;">
                      <div class="content">
                        ${processedContent}
                      </div>
                      ${(senderName || jobTitle || companyName || contactInfo) ? `
                      <div class="signature" style="padding: 0 30px;">
                        ${senderName?.trim() ? `<div class="signature-name">${senderName.trim()}</div>` : ''}
                        ${jobTitle?.trim() ? `<div>${jobTitle.trim()}</div>` : ''}
                        ${companyName?.trim() ? `<div>${companyName.trim()}</div>` : ''}
                        ${contactInfo?.trim() ? `<div>${contactInfo.trim()}</div>` : ''}
                      </div>
                      ` : ''}
                      <div class="footer" style="padding: 0 30px;">
                        <p style="margin: 0;">This email was sent by our automated recruitment system.${userEmail ? `<br/>Reply to this email to contact the sender.` : ''}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

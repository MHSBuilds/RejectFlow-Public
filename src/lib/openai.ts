import OpenAI from 'openai';

const openRouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://rejectflow.vercel.app',
    'X-Title': 'RejectFlow - Recruitment Assistant',
  },
});

// Tiered model configuration with fallback - Best-in-class models for professional email content
const MODELS = {
  senior: process.env.MODEL_SENIOR || 'anthropic/claude-opus-4.5',
  standard: process.env.MODEL_STANDARD || 'anthropic/claude-sonnet-4.5',
  fallback: process.env.MODEL_FALLBACK || 'openai/gpt-4-turbo',
};

// Fallback model configuration
const FALLBACK_MAX_TOKENS = 2000; // hard upper bound for fallback model completions

const HEADING_LABELS = [
  'Leadership Abilities',
  'Strategic Thinking',
  'Team Collaboration',
];

// Normalize and validate generated content
function normalizeContent(content?: string): string {
  return (content ?? '').trim();
}

function ensureContentOrThrow(content: string, model: string, minLength = 20): string {
  const normalized = normalizeContent(content);
  if (!normalized || normalized.length < minLength) {
    throw new Error(`EmptyOrShortContent: model=${model}, length=${normalized.length}`);
  }
  return normalized;
}

function isLikelyCompleteEmail(text: string): boolean {
  const normalized = normalizeContent(text);
  if (normalized.length < 800) return false;

  const hasGreeting = normalized.startsWith('Dear ');
  const hasClosing =
    normalized.includes('Best Regards,') ||
    normalized.includes('Best regards,');
  const hasBoldHeadings = /\*\*.+?:\*\*/.test(normalized);

  return hasGreeting && hasClosing && hasBoldHeadings;
}

function enforceBoldHeadings(text: string): string {
  let result = text;
  for (const label of HEADING_LABELS) {
    const plain = new RegExp(`(^|\\n)${label}:`, 'g');
    const bold = `$1**${label}:**`;
    result = result.replace(plain, bold);
  }
  return result;
}

const INCOMPLETE_EMAIL_ERROR_PREFIX = 'IncompleteEmailError';

function ensureEmailCompleteOrThrow(content: string, model: string): string {
  const normalized = ensureContentOrThrow(content, model, 200);
  if (!isLikelyCompleteEmail(normalized)) {
    throw new Error(`${INCOMPLETE_EMAIL_ERROR_PREFIX}: model=${model}, length=${normalized.length}`);
  }
  return normalized;
}

// Seniority-based model selection
function getModelForPosition(position: string): string {
  const positionLower = position.toLowerCase();
  
  const seniorKeywords = [
    'senior', 'lead', 'principal', 'staff',
    'manager', 'director', 'head',
    'vp', 'vice president',
    'chief', 'cto', 'cfo', 'ceo', 'coo', 'cio'
  ];
  
  const isSeniorRole = seniorKeywords.some(keyword => positionLower.includes(keyword));
  
  return isSeniorRole ? MODELS.senior : MODELS.standard;
}

// Check OpenRouter balance
async function checkOpenRouterBalance(): Promise<number | null> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      console.warn('Failed to check OpenRouter balance:', response.status);
      return null; // Return null if check fails - proceed with normal flow
    }
    
    const data = await response.json();
    const balance = (data.data?.total_credits || 0) - (data.data?.total_usage || 0);
    return balance;
  } catch (error) {
    console.warn('Error checking OpenRouter balance:', error);
    return null; // Return null on error - proceed with normal flow
  }
}

async function callFallbackWithRetry(
  messages: { role: string; content: string }[],
  options: { max_tokens: number; temperature: number }
): Promise<string> {
  const baseOptions = {
    ...options,
    max_tokens: FALLBACK_MAX_TOKENS,
  };

  try {
    const completion = await openRouter.chat.completions.create({
      model: MODELS.fallback,
      messages: messages as any,
      ...baseOptions,
    });
    const content = completion.choices[0]?.message?.content;
    const normalized = ensureEmailCompleteOrThrow(content || '', MODELS.fallback);
    return enforceBoldHeadings(normalized);
  } catch (error: any) {
    const isIncomplete =
      error instanceof Error &&
      error.message.startsWith(INCOMPLETE_EMAIL_ERROR_PREFIX);

    console.warn(
      `Fallback model initial attempt failed (${isIncomplete ? 'incomplete email' : 'API error'}), retrying once...`,
      error
    );

    // Retry once with an explicit instruction to fully rewrite the email
    const retryMessages = [...messages];
    const lastIndex = retryMessages.length - 1;
    if (lastIndex >= 0) {
      retryMessages[lastIndex] = {
        ...retryMessages[lastIndex],
        content:
          'The previous email was cut off. Rewrite the entire rejection email from the beginning, ensuring a complete email with greeting, 3–4 full paragraphs, bolded improvement headings, and a closing with "Best Regards,".\n\n' +
          retryMessages[lastIndex].content,
      };
    }

    const retryCompletion = await openRouter.chat.completions.create({
      model: MODELS.fallback,
      messages: retryMessages as any,
      ...baseOptions,
    });
    const retryContent = retryCompletion.choices[0]?.message?.content;
    const normalizedRetry = ensureEmailCompleteOrThrow(
      retryContent || '',
      MODELS.fallback
    );
    return enforceBoldHeadings(normalizedRetry);
  }
}

// Helper function to call API with fallback
async function callWithFallback(
  model: string,
  messages: { role: string; content: string }[],
  options: { max_tokens: number; temperature: number },
  skipBalanceCheck: boolean = false
): Promise<string> {
  // Check balance before attempting primary model (unless explicitly skipped)
  if (!skipBalanceCheck) {
    const balance = await checkOpenRouterBalance();
    if (balance !== null && balance <= 0) {
      console.warn(
        `OpenRouter balance is ${balance}, using fallback model ${MODELS.fallback} directly`
      );
      // Skip primary model, go directly to fallback
      return callFallbackWithRetry(messages, options);
    }
  }

  try {
    const completion = await openRouter.chat.completions.create({
      model,
      messages: messages as any,
      ...options,
    });
    const content = completion.choices[0]?.message?.content;
    // For Claude primary models, we only enforce a basic minimum length
    return ensureContentOrThrow(content || '', model, 100);
  } catch (error: any) {
    // Check for 402 (insufficient credits) or other credit-related errors
    const isCreditError =
      error?.status === 402 ||
      error?.response?.status === 402 ||
      error?.message?.toLowerCase().includes('insufficient credits') ||
      error?.message?.toLowerCase().includes('payment required');

    if (isCreditError) {
      console.warn(
        `Credit error detected (${error?.status || 'unknown'}), using fallback model ${MODELS.fallback}:`,
        error
      );
    } else {
      console.warn(
        `Primary model ${model} failed, falling back to ${MODELS.fallback}:`,
        error
      );
    }

    // Use fallback model with retry
    return callFallbackWithRetry(messages, options);
  }
}

export async function generateRejectionEmail(
  candidateName: string,
  position: string,
  rating: number,
  notes: string,
  rejectionReasons: string[],
  areasForImprovement: string[],
  companyName?: string
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not configured');
  }

  // Determine seniority level from position title
  const positionLower = position.toLowerCase();
  let seniorityLevel = 'mid-level';
  let seniorityContext = '';
  
  if (positionLower.includes('junior') || positionLower.includes('entry') || positionLower.includes('intern')) {
    seniorityLevel = 'junior';
    seniorityContext = 'This is a junior/entry-level position. Focus improvement suggestions on gaining foundational experience, building projects, taking courses, and developing core skills.';
  } else if (positionLower.includes('senior') || positionLower.includes('lead') || positionLower.includes('principal') || positionLower.includes('staff')) {
    seniorityLevel = 'senior';
    seniorityContext = 'This is a senior-level position. Focus improvement suggestions on leadership, strategic thinking, mentoring others, advanced certifications, industry thought leadership, and complex problem-solving.';
  } else if (positionLower.includes('manager') || positionLower.includes('director') || positionLower.includes('head') || positionLower.includes('vp') || positionLower.includes('vice president')) {
    seniorityLevel = 'executive';
    seniorityContext = 'This is a management/executive position. Focus improvement suggestions on team management, strategic planning, organizational leadership, industry thought leadership, executive education, and driving business outcomes.';
  } else {
    seniorityContext = 'This is a mid-level position. Focus improvement suggestions on building expertise, taking on more responsibility, professional development, and advancing to senior roles.';
  }

  const prompt = `Generate a professional, empathetic rejection email for a job candidate.

Candidate Details:
- Name: ${candidateName}
- Position: ${position}
- Seniority Level: ${seniorityLevel}
- Interview Rating: ${rating}/10
- Interview Notes: ${notes}
- Rejection Reasons: ${rejectionReasons.join(', ')}
- Areas for Improvement: ${areasForImprovement.join(', ')}
${companyName ? `- Company Name: ${companyName}` : ''}

Seniority Context:
${seniorityContext}

Requirements:
- Be empathetic and professional
- ALWAYS start the email with the salutation: "Dear ${candidateName},"
- ${companyName ? `After the salutation, include: "Thank you for taking the time to interview for the ${position} position with us at ${companyName}."` : 'After the salutation, thank them for their time and interest'}
- Provide constructive feedback with specific, actionable guidance tailored to the ${seniorityLevel} level
- Include a dedicated section explaining HOW the candidate can work towards improving their identified areas for improvement
- For each area of improvement mentioned, provide 2-3 concrete, actionable steps or suggestions appropriate for ${seniorityLevel} professionals
- Tailor improvement suggestions based on seniority level:
  * Junior/Entry-level: Focus on gaining experience, building projects, taking courses, developing core skills, internships, volunteer work, or freelance projects
  * Mid-level: Focus on building expertise, taking on more responsibility, professional development, certifications, and advancing to senior roles
  * Senior: Focus on leadership, strategic thinking, mentoring others, advanced certifications, industry thought leadership, and complex problem-solving
  * Management/Executive: Focus on team management, strategic planning, organizational leadership, executive education, and driving business outcomes
- For "Hands-On Experience" specifically, tailor suggestions to the seniority level:
  * Junior: Suggest hands-on projects, internships, volunteer work, coding bootcamps, or entry-level freelance opportunities
  * Mid-level: Suggest leading projects, contributing to open source, taking on stretch assignments, or specialized training
  * Senior: Suggest mentoring programs, technical leadership roles, speaking at conferences, or consulting opportunities
  * Management/Executive: Suggest leading cross-functional teams, strategic initiatives, or executive coaching
- Keep it concise but comprehensive (3-4 paragraphs)
- End with encouragement for future opportunities
- ALWAYS end the email body with "Best Regards," before the signature (the signature will be added automatically by the system)
- Use a warm but professional tone
- Make the improvement suggestions feel genuine and helpful, not generic
- IMPORTANT: Do NOT include any placeholder fields or bracketed placeholders like [Your Name], [Your Job Title], [Your Company], or [Your Contact Information] in the email content. The signature will be added automatically by the system.
- CRITICAL: Do NOT include a subject line in the email content. Do NOT write "Subject:" anywhere in the email body. Only write the email body content starting with the greeting (e.g., "Dear [Name]," or "Thank you for...").

Generate the email content (body only, no subject line):`;

  const selectedModel = getModelForPosition(position);

  const draftContent = await callWithFallback(
    selectedModel,
    [{ role: "user", content: prompt }],
    { max_tokens: 800, temperature: 0.7 }
  );

  // Log API usage for tracking
  console.log('OpenRouter API call (generateRejectionEmail):', {
    model: selectedModel,
    fallback: MODELS.fallback,
    seniority: selectedModel === MODELS.senior ? 'senior+' : 'standard',
    prompt_length: prompt.length,
    response_length: draftContent.length || 0,
    timestamp: new Date().toISOString()
  });

  return draftContent;
}

export async function redraftEmail(
  originalContent: string,
  instructions: string,
  candidateName: string,
  position: string,
  rating: number,
  notes: string,
  rejectionReasons: string[],
  areasForImprovement: string[],
  companyName?: string
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not configured');
  }

  // Determine seniority level from position title
  const positionLower = position.toLowerCase();
  let seniorityLevel = 'mid-level';
  
  if (positionLower.includes('junior') || positionLower.includes('entry') || positionLower.includes('intern')) {
    seniorityLevel = 'junior';
  } else if (positionLower.includes('senior') || positionLower.includes('lead') || positionLower.includes('principal') || positionLower.includes('staff')) {
    seniorityLevel = 'senior';
  } else if (positionLower.includes('manager') || positionLower.includes('director') || positionLower.includes('head') || positionLower.includes('vp') || positionLower.includes('vice president')) {
    seniorityLevel = 'executive';
  }

  const prompt = `Redraft this rejection email based on the feedback provided.

Original Email:
${originalContent}

Redraft Instructions:
${instructions}

Original Context:
- Candidate: ${candidateName}
- Position: ${position}
- Seniority Level: ${seniorityLevel}
- Rating: ${rating}/10
- Notes: ${notes}
- Rejection Reasons: ${rejectionReasons.join(', ')}
- Areas for Improvement: ${areasForImprovement.join(', ')}
${companyName ? `- Company Name: ${companyName}` : ''}

Requirements:
- Tailor improvement suggestions to the ${seniorityLevel} level
- ALWAYS start the email with the salutation: "Dear ${candidateName},"
- ${companyName ? `If the opening line doesn't already mention the company, ensure it includes: "Thank you for taking the time to interview for the ${position} position with us at ${companyName}."` : ''}
- ALWAYS end the email body with "Best Regards," before the signature (the signature will be added automatically by the system)
- IMPORTANT: Do NOT include any placeholder fields or bracketed placeholders like [Your Name], [Your Job Title], [Your Company], or [Your Contact Information] in the email content. The signature will be added automatically by the system.
- CRITICAL: Do NOT include a subject line in the email content. Do NOT write "Subject:" anywhere in the email body. Only write the email body content starting with the greeting.

Generate the redrafted email (body only, no subject line):`;

  const selectedModel = getModelForPosition(position);

  const draftContent = await callWithFallback(
    selectedModel,
    [{ role: "user", content: prompt }],
    { max_tokens: 800, temperature: 0.7 }
  );

  // Log API usage for tracking
  console.log('OpenRouter API call (redraftEmail):', {
    model: selectedModel,
    fallback: MODELS.fallback,
    seniority: selectedModel === MODELS.senior ? 'senior+' : 'standard',
    prompt_length: prompt.length,
    response_length: draftContent.length || 0,
    timestamp: new Date().toISOString()
  });

  return draftContent;
}

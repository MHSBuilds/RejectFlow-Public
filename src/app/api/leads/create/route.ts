import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type LeadPayload = {
  name: string;
  email: string;
  company: string;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  message?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<LeadPayload>;

    if (!body.name || !body.email || !body.company || !body.plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // Always send notification email
    try {
      await resend.emails.send({
        from: 'RejectFlow <onboarding@resend.dev>',
        to: ['hassaan.sajjad@gmail.com'],
        subject: `New ${body.plan} lead: ${body.company}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height:1.6">
            <h2>New Pricing Lead</h2>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
            <p><strong>Name:</strong> ${body.name}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            <p><strong>Company:</strong> ${body.company}</p>
            <p><strong>Plan:</strong> ${body.plan}</p>
            ${body.message ? `<p><strong>Message:</strong><br/>${escapeHtml(body.message)}</p>` : ''}
          </div>
        `,
      });
    } catch (e) {
      // Continue even if email fails; still try Sheets
      console.error('Lead email notify failed:', e);
    }

    // Always try to append to Google Sheets (required for lead tracking)
    let sheetsStatus;
    try {
      console.log('[Leads API] Attempting to record lead in Google Sheets:', {
        name: body.name,
        email: body.email,
        company: body.company,
        plan: body.plan
      });
      sheetsStatus = await appendToLeadsSheet({
        timestamp,
        ...body as LeadPayload,
      });
      console.log('✓ Lead successfully recorded in Google Sheets:', sheetsStatus);
    } catch (e: any) {
      // Log detailed error for debugging
      console.error('✗ Failed to record lead in Google Sheets:', {
        error: e?.message || e,
        stack: e?.stack,
        name: body.name,
        email: body.email,
        company: body.company
      });
      sheetsStatus = { ok: false, reason: 'sheets_error' as const, error: e?.message || 'Unknown error' };
      // Continue - email notification was sent, which is the primary action
    }

    return NextResponse.json({
      success: true,
      sheets: sheetsStatus && 'ok' in sheetsStatus ? sheetsStatus : { ok: false },
    });
  } catch (error) {
    console.error('Leads create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function appendToLeadsSheet(row: { timestamp: string } & LeadPayload) {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  let sheetId = process.env.GOOGLE_SHEETS_LEADS_SHEET_ID;

  if (!clientEmail || !privateKey || !sheetId) {
    throw new Error('Google Sheets env not configured');
  }

  // Clean spreadsheet ID - remove URL fragments, extract just the ID
  // Handle cases where full URL might be stored instead of just ID
  const originalSheetId = sheetId;
  if (sheetId.includes('/spreadsheets/d/')) {
    const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) sheetId = match[1];
  }
  // Remove any query parameters or fragments
  sheetId = sheetId.split('?')[0].split('#')[0].trim();
  // Remove any whitespace or special characters that might cause issues
  sheetId = sheetId.replace(/[\s\n\r\t]/g, '');
  
  console.log('=== Google Sheets Configuration ===');
  console.log('Original spreadsheet ID from env:', originalSheetId);
  console.log('Cleaned spreadsheet ID:', sheetId);
  console.log('Spreadsheet ID length:', sheetId.length);
  console.log('Spreadsheet ID characters:', sheetId.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
  console.log('Service account email:', clientEmail);
  console.log('===================================');
  
  // Check for common ID issues (I vs l, O vs 0)
  const commonIssues = [];
  if (sheetId.includes('I') || sheetId.includes('l')) {
    commonIssues.push('ID contains I or l - check for case sensitivity issues');
  }
  if (sheetId.length !== 44) {
    commonIssues.push(`ID length is ${sheetId.length}, expected 44 characters`);
  }
  if (commonIssues.length > 0) {
    console.warn('⚠️ Potential spreadsheet ID issues:', commonIssues);
  }
  
  // Validate spreadsheet ID format (should be alphanumeric with dashes/underscores, typically 44 chars)
  if (!/^[a-zA-Z0-9-_]+$/.test(sheetId)) {
    throw new Error(`Invalid spreadsheet ID format: ${sheetId}`);
  }

  // Create a JWT for Google OAuth2 Service Account (scope: sheets)
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const base64url = (obj: any) =>
    Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = `${base64url(header)}.${base64url(payload)}`;
  const crypto = await import('node:crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(privateKey).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error('Token exchange failed:', tokenJson);
    throw new Error(`Token error: ${tokenJson.error || 'unknown'}`);
  }
  const accessToken = tokenJson.access_token as string;
  console.log('Access token obtained successfully (first 30 chars):', accessToken.substring(0, 30) + '...');
  
  // TEST: Try to access spreadsheet metadata FIRST to verify access
  const testMetadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title,sheets.properties`;
  console.log('Testing spreadsheet access with metadata request:', testMetadataUrl);
  const testMetaRes = await fetch(testMetadataUrl, {
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
  });
  const testMetaJson = await testMetaRes.json().catch(() => ({}));
  
  if (!testMetaRes.ok) {
    console.error('=== SPREADSHEET ACCESS TEST FAILED ===');
    console.error('Status:', testMetaRes.status, testMetaRes.statusText);
    console.error('Response:', JSON.stringify(testMetaJson, null, 2));
    console.error('Spreadsheet ID used:', sheetId);
    console.error('Spreadsheet ID length:', sheetId.length);
    console.error('Service account:', clientEmail);
    console.error('Access token obtained:', !!accessToken);
    console.error('');
    console.error('TROUBLESHOOTING STEPS:');
    console.error('1. Verify spreadsheet ID in Vercel env: GOOGLE_SHEETS_LEADS_SHEET_ID');
    console.error('2. Check for typos: I vs l (uppercase i vs lowercase L), O vs 0');
    console.error('3. Ensure service account has Editor access to the spreadsheet');
    console.error('4. Share spreadsheet with:', clientEmail);
    console.error('5. Verify spreadsheet exists and is not deleted');
    console.error('=====================================');
    throw new Error(`Cannot access spreadsheet ${sheetId} with service account ${clientEmail}. Error: ${testMetaJson.error?.message || 'Unknown error'}. Please verify the spreadsheet ID in Vercel environment variables and ensure the service account has Editor access.`);
  }
  
  console.log('✓ Spreadsheet access verified successfully');
  console.log('Spreadsheet title:', testMetaJson.properties?.title || 'N/A');
  console.log('Available sheets:', testMetaJson.sheets?.map((s: any) => s.properties?.title) || []);

  // Check if headers exist in row 1, add them if missing
  const headersRange = encodeURIComponent('Leads!A1:I1');
  const checkHeadersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${headersRange}`;
  const headersRes = await fetch(checkHeadersUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const headersJson = await headersRes.json().catch(() => ({}));
  
  const hasHeaders = headersJson.values && headersJson.values.length > 0 && headersJson.values[0].length > 0;
  console.log('Headers check:', { hasHeaders, existingHeaders: headersJson.values?.[0] || [] });
  
  if (!hasHeaders) {
    // Add headers to row 1
    console.log('Adding headers to row 1...');
    const headers = [['Timestamp', 'Plan', 'Name', 'Email', 'Company', 'Message', 'Status', 'Recruiter Email', 'Setup Date']];
    const writeHeadersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${headersRange}?valueInputOption=USER_ENTERED`;
    const writeHeadersRes = await fetch(writeHeadersUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ values: headers, majorDimension: 'ROWS' }),
    });
    
    if (writeHeadersRes.ok) {
      console.log('✓ Headers added successfully');
    } else {
      const writeHeadersJson = await writeHeadersRes.json().catch(() => ({}));
      console.warn('Failed to add headers:', writeHeadersJson);
    }
  }

  // Append row (will be added after headers in row 2+)
  const values = [[
    row.timestamp,
    row.plan,
    row.name,
    row.email,
    row.company,
    row.message || '',
    'New',           // Status
    '',              // Recruiter Email
    '',              // Setup Date
  ]];

  const range = encodeURIComponent('Leads!A:I');
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  console.log('Sheets append URL:', appendUrl);
  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ values, majorDimension: 'ROWS' }),
  });
  const appendJson = await appendRes.json().catch(() => ({}));
  if (appendRes.ok) {
    return { ok: true };
  }

  // Fallback: use batchUpdate appendCells by sheetId (avoids title/range issues)
  console.warn('values.append failed, trying batchUpdate appendCells...', appendRes.status, appendJson);
  const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
  console.log('Fetching metadata from:', metadataUrl);
  console.log('Using access token (first 20 chars):', accessToken.substring(0, 20) + '...');
  const metaRes = await fetch(metadataUrl, {
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
  });
  const metaJson = await metaRes.json().catch(() => ({}));
  if (!metaRes.ok) {
    console.error('Sheets metadata fetch failed:', {
      status: metaRes.status,
      statusText: metaRes.statusText,
      error: metaJson,
      spreadsheetId: sheetId,
      url: metadataUrl
    });
    throw new Error(`Sheets metadata error: ${metaJson.error?.message || 'unknown'} (Status: ${metaRes.status})`);
  }
  const sheets: Array<{ properties: { sheetId: number; title: string } }> = metaJson.sheets || [];
  const target = sheets.find(s => (s.properties?.title || '') === 'Leads') || sheets[0];
  if (!target) {
    throw new Error('No sheets found in spreadsheet');
  }
  const sheetNumericId = target.properties.sheetId;

  const toCell = (v: string) => (v === '' ? { userEnteredValue: { stringValue: '' } } :
    { userEnteredValue: { stringValue: String(v) } });
  const rowData = [{
    values: [
      toCell(row.timestamp),
      toCell(row.plan),
      toCell(row.name),
      toCell(row.email),
      toCell(row.company),
      toCell(row.message || ''),
      toCell('New'),
      toCell(''),
      toCell(''),
    ]
  }];

  const batchBody = {
    requests: [
      {
        appendCells: {
          sheetId: sheetNumericId,
          rows: rowData,
          fields: '*'
        }
      }
    ]
  };

  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(batchBody),
  });
  const batchJson = await batchRes.json().catch(() => ({}));
  if (!batchRes.ok) {
    console.error('Sheets batchUpdate appendCells failed:', batchRes.status, batchJson);
    throw new Error(`Sheets append error: ${batchJson.error?.message || 'unknown'}`);
  }

  return { ok: true, fallback: true };
}



import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { UploadData } from '@/types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    
    // Validate Supabase admin client is available
    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase service role key' }, 
        { status: 500 }
      );
    }

    // Get current user from NextAuth session
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`);

    let data: UploadData[] = [];
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      const fileContent = await file.text();
      const result = Papa.parse(fileContent, { 
        header: true, 
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_')
      });
      data = result.data as UploadData[];
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log('Processing XLSX file');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log(`Parsed ${jsonData.length} rows from XLSX`);
      
      // Transform headers to match expected format
      data = jsonData.map((row: any) => ({
        full_name: row['full_name'] || row['Full Name'] || row['FullName'],
        email: row['email'] || row['Email'],
        position: row['position'] || row['Position'],
        rating: parseInt(row['rating'] || row['Rating'] || '5'),
        notes: row['notes'] || row['Notes'] || '',
        rejection_reasons: row['rejection_reasons'] || row['Rejection Reasons'] || '',
        areas_for_improvement: row['areas_for_improvement'] || row['Areas for Improvement'] || ''
      })) as UploadData[];
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    // Validate required fields
    const requiredFields = ['full_name', 'email', 'position'];
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (const field of requiredFields) {
        if (!row[field as keyof UploadData]) {
          errors.push(`Row ${i + 1}: Missing required field '${field}'`);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation errors', details: errors }, { status: 400 });
    }

    // Insert candidates and feedback into database
    const results = [];
    
    for (const row of data) {
      try {
    // Insert candidate with user_id
    const { data: candidate, error: candidateError } = await supabaseAdmin!
          .from('candidates')
          .insert({
            full_name: row.full_name,
            email: row.email,
            position: row.position,
            user_id: user.id
          })
          .select()
          .single();

        if (candidateError) {
          results.push({ 
            candidate: row.full_name, 
            status: 'error', 
            error: candidateError.message 
          });
          continue;
        }

        // Insert interview feedback
        const { error: feedbackError } = await supabaseAdmin!
          .from('interview_feedback')
          .insert({
            candidate_id: candidate.id,
            interviewer_name: 'HR Team',
            rating: row.rating,
            notes: row.notes,
            rejection_reasons: row.rejection_reasons ? row.rejection_reasons.split(',').map(r => r.trim()) : [],
            areas_for_improvement: row.areas_for_improvement ? row.areas_for_improvement.split(',').map(a => a.trim()) : []
          });

        if (feedbackError) {
          results.push({ 
            candidate: row.full_name, 
            status: 'error', 
            error: feedbackError.message 
          });
          continue;
        }

        results.push({ 
          candidate: row.full_name, 
          status: 'success' 
        });
      } catch (error) {
        results.push({ 
          candidate: row.full_name, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      message: `Processed ${data.length} candidates`,
      success: successCount,
      errors: errorCount,
      results
    });

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../../config/api';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client for auth verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    console.log('Upload auth header received:', authHeader ? `Bearer ${authHeader.substring(7).substring(0, 20)}...` : 'None');
    
    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Prepare multipart form data for backend
    const backendFormData = new FormData();
    for (const file of files) {
      backendFormData.append('files', file);
    }
    
    // Prepare headers for backend request
    const backendHeaders: any = {};
    
    // Forward authentication to backend if available
    if (authHeader) {
      console.log('Forwarding auth header to backend');
      backendHeaders['Authorization'] = authHeader;
    }
    
    // Get upload endpoint URL
    const uploadUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.NGROK_URL}/upload`
      : 'http://localhost:8000/upload';
    
    console.log('Uploading files to backend:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: backendHeaders,
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      console.error('Backend upload error:', response.status, errorData);
      return NextResponse.json(
        { error: errorData.error || `File upload failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('File upload successful:', result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Upload API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    );
  }
}
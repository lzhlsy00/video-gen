import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../../../config/api';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for auth verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
        if (!error && authUser) {
          user = authUser;
        }
      } catch (error) {
        console.log('Auth verification failed:', error);
      }
    }

    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to view your videos.' },
        { status: 401 }
      );
    }

    // Get user identifier (email or user_id)
    const userName = user.email || user.id;

    // Call backend API to get user's videos
    const backendUrl = `${API_CONFIG.VIDEO_GENERATION_ENDPOINT.replace('/generate', '')}/videos/user/${encodeURIComponent(userName)}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch videos: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      videos: data.videos,
      count: data.count,
      user_name: userName
    });

  } catch (error) {
    console.error('My Videos API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
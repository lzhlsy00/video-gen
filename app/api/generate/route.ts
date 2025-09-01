import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../../../config/api';

interface GenerateVideoRequest {
  prompt: string;
  resolution?: string;
  include_audio?: boolean;
  voice?: string;
  language?: string;
  sync_method?: string;
}

interface VideoResponse {
  video_id: string;
  video_url: string;
  status: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client for auth verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    console.log('Auth header received:', authHeader ? `Bearer ${authHeader.substring(7).substring(0, 20)}...` : 'None');
    let user = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Token length:', token.length);
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
        console.log('Supabase auth result:', { user: !!authUser, error: error?.message });
        if (!error && authUser) {
          user = authUser;
        }
      } catch (error) {
        console.log('Auth verification failed:', error);
      }
    }

    // Make authentication optional for development
    console.log('User authenticated:', !!user);
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Authentication required. Please log in to create videos.' },
    //     { status: 401 }
    //   );
    // }

    const body: GenerateVideoRequest = await request.json();
    
    if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const payload = {
      prompt: body.prompt.trim(),
      resolution: body.resolution || API_CONFIG.DEFAULT_SETTINGS.resolution,
      include_audio: body.include_audio ?? API_CONFIG.DEFAULT_SETTINGS.include_audio,
      voice: body.voice || API_CONFIG.DEFAULT_SETTINGS.voice,
      language: body.language || API_CONFIG.DEFAULT_SETTINGS.language,
      sync_method: body.sync_method || API_CONFIG.DEFAULT_SETTINGS.sync_method
    };

    const url = API_CONFIG.VIDEO_GENERATION_ENDPOINT;
    console.log('url', url)
    
    // Prepare headers for backend request
    const backendHeaders: any = {
      'Content-Type': 'application/json',
    };
    
    // Forward authentication to backend if available
    if (authHeader) {
      console.log('Forwarding auth header to backend');
      backendHeaders['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: backendHeaders,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('External API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Video generation failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: VideoResponse = await response.json();
    
    // For the new flow, we return immediately with the video_id
    // The Manim backend will handle saving to the videos table
    // No need to save anything here as the backend already creates the record
    
    console.log('Video generation response:', data);
    console.log('Returning video_id:', data.video_id);

    const responseData = {
      video_id: data.video_id,
      video_url: data.video_url,
      status: data.status,
      message: data.message
    };
    
    console.log('Final response data:', responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { API_CONFIG } from '../../../config/api';

export async function GET() {
  try {
    // Call backend API to get all videos
    const backendUrl = `${API_CONFIG.VIDEO_GENERATION_ENDPOINT.replace('/generate', '')}/videos`;
    
    console.log('Explore Videos API - Backend URL:', backendUrl);
    console.log('Explore Videos API - API_CONFIG.VIDEO_GENERATION_ENDPOINT:', API_CONFIG.VIDEO_GENERATION_ENDPOINT);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(30000) // 30 seconds timeout
    });

    console.log('Explore Videos API - Response status:', response.status);
    console.log('Explore Videos API - Response ok:', response.ok);

    if (!response.ok) {
      const responseText = await response.text().catch(() => 'Could not read response');
      console.error('Backend API error:', response.status, response.statusText);
      console.error('Backend API response:', responseText);
      return NextResponse.json(
        { error: `Failed to fetch videos: ${response.statusText}`, details: responseText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter out videos without video_url and shuffle randomly
    const availableVideos = data.videos?.filter((video: any) => video.video_url) || [];
    
    // Shuffle array and take first 8 videos
    const shuffledVideos = availableVideos.sort(() => Math.random() - 0.5);
    const randomVideos = shuffledVideos.slice(0, 8);
    
    return NextResponse.json({
      videos: randomVideos,
      count: randomVideos.length
    });

  } catch (error) {
    console.error('Explore Videos API route error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
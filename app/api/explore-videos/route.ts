import { NextResponse } from 'next/server';
import { API_CONFIG } from '../../../config/api';

export async function GET() {
  try {
    // Call backend API to get all videos
    const backendUrl = `${API_CONFIG.VIDEO_GENERATION_ENDPOINT.replace('/generate', '')}/videos`;
    
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
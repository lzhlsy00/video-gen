import { NextResponse } from 'next/server';
import { API_CONFIG } from '../../../config/api';

export async function GET() {
  try {
    const backendUrl = `${API_CONFIG.VIDEO_GENERATION_ENDPOINT.replace('/generate', '')}/videos`;
    
    console.log('Health Check - Testing backend connection');
    console.log('Health Check - Backend URL:', backendUrl);
    console.log('Health Check - Environment:', process.env.NODE_ENV);
    console.log('Health Check - VIDEO_GENERATION_ENDPOINT:', API_CONFIG.VIDEO_GENERATION_ENDPOINT);
    
    const startTime = Date.now();
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000) // 15 seconds timeout for health check
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('Health Check - Response time:', responseTime, 'ms');
    console.log('Health Check - Response status:', response.status);
    console.log('Health Check - Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const responseText = await response.text().catch(() => 'Could not read response');
      console.error('Health Check - Backend error:', response.status, response.statusText);
      console.error('Health Check - Backend response:', responseText);
      
      return NextResponse.json({
        status: 'error',
        backend_url: backendUrl,
        response_status: response.status,
        response_text: responseText,
        response_time: responseTime,
        error: `Backend returned ${response.status}: ${response.statusText}`
      });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      status: 'ok',
      backend_url: backendUrl,
      response_status: response.status,
      response_time: responseTime,
      video_count: data.videos?.length || 0,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health Check - Error:', error);
    console.error('Health Check - Error type:', error?.constructor?.name);
    console.error('Health Check - Error message:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: error?.constructor?.name || 'Unknown',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
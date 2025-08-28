export const API_CONFIG = {
  // Video generation API endpoint
  VIDEO_GENERATION_ENDPOINT: process.env.VIDEO_GENERATION_ENDPOINT || 
    (process.env.NODE_ENV === 'production' 
      ? process.env.NGROK_URL + '/generate' 
      : 'http://localhost:8000/generate'),
  
  // Video status API endpoint
  VIDEO_STATUS_ENDPOINT: process.env.VIDEO_STATUS_ENDPOINT || 
    (process.env.NODE_ENV === 'production' 
      ? process.env.NGROK_URL + '/video' 
      : 'http://localhost:8000/video'),
    
  // Default video generation settings
  DEFAULT_SETTINGS: {
    resolution: 'm',
    include_audio: true,
    voice: 'nova',
    language: 'en',
    sync_method: 'timing_analysis'
  }
} as const;

export type APIConfig = typeof API_CONFIG; 
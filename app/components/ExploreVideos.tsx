'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Video {
  id: string;
  video_id: string;
  video_url: string | null;
  user_name: string | null;
  prompt: string | null;
}

export default function ExploreVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/explore-videos');
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        setVideos(data.videos || []);
      } catch (err) {
        console.error('Error fetching explore videos:', err);
        setError('Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDisplayTitle = (video: Video) => {
    if (video.prompt) {
      // Remove datetime stamps like [2025-08-28 18:31:26] from the title
      const cleanTitle = video.prompt.replace(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/g, '').trim();
      return cleanTitle.length > 60 ? `${cleanTitle.substring(0, 60)}...` : cleanTitle;
    }
    return `Video ${video.video_id.substring(0, 8)}...`;
  };

  const getAuthorName = (video: Video) => {
    if (video.user_name) {
      // Extract name part before @ if it's an email
      const name = video.user_name.includes('@') 
        ? video.user_name.split('@')[0] 
        : video.user_name;
      return name.length > 20 ? `${name.substring(0, 20)}...` : name;
    }
    return 'Anonymous';
  };

  if (loading) {
    return (
      <div className="py-24 bg-gradient-to-b from-[#FFF5F2] to-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-black">Explore Videos</h2>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm">
                <div className="aspect-video bg-gray-200 animate-pulse rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 bg-gradient-to-b from-[#FFF5F2] to-white">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-5xl font-bold text-black mb-8">Explore Videos</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 bg-gradient-to-b from-[#FFF5F2] to-white">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-black">Explore Videos</h2>
          {/* Search functionality temporarily disabled */}
          {/* <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search videos" className="w-[300px] px-4 py-2 pr-10 rounded-full bg-white border-2 border-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm text-black" />
              <i className="ri-search-line absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-gray-100 hover:border-gray-200 text-sm text-black">
                <span>Recent</span>
                <i className="ri-arrow-down-s-line"></i>
              </button>
            </div>
          </div> */}
        </div>
        
        <div className="grid grid-cols-4 gap-6">
          {videos.map((video, index) => (
            <Link 
              key={video.video_id} 
              href={`/watch/${video.video_id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
            >
              <div className="relative">
                {video.video_url ? (
                  <video 
                    className="w-full aspect-video object-cover rounded-t-xl"
                    preload="metadata"
                    muted
                    onLoadedMetadata={(e) => {
                      // Set video to middle frame for thumbnail
                      const videoEl = e.target as HTMLVideoElement;
                      if (videoEl.duration > 0) {
                        videoEl.currentTime = videoEl.duration / 2;
                      }
                    }}
                  >
                    <source src={video.video_url} type="video/mp4" />
                  </video>
                ) : (
                  <div className="w-full aspect-video bg-gray-200 rounded-t-xl flex items-center justify-center">
                    <i className="ri-video-line text-gray-400 text-3xl"></i>
                  </div>
                )}
                
                {/* Video duration overlay */}
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(Math.floor(Math.random() * 180) + 60)}
                </span>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium mb-2 line-clamp-2 text-black group-hover:text-primary transition-colors">
                  {getDisplayTitle(video)}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{Math.floor(Math.random() * 5000) + 100} views</span>
                  <span>{Math.floor(Math.random() * 30) + 1} days ago</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pacifico } from 'next/font/google';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Video } from '../../types/database';
import Link from 'next/link';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface MyVideosResponse {
  videos: Video[];
  count: number;
  user_name: string;
}

export default function MyVideos() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const isAuthenticating = useRef(false);
  const isFetchingVideos = useRef(false);

  // Authentication useEffect
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticating.current) return;
      isAuthenticating.current = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        
        // Only update user state if it actually changed
        setUser(prevUser => {
          if (prevUser?.id !== currentUser?.id) {
            return currentUser;
          }
          return prevUser;
        });
        
        if (!currentUser) {
          router.push('/login');
        }
      } finally {
        isAuthenticating.current = false;
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      
      // Only update if user actually changed to prevent unnecessary re-renders
      setUser(prevUser => {
        if (prevUser?.id !== currentUser?.id) {
          if (!currentUser) {
            router.push('/login');
          }
          return currentUser;
        }
        return prevUser;
      });
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Memoized fetch function to prevent unnecessary recreations
  const fetchMyVideos = useCallback(async () => {
    if (!user || isFetchingVideos.current || videosLoaded) return;
    
    isFetchingVideos.current = true;
    setLoading(true);
    setError(null);

    try {
      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/my-videos', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }

      const data: MyVideosResponse = await response.json();
      setVideos(data.videos);
      setVideosLoaded(true);
    } catch (err) {
      console.error('Fetch videos error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
      isFetchingVideos.current = false;
    }
  }, [user, videosLoaded]);

  // Fetch user videos only when user changes and videos not loaded
  useEffect(() => {
    if (user && !videosLoaded && !isFetchingVideos.current) {
      fetchMyVideos();
    }
  }, [user, fetchMyVideos, videosLoaded]);



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto bg-white overflow-hidden min-h-[85vh] w-[90%]">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6">
          <Link href="/" className={`text-2xl text-black ${pacifico.className}`}>ArisVideo</Link>
          <div className="flex items-center space-x-12">
            <Link href="/my-videos" className="text-primary font-medium border-b-2 border-primary">My Videos</Link>
            {/* <a href="#" className="text-gray-800 hover:text-primary transition-colors">Invite&Earn</a> */}
            {/* <a href="#" className="text-gray-800 hover:text-primary transition-colors">Love Letter💗</a> */}
          </div>
          <div className="flex items-center">
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.email}</span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <div className="px-8 pt-8 pb-24">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-black">My Videos</h1>
            <p className="text-xl text-gray-600">Your AI-generated educational videos</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your videos...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-100 rounded-3xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-error-warning-line text-red-600 text-lg"></i>
                </div>
                <div>
                  <h4 className="text-red-800 font-bold text-lg mb-1">Error Loading Videos</h4>
                  <p className="text-red-700 font-medium">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    <i className="ri-refresh-line"></i>
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Videos Grid */}
          {!loading && !error && (
            <>
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video) => (
                    <div key={video.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group hover:scale-105">
                      {/* Video Thumbnail/Preview */}
                      <div 
                        className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center cursor-pointer"
                        onClick={() => {
                          if (video.video_url) {
                            router.push(`/watch/${video.video_id}`);
                          }
                        }}
                      >
                        {video.video_url ? (
                          <video 
                            className="w-full h-full object-cover"
                            preload="metadata"
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
                          <div className="flex flex-col items-center justify-center p-6">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p className="text-sm text-gray-600">Processing...</p>
                          </div>
                        )}
                        
                        {/* Play Overlay */}
                        {video.video_url && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
                              {/* SVG Play Icon */}
                              <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                className="ml-0.5"
                              >
                                <path 
                                  d="M8 5v14l11-7z" 
                                  fill="#374151" 
                                  stroke="#374151" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="p-4">
                        {/* Video title from prompt */}
                        <h3 className="font-medium text-black mb-2 line-clamp-2 leading-relaxed" title={video.prompt || video.video_id}>
                          {video.prompt ? 
                            (video.prompt.length > 60 ? 
                              `${video.prompt.substring(0, 60)}...` : 
                              video.prompt
                            ) : 
                            `Video ${video.video_id.substring(0, 8)}...`
                          }
                        </h3>
                        
                        {/* Video Status - Temporarily hidden */}
                        {/* <div className="flex items-center justify-end text-sm mb-3">
                          {video.video_url && (
                            <div className="flex items-center gap-1 text-green-600">
                              <i className="ri-check-line"></i>
                              <span>Ready</span>
                            </div>
                          )}
                        </div> */}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {video.video_url ? (
                            <>
                              <button
                                onClick={() => router.push(`/watch/${video.video_id}`)}
                                className="w-full px-3 py-2 bg-gradient-to-r from-primary to-secondary text-white text-sm rounded-lg hover:from-primary/90 hover:to-secondary/90 transition-all"
                              >
                                <i className="ri-play-line mr-1"></i>
                                Watch
                              </button>
                              {/* Download button - Temporarily hidden */}
                              {/* <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = video.video_url!;
                                  link.download = `video-${video.video_id}.mp4`;
                                  link.click();
                                }}
                                className="px-3 py-2 bg-white border border-primary text-primary text-sm rounded-lg hover:bg-primary hover:text-white transition-all"
                              >
                                <i className="ri-download-line"></i>
                              </button> */}
                            </>
                          ) : (
                            <Link
                              href={`/video/${video.video_id}`}
                              className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-all text-center"
                            >
                              <i className="ri-eye-line mr-1"></i>
                              View Status
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="ri-video-line text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">No Videos Yet</h3>
                  <p className="text-xl text-gray-600 mb-8">Create your first AI-generated educational video</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold hover:from-primary/90 hover:to-secondary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <i className="ri-add-line text-xl"></i>
                    Create Your First Video
                  </Link>
                </div>
              )}

              {/* Back to Home Button */}
              {videos.length > 0 && (
                <div className="text-center mt-12">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 text-primary hover:text-white bg-white hover:bg-primary border-2 border-primary rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <i className="ri-arrow-left-line"></i>
                    Back to Home
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
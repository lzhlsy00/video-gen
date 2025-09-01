'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pacifico } from 'next/font/google';
import { supabase } from '../lib/supabase';
import ExploreVideos from './components/ExploreVideos';
// import Auth from '../components/Auth';
import type { User } from '@supabase/supabase-js';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface VideoResponse {
  video_id: string;
  video_url: string;
  status: string;
  message: string;
}

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState('');

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const scrollAnimationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardAnimationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const messageAnimationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsVisible(true);

    // Intersection Observer for scroll animations
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', '-translate-y-4');
          entry.target.classList.add('opacity-100', 'translate-y-0');
        }
      });
    }, { threshold: 0.2 });

    // Intersection Observer for card animations
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          entry.target.classList.add('opacity-100', 'translate-y-0');
        }
      });
    }, { threshold: 0.2, rootMargin: '50px' });

    // Intersection Observer for message animation
    const messageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.animation = 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
          messageObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    // Apply observers to elements
    scrollAnimationRefs.current.forEach(el => {
      if (el) scrollObserver.observe(el);
    });

    cardAnimationRefs.current.forEach(el => {
      if (el) cardObserver.observe(el);
    });

    if (messageAnimationRef.current) {
      messageObserver.observe(messageAnimationRef.current);
    }

    // Cleanup observers on unmount
    return () => {
      scrollObserver.disconnect();
      cardObserver.disconnect();
      messageObserver.disconnect();
    };
  }, []);

  // Authentication useEffect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const generateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Check if user is logged in
    if (!user) {
      setError('Please log in to create videos. Click the "Log In" button to get started.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setVideoUrl(null);

    try {
      console.log('Starting video generation...');
      
      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if user is logged in
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: prompt.trim(),
          include_audio: true,
          voice: 'nova',
          sync_method: 'timing_analysis'
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to generate video: ${response.statusText}`);
      }

      const data: VideoResponse = await response.json();
      console.log('API Response:', data);
      
      // Immediately navigate to progress page with video ID
      if (data.video_id) {
        console.log('Navigating to:', `/video/${data.video_id}`);
        router.push(`/video/${data.video_id}`);
      } else {
        console.error('No video_id in response:', data);
        throw new Error(data.message || 'Failed to generate video');
      }
    } catch (err) {
      console.error('Generate video error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
    const linkInput = document.getElementById('referral-link') as HTMLInputElement;
    if (linkInput) {
      linkInput.select();
      document.execCommand('copy');
      const button = linkInput.nextElementSibling as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    }
  };

  return (
    <>
      <Head>
        <title>ArisVideo - Explain Everything Visually</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css" />
      </Head>

      <div className="min-h-screen bg-white">
        <style jsx global>{`
          .typing-container {
            color: transparent;
            animation: showColor 0.1s linear 1s forwards;
          }
          @keyframes showColor {
            to {
              color: inherit;
            }
          }
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
          }
          @keyframes wobble {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(5deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(-5deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes typing {
            from { width: 0; }
            to { width: 9.2ch; }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
          .wobble-animation {
            animation: wobble 3s ease-in-out infinite;
          }
          .typing-animation {
            display: inline-block;
            overflow: hidden;
            white-space: nowrap;
            animation: typing 2s steps(40, end) 1s forwards;
            width: 0;
          }
          .cursor-animation::after {
            content: '|';
            animation: blink 1s step-end infinite;
          }
          .fade-in {
            opacity: 0;
            animation: fadeIn 2s ease-in-out 4.5s forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            70% {
              opacity: 1;
              transform: scale(1.1);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          .slide-in-animation {
            opacity: 0;
            animation: slideIn 0.5s ease-out 1.5s forwards;
          }
          .scale-in {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
            animation: scaleIn 1s ease-out forwards;
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .character {
            width: 280px;
            height: 280px;
            background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 100%);
            border-radius: 60% 40% 50% 45%;
            position: relative;
            margin: 0 auto;
            transform: rotate(15deg);
            box-shadow:
              inset -20px -20px 60px rgba(0,0,0,0.1),
              20px 20px 40px rgba(255,154,139,0.2);
            animation: morphShape 6s ease-in-out infinite;
          }
          @keyframes morphShape {
            0% { border-radius: 60% 40% 50% 45%; }
            50% { border-radius: 45% 55% 45% 55%; }
            100% { border-radius: 60% 40% 50% 45%; }
          }
          .character::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4));
            border-radius: inherit;
            animation: shimmer 3s ease-in-out infinite;
          }
          @keyframes shimmer {
            0% { opacity: 0.5; }
            50% { opacity: 0.8; }
            100% { opacity: 0.5; }
          }
          .character::after {
            content: '';
            position: absolute;
            width: 35px;
            height: 35px;
            background-color: rgba(255,255,255,0.9);
            border-radius: 50%;
            top: 25%;
            left: 25%;
            box-shadow: 100px 100px 0 rgba(255,255,255,0.9);
            transform: rotate(-15deg);
          }
          .eye {
            position: absolute;
            width: 14px;
            height: 28px;
            background-color: #2D3748;
            border-radius: 50%;
            top: 38%;
            transform: rotate(-15deg);
            animation: blink 4s ease-in-out infinite;
          }
          @keyframes blink {
            0%, 90%, 100% { transform: scaleY(1) rotate(-15deg); }
            95% { transform: scaleY(0.1) rotate(-15deg); }
          }
          .eye-left {
            left: 32%;
          }
          .eye-right {
            right: 32%;
          }
          .mouth {
            position: absolute;
            width: 45px;
            height: 45px;
            border: 7px solid #2D3748;
            border-radius: 50%;
            bottom: 28%;
            left: 50%;
            transform: translateX(-50%) rotate(-15deg);
            border-top-color: transparent;
            border-right-color: transparent;
            animation: smile 3s ease-in-out infinite;
          }
          @keyframes smile {
            0%, 100% { transform: translateX(-50%) rotate(-15deg) scale(1); }
            50% { transform: translateX(-50%) rotate(-15deg) scale(1.1); }
          }
          .speech-bubble {
            position: absolute;
            background-color: #d9e3ff;
            padding: 20px 30px;
            border-radius: 20px 20px 20px 4px;
            font-weight: bold;
            font-size: 1.5rem;
            color: #000000;
            top: -60px;
            left: -100px;
          }
          .rounded-button {
            border-radius: 8px;
          }
        `}</style>

        <div className="max-w-7xl mx-auto bg-white overflow-hidden min-h-[85vh] w-[90%]">
          {/* Navigation */}
          <nav className="flex items-center justify-between px-8 py-6">
            <a href="#" className={`text-2xl text-black ${pacifico.className}`}>ArisVideo</a>
            <div className="flex items-center space-x-12">
              <Link href="/my-videos" className="text-gray-800 hover:text-primary transition-colors font-bold">My Videos</Link>
              {/* <a href="#" className="text-gray-800 hover:text-primary transition-colors">Invite&Earn</a> */}
              {/* <a href="#" className="text-gray-800 hover:text-primary transition-colors">Love Letter💗</a> */}
            </div>
            <div className="flex items-center">
              {/* Auth component */}
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Welcome, {user.email}</span>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <button className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full hover:from-primary/90 hover:to-secondary/90 transition-all">
                      Log In
                    </button>
                  </Link>
                  <Link href="/login?mode=signup">
                    <button className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full hover:from-primary/90 hover:to-secondary/90 transition-all">
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Hero Section */}
          <div className="px-8 pt-16 pb-24 flex flex-col items-center justify-center scale-in">
            {/* Character */}
            <div className="relative mb-12 float-animation">
              <div className="character" style={{ transform: 'scale(0.6)' }}>
                <div className="eye eye-left"></div>
                <div className="eye eye-right"></div>
                <div className="blush blush-left"></div>
                <div className="blush blush-right"></div>
                <div className="mouth"></div>
              </div>
              <div className="speech-bubble wobble-animation text-black" style={{ opacity: 0, transform: 'scale(0.5)', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.5s forwards', left: '-165px', top: '95px', borderRadius: '20px 20px 20px 4px', fontSize: '1rem', padding: '12px 18px' }}>2H₂+O₂→ 2H₂O</div>
              <div className="speech-bubble wobble-animation text-black" style={{ opacity: 0, transform: 'scale(0.5)', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 2.5s forwards', left: '180px', top: '-35px', fontSize: '1.1rem', padding: '14px 20px', backgroundColor: '#FFE5D9', borderRadius: '20px 20px 4px 20px' }}>'Abnormal behavior'?</div>
              <div className="speech-bubble wobble-animation text-black" style={{ opacity: 0, transform: 'scale(0.5)', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 3.5s forwards', left: '-130px', top: '-35px', backgroundColor: '#FFE0E9', fontSize: '1.1rem', padding: '14px 20px', borderRadius: '20px 20px 20px 4px' }}>Beloved</div>
              <div className="speech-bubble wobble-animation text-black" style={{ opacity: 0, transform: 'scale(0.5)', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 4.5s forwards', left: '235px', top: '110px', backgroundColor: '#E0F2FF', fontSize: '1rem', padding: '12px 18px', borderRadius: '20px 20px 4px 20px' }}>a²+b²=c²</div>
              <div className="speech-bubble wobble-animation text-black" style={{ opacity: 0, transform: 'scale(0.5)', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 5.5s forwards', left: '85px', top: '-50px', backgroundColor: '#E8FFE0', fontSize: '1rem', padding: '12px 18px', borderRadius: '20px 20px 20px 4px' }}>F=ma</div>
            </div>
            
            {/* Main Content */}
            <div className="w-full max-w-4xl mx-auto text-center -mt-16">
              <h1 className="text-5xl font-bold mb-4">
                <span className="text-black">ArisVideo</span>
                <span className="text-primary"> - Explain Everything Visually</span>
              </h1>
              <p className="text-xl text-gray-600 mb-6">Generate clear, concise video explanations for any educational content in minutes</p>
              
              {/* Search Bar */}
              <div className="relative w-full max-w-4xl mx-auto mb-16">
                <form onSubmit={generateVideo} className="relative flex flex-col items-center gap-6 transition-all duration-500">
                  <div className="relative w-full group">
                    <textarea 
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder="Enter your question (e.g. How do I solve quadratic equations)" 
                      className="w-full min-h-[160px] p-8 text-xl text-black bg-white rounded-3xl shadow-lg border-2 border-primary hover:border-primary/80 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none resize-none transition-all duration-300 disabled:bg-gray-50 disabled:border-gray-300 disabled:cursor-not-allowed placeholder:text-gray-400"

                    ></textarea>
                    
                    {/* Character count and validation */}
                    <div className="absolute bottom-2 left-4 text-sm text-gray-500">
                      <span className={prompt.length > 500 ? 'text-red-500' : 'text-gray-500'}>
                        {prompt.length}/500 characters
                      </span>
                    </div>
                    
                    {/* Focus highlight effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    {/* Image upload and voice input buttons - Temporarily hidden */}
                    {/* <div className="absolute bottom-6 right-6 flex items-center gap-3">
                      <button 
                        type="button" 
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white hover:bg-primary/10 border border-gray-200 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 group"
                        title="Upload image"
                      >
                        <i className="ri-image-line text-xl text-gray-600 group-hover:text-primary transition-colors"></i>
                      </button>
                      <button 
                        type="button" 
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white hover:bg-secondary/10 border border-gray-200 hover:border-secondary/30 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 group"
                        title="Voice input"
                      >
                        <i className="ri-mic-line text-xl text-gray-600 group-hover:text-secondary transition-colors"></i>
                      </button>
                    </div> */}
                  </div>
                  <button 
                    type="submit" 
                    disabled={!prompt.trim() || isSubmitting || !user}
                    className={`px-12 py-4 rounded-full font-bold transition-all whitespace-nowrap text-lg relative overflow-hidden ${
                      isSubmitting
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg cursor-not-allowed transform scale-95'
                        : user
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                        : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed shadow-lg'
                    } ${
                      (!prompt.trim() || isSubmitting || !user)
                        ? 'cursor-not-allowed transform-none'
                        : 'hover:from-primary/90 hover:to-secondary/90'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creating Video...</span>
                        </>
                      ) : !user ? (
                        <>
                          <i className="ri-lock-line text-xl"></i>
                          <span>Log In to Create Video</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-video-add-line text-xl"></i>
                          <span>Create Video Now</span>
                          <i className="ri-arrow-right-line text-lg"></i>
                        </>
                      )}
                    </div>
                  </button>
                </form>



                {/* Error Display */}
                {error && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-100 rounded-3xl shadow-lg animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-error-warning-line text-red-600 text-lg"></i>
                      </div>
                      <div>
                        <h4 className="text-red-800 font-bold text-lg mb-1">Oops! Something went wrong</h4>
                        <p className="text-red-700 font-medium">{error}</p>
                        <button 
                          onClick={() => setError(null)}
                          className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          <i className="ri-close-line"></i>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success & Video Display */}
                {videoUrl && (
                  <div className="mt-12 w-full max-w-5xl mx-auto animate-in slide-in-from-bottom-8 fade-in duration-700">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <i className="ri-check-line text-white text-3xl"></i>
                      </div>
                      <h3 className="text-3xl font-bold text-black mb-2">
                        🎉 Your Video is Ready!
                      </h3>
                      <p className="text-lg text-gray-600">
                        Here's your AI-generated educational video
                      </p>
                    </div>

                    {/* Video Container */}
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden border border-primary/10">
                      <div className="p-8">
                        {/* Video Player */}
                        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-black">
                          <video 
                            controls 
                            className="w-full h-auto"
                            style={{ maxHeight: '500px' }}
                            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFyaXNWaWRlbzwvdGV4dD4KPC9zdmc+"
                          >
                            <source src={videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                              <i className="ri-play-fill text-2xl text-gray-800 ml-1"></i>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                          <a 
                            href={videoUrl} 
                            download 
                            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:from-primary/90 hover:to-secondary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                          >
                            <i className="ri-download-cloud-line text-lg"></i>
                            Download Video
                          </a>
                          <button 
                            onClick={(event) => {
                              navigator.clipboard.writeText(videoUrl);
                              // Add visual feedback
                              const btn = event.currentTarget;
                              const originalContent = btn.innerHTML;
                              btn.innerHTML = '<i class="ri-check-line text-lg"></i>Copied!';
                              setTimeout(() => {
                                btn.innerHTML = originalContent;
                              }, 2000);
                            }}
                            className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-primary text-primary rounded-2xl hover:bg-primary hover:text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                          >
                            <i className="ri-link text-lg"></i>
                            Copy Link
                          </button>
                          <button 
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: 'Check out my AI-generated video!',
                                  text: 'I created this educational video with ArisVideo',
                                  url: videoUrl
                                });
                              }
                            }}
                            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                          >
                            <i className="ri-share-line text-lg"></i>
                            Share
                          </button>
                        </div>

                        {/* Video Info */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-primary/10">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <i className="ri-time-line"></i>
                              <span>Generated just now</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="ri-file-line"></i>
                              <span>MP4 Format</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="ri-hd-line"></i>
                              <span>HD Quality</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Generate Another Button */}
                    <div className="text-center mt-8">
                      <button
                        onClick={() => {
                          setVideoUrl(null);
                          setPrompt('');
                          setError(null);
                        }}
                        className="px-8 py-3 text-primary hover:text-white bg-white hover:bg-primary border-2 border-primary rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <i className="ri-add-line mr-2"></i>
                        Generate Another Video
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Topic Tags */}
              <div className="mb-16">
                <h3 className="text-2xl font-bold mb-8 mt-4 text-center text-black">Suggested Topics</h3>
                <div className="flex justify-center items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <i className="ri-flask-line text-xl text-gray-600"></i>
                    <span className="text-gray-700 font-medium">STEM subjects</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <i className="ri-pencil-ruler-2-line text-xl text-gray-600"></i>
                    <span className="text-gray-700 font-medium">Digital SAT</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <i className="ri-draft-line text-xl text-gray-600"></i>
                    <span className="text-gray-700 font-medium">ACT</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <i className="ri-book-open-line text-xl text-gray-600"></i>
                    <span className="text-gray-700 font-medium">AP exams</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <i className="ri-graduation-cap-line text-xl text-gray-600"></i>
                    <span className="text-gray-700 font-medium">A-Level</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <i className="ri-video-line text-xl text-gray-600"></i>
                    <span className="text-gray-700 font-medium">Educational Videos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Introduction Section - Temporarily hidden */}
          {/* <div className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-8">
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold mb-6 text-black">Explain Visually, Understand Deeply — With Your Best Explainer Agent</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">Clear, animated explanations tailored to how you learn — fast, visual, and unforgettable.</p>
              </div>
              <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                <iframe width="100%" height="600" src="https://www.youtube.com/embed/your-video-id" title="Introducing VideoTutor" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full"></iframe>
              </div>
            </div>
          </div> */}

          {/* Features Section - Temporarily hidden */}
          {/* <div className="py-24 bg-gradient-to-b from-white to-[#FFF5F2]">
            <div className="max-w-7xl mx-auto px-8">
              <h2 className="text-5xl font-bold text-center mb-20 scale-in text-black">Whether You Teach, Learn, or Create — We've Got You Covered.</h2>
              <div className="grid grid-cols-3 gap-12">
                <div ref={el => { cardAnimationRefs.current[0] = el; }} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow opacity-0 translate-y-8 transition-all duration-700">
                  <div className="w-16 h-16 bg-[#FFE5D9] rounded-xl flex items-center justify-center mb-6">
                    <i className="ri-group-line text-primary text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-black">For Teachers</h3>
                  <p className="text-gray-600">Generate clean, animated explainers – perfect for flipped classrooms, revision aids, and homework follow-ups.</p>
                </div>
                <div ref={el => { cardAnimationRefs.current[1] = el; }} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow opacity-0 translate-y-8 transition-all duration-700" style={{ transitionDelay: '200ms' }}>
                  <div className="w-16 h-16 bg-[#FFE5D9] rounded-xl flex items-center justify-center mb-6">
                    <i className="ri-calendar-line text-primary text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-black">For Students and Parents</h3>
                  <p className="text-gray-600">Whether you're stuck on a math problem or revising for an exam, get a clear, step-by-step video explanation instantly — just like a teacher would walk you through it.</p>
                </div>
                <div ref={el => { cardAnimationRefs.current[2] = el; }} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow opacity-0 translate-y-8 transition-all duration-700" style={{ transitionDelay: '400ms' }}>
                  <div className="w-16 h-16 bg-[#FFE5D9] rounded-xl flex items-center justify-center mb-6">
                    <i className="ri-device-line text-primary text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-black">For Creators</h3>
                  <p className="text-gray-600">Turn your knowledge into engaging viral explainer video. Instantly generate videos without editing, scripting, or animation skills.</p>
                </div>
              </div>
            </div>
          </div> */}

          {/* How It Works Section */}
          <div className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-8">
              <h2 className="text-5xl font-bold text-center mb-20 scale-in text-black">How It Works</h2>
              <div className="flex justify-between items-center">
                <div className="w-1/2 pr-12">
                  <div className="space-y-12">
                    <div ref={el => { scrollAnimationRefs.current[0] = el; }} className="flex items-start opacity-0 transform -translate-y-4 transition-all duration-700">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mr-6 flex-shrink-0">1</div>
                      <div>
                        <h3 className="text-2xl font-bold mb-3 text-black">Ask Anything</h3>
                        <p className="text-gray-600">Type or upload a question — math, science, or more.
                        Our AI understands what you're asking instantly.</p>
                      </div>
                    </div>
                    <div ref={el => { scrollAnimationRefs.current[1] = el; }} className="flex items-start opacity-0 transform -translate-y-4 transition-all duration-700" style={{ transitionDelay: '200ms' }}>
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mr-6 flex-shrink-0">2</div>
                      <div>
                        <h3 className="text-2xl font-bold mb-3 text-black">Wait a minute, then get a Smart Video Explanation</h3>
                        <p className="text-gray-600">We turn your question into a visual story, powered by AI and animation — no more dry text.</p>
                      </div>
                    </div>
                    <div ref={el => { scrollAnimationRefs.current[2] = el; }} className="flex items-start opacity-0 transform -translate-y-4 transition-all duration-700" style={{ transitionDelay: '400ms' }}>
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mr-6 flex-shrink-0">3</div>
                      <div>
                        <h3 className="text-2xl font-bold mb-3 text-black">Learn & Share in Seconds</h3>
                        <p className="text-gray-600">Watch. Understand. Share.
                        Clear, bite-sized videos made for curious minds and busy days.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-1/2 scale-in relative" style={{ animationDelay: '0.4s' }}>
                  <div className="character float-animation" style={{ transform: 'scale(1.2) translateX(80px)' }}>
                    <div className="eye eye-left"></div>
                    <div className="eye eye-right"></div>
                    <div className="blush blush-left"></div>
                    <div className="blush blush-right"></div>
                    <div className="mouth"></div>
                  </div>
                  <div ref={messageAnimationRef} className="speech-bubble wobble-animation text-black" style={{ opacity: 0, transform: 'scale(0.5) rotate(15deg)', left: '120px', top: '20px', borderRadius: '20px 20px 4px 20px', fontSize: '1.2rem', padding: '15px 20px' }}>Make it Visual!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Explore Videos Section */}
          <ExploreVideos />

          {/* CTA Section - Temporarily hidden */}
          {/* <div className="py-16 bg-gradient-to-b from-white to-[#FFF5F2]">
            <div className="max-w-7xl mx-auto px-8">
              <div id="refer-earn" className="bg-white rounded-3xl shadow-lg p-12 relative overflow-hidden mx-auto max-w-5xl scale-in">
                <div className="flex flex-col items-center text-center mb-12">
                  <span className="text-4xl mb-4">🎁</span>
                  <h2 className="text-4xl font-bold mb-4 text-black">Get Free Videos by Sharing with Friends</h2>
                  <p className="text-lg text-gray-600 max-w-2xl">Give friends a free video by inviting them to join. Earn up to 5 videos for yourself in the process.</p>
                </div>
                <div className="grid grid-cols-3 gap-8 mb-12">
                  <div className="bg-[#FFF5F2] rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-user-add-line text-xl text-primary"></i>
                    </div>
                    <h3 className="font-bold mb-2 text-black">1 Friend</h3>
                    <p className="text-gray-600">Get 1 Free Video Explanation</p>
                  </div>
                  <div className="bg-[#FFF5F2] rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-user-add-fill text-xl text-primary"></i>
                    </div>
                    <h3 className="font-bold mb-2 text-black">2 Friends</h3>
                    <p className="text-gray-600">Get 2 Free Video Explanations</p>
                  </div>
                  <div className="bg-[#FFF5F2] rounded-2xl p-8 text-center relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                      Bonus!
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-group-line text-xl text-primary"></i>
                    </div>
                    <h3 className="font-bold mb-2 text-black">3 Friends</h3>
                    <p className="text-gray-600">Get 5 Free Videos</p>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-md mb-6">
                    <input type="text" value="https://videotutor.com/ref/your-unique-code" readOnly className="w-full px-4 py-3 pr-24 text-sm text-black bg-gray-50 rounded-lg border-none" id="referral-link" />
                    <button onClick={copyLink} className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-white text-sm rounded-full hover:bg-opacity-90 transition-colors rounded-button">Copy</button>
                  </div>
                  <div className="flex gap-4"></div>
                </div>
                <div className="flex items-center gap-3 text-primary">
                  <i className="ri-check-line text-xl"></i>
                  <span>1. Share your unique invite link with friends, classmates, or fellow learners.</span>
                </div>
                <div className="flex items-center gap-3 text-primary mt-3">
                  <i className="ri-check-line text-xl"></i>
                  <span>2. When your invitee signs up and logs in, the count updates instantly.</span>
                </div>
                <div className="flex items-center gap-3 text-primary mt-3">
                  <i className="ri-check-line text-xl"></i>
                  <span>3. Enjoy free video explanations!</span>
                </div>
              </div>
            </div>
          </div> */}

          {/* Footer */}
          <footer className="bg-[#FFF5F2] pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-8">
              <div className="grid grid-cols-4 gap-12 mb-16">
                <div>
                  <a href="#" className={`text-3xl text-black mb-6 block ${pacifico.className}`}>ArisVideo</a>
                  <p className="text-gray-600 mb-6">Creating engaging educational videos for effective visual learning.</p>
                  <div className="flex space-x-4">
                    <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-primary transition-colors text-lg">
                      <span className="ri-facebook-fill" style={{ fontFamily: 'remixicon' }}>f</span>
                    </a>
                    <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-primary transition-colors text-lg">
                      <span className="ri-twitter-fill" style={{ fontFamily: 'remixicon' }}>t</span>
                    </a>
                    <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-primary transition-colors text-lg">
                      <span className="ri-instagram-fill" style={{ fontFamily: 'remixicon' }}>i</span>
                    </a>
                    <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-primary transition-colors text-lg">
                      <span className="ri-linkedin-fill" style={{ fontFamily: 'remixicon' }}>l</span>
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-6 text-black">Company</h4>
                  <ul className="space-y-4">
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">About Us</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Careers</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Press</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Blog</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-6 text-black">Resources</h4>
                  <ul className="space-y-4">
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Language Courses</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Teaching Guide</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Mobile App</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Community</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-6 text-black">Support</h4>
                  <ul className="space-y-4">
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Help Center</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Contact Us</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">© 2025 ArisVideo. All rights reserved.</p>
                  <div className="flex items-center">
                    <i className="ri-phone-fill text-primary text-xl mr-2"></i>
                    <span className="text-gray-600 text-lg">+1 (888) 123-4567</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
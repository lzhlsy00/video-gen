'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Pacifico } from 'next/font/google';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface VideoData {
  video_id: string;
  video_url: string;
  created_at?: string;
}

export default function VideoCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Get the video ID from params
    params.then((p) => setVideoId(p.id));
  }, [params]);

  useEffect(() => {
    if (!videoId) return;
    fetchVideoData();
  }, [videoId]);

  const fetchVideoData = async () => {
    if (!videoId) return;
    
    try {
      // Create Supabase client for accessing videos table
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      console.log('Searching for video_id:', videoId);
      
      // Query videos table for the video record
      const { data: videoData, error: videoError } = await supabaseAdmin
        .from('videos')
        .select('video_id, video_url')
        .eq('video_id', videoId)
        .single();

      console.log('Videos table query result:', { videoData, videoError });

      if (videoError) {
        if (videoError.code === 'PGRST116') {
          // No rows found
          throw new Error(`找不到视频ID为 ${videoId} 的记录。请检查链接是否正确，或者视频可能已被删除。`);
        } else {
          // Other database error
          throw new Error(`数据库查询错误: ${videoError.message}`);
        }
      }

      if (videoData) {
        if (videoData.video_url) {
          // Video is ready
          setVideoData(videoData);
          return;
        } else {
          // Video record exists but no URL yet - still generating
          router.push(`/video/${videoId}`);
          return;
        }
      }

      // Shouldn't reach here, but just in case
      throw new Error('未知错误：无法获取视频数据');

    } catch (err) {
      console.error('Error fetching video:', err);
      setError(err instanceof Error ? err.message : '获取视频失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoData?.video_url) return;
    
    try {
      const response = await fetch(videoData.video_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${videoId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCopyLink = () => {
    if (!videoData?.video_url) return;
    
    navigator.clipboard.writeText(videoData.video_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!videoData?.video_url || !navigator.share) return;
    
    navigator.share({
      title: '我的AI生成视频',
      text: '看看AI为我生成的教育视频！',
      url: videoData.video_url
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-red-600 text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-6">{error || '无法加载视频'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className={`text-2xl text-black ${pacifico.className}`}>ArisVideo</a>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <i className="ri-arrow-left-line"></i>
              返回首页
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <i className="ri-check-line text-white text-4xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎉 视频生成成功！
          </h1>
          <p className="text-xl text-gray-600">
            您的AI教育视频已经准备就绪
          </p>
        </div>

        {/* Video Player Section */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="p-8">
            {/* Video Player */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-black mb-8">
              <video 
                controls 
                autoPlay
                className="w-full h-auto"
                style={{ maxHeight: '600px' }}
              >
                <source src={videoData.video_url} type="video/mp4" />
                您的浏览器不支持视频播放。
              </video>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all font-bold"
              >
                <i className="ri-download-cloud-line text-xl"></i>
                下载视频
              </button>
              
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all font-bold"
              >
                <i className={copied ? "ri-check-line text-xl" : "ri-link text-xl"}></i>
                {copied ? '已复制!' : '复制链接'}
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all font-bold"
              >
                <i className="ri-share-line text-xl"></i>
                分享视频
              </button>
            </div>

            {/* Video Info */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="ri-information-line text-blue-600"></i>
                视频信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <i className="ri-file-video-line text-gray-500"></i>
                  <span className="text-gray-600">格式: MP4</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="ri-hd-line text-gray-500"></i>
                  <span className="text-gray-600">质量: 高清</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="ri-time-line text-gray-500"></i>
                  <span className="text-gray-600">
                    生成时间: {videoData.created_at ? new Date(videoData.created_at).toLocaleString('zh-CN') : '未知'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="ri-key-line text-gray-500"></i>
                  <span className="text-gray-600">ID: {videoId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">想要生成更多视频？</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition-all text-lg"
          >
            <i className="ri-add-line mr-2"></i>
            生成新视频
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-lightbulb-line text-blue-600 text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">小贴士</h3>
            <p className="text-sm text-gray-600">
              您可以将视频分享到社交媒体，让更多人看到AI的创作能力
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-check-line text-green-600 text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">永久保存</h3>
            <p className="text-sm text-gray-600">
              您的视频已永久保存在云端，随时可以访问和下载
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-magic-line text-purple-600 text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">更多功能</h3>
            <p className="text-sm text-gray-600">
              即将推出视频编辑、字幕调整等更多强大功能
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
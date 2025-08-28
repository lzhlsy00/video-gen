import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface VideoStatus {
  video_id: string;
  video_url: string | null;
  build_status: string;
  terminal_output?: string[];
  is_complete: boolean;
  error?: string;
  steps?: Array<{
    step: number;
    build_status: string;
    created_at: string;
  }>;
  current_step?: number;
  total_steps?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase admin client to access the backend tables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Query videos table first to get the id
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (videoError || !videoData) {
      console.error('Error fetching video:', videoError);
      
      // Check if video is still being created
      return NextResponse.json({
        video_id: videoId,
        video_url: null,
        build_status: '正在初始化视频生成...',
        terminal_output: [],
        is_complete: false
      });
    }

    // Query status table using videos.id (which corresponds to status.video_uuid)
    const { data: statusData, error: statusError } = await supabase
      .from('status')
      .select('*')
      .eq('video_uuid', videoData.id)
      .order('step', { ascending: true });

    console.log('Status query result:', { 
      videoDataId: videoData.id, 
      statusData, 
      statusError, 
      videoId 
    });

    if (statusError) {
      console.error('Error fetching status:', statusError);
    }

    // Extract and sort status information by step, filter out warning/error messages
    const filteredStatusArray = (statusData || []).filter((status: any) => {
      const buildStatus = status.build_status || '';
      
      // Filter out warning and error messages
      const warningPatterns = [
        '❌', '失败', '警告', '错误', 'Warning', 'Error', 'WARNING',
        'Syntax error', 'keyword argument repeated', 'services.script_generator',
        'attempt', 'line', 'WARN', 'ERROR', 'Exception', 'Traceback',
        'Failed', 'failed', 'Failure', 'failure'
      ];
      
      // Check if build_status contains any warning patterns
      const hasWarningPattern = warningPatterns.some(pattern => 
        buildStatus.includes(pattern)
      );
      
      // Also filter out log-like messages that contain timestamps and technical details
      const isLogMessage = buildStatus.includes(' - ') && 
                          (buildStatus.includes('WARNING') || 
                           buildStatus.includes('ERROR') || 
                           buildStatus.includes('services.') ||
                           buildStatus.includes('Syntax error'));
      
      return !hasWarningPattern && !isLogMessage;
    });
    
    const statusArray = filteredStatusArray;
    const latestStatus = statusArray[statusArray.length - 1];
    const buildStatus = latestStatus?.build_status || '处理中...';
    
    console.log('Processed status data:', { 
      originalStatusCount: (statusData || []).length,
      filteredStatusCount: statusArray.length,
      latestStatus, 
      buildStatus,
      allSteps: statusArray.map(s => ({ step: s.step, build_status: s.build_status })),
      filteredOutMessages: (statusData || []).filter(status => {
        const buildStatus = status.build_status || '';
        const warningPatterns = [
          '❌', '失败', '警告', '错误', 'Warning', 'Error', 'WARNING',
          'Syntax error', 'keyword argument repeated', 'services.script_generator',
          'attempt', 'line', 'WARN', 'ERROR', 'Exception', 'Traceback',
          'Failed', 'failed', 'Failure', 'failure'
        ];
        const hasWarningPattern = warningPatterns.some(pattern => 
          buildStatus.includes(pattern)
        );
        const isLogMessage = buildStatus.includes(' - ') && 
                            (buildStatus.includes('WARNING') || 
                             buildStatus.includes('ERROR') || 
                             buildStatus.includes('services.') ||
                             buildStatus.includes('Syntax error'));
        return hasWarningPattern || isLogMessage;
      }).map(s => s.build_status)
    });
    
    // Check if generation is complete
    const isComplete = buildStatus.includes('🎉') || 
                      buildStatus.includes('完成') ||
                      (videoData.video_url && videoData.video_url.length > 0);
    
    // Check for errors
    const hasError = buildStatus.includes('❌') || buildStatus.includes('失败');
    
    // Calculate current step and total steps
    const currentStep = latestStatus?.step || 1;
    const totalSteps = hasError ? currentStep : (videoData.video_url ? 7 : 6); // Estimate total steps

    const response: VideoStatus = {
      video_id: videoId,
      video_url: videoData.video_url,
      build_status: buildStatus,
      terminal_output: [], // No terminal output in current schema
      is_complete: isComplete,
      steps: statusArray.map((status: any) => ({
        step: status.step,
        build_status: status.build_status,
        created_at: status.created_at
      })),
      current_step: currentStep,
      total_steps: totalSteps,
      ...(hasError && { error: buildStatus })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video status' },
      { status: 500 }
    );
  }
}
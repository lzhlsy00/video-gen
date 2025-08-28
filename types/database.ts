export interface Video {
  id: string
  video_id: string
  video_url: string | null
  created_at: string
}

export interface Status {
  id: string
  video_uuid: string
  build_status: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  email?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface VideoGeneration {
  id: string
  user_id: string
  video_id: string
  video_url?: string
  prompt: string
  status: string
  resolution?: string
  include_audio?: boolean
  voice?: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      videos: {
        Row: Video
        Insert: Omit<Video, 'id' | 'created_at'>
        Update: Partial<Omit<Video, 'id' | 'created_at'>>
      }
      status: {
        Row: Status
        Insert: Omit<Status, 'id' | 'created_at'>
        Update: Partial<Omit<Status, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      video_generations: {
        Row: VideoGeneration
        Insert: Omit<VideoGeneration, 'id' | 'created_at'>
        Update: Partial<Omit<VideoGeneration, 'id' | 'created_at'>>
      }
    }
  }
}
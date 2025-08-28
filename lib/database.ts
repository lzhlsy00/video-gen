import { supabase } from './supabase'
import type { Profile, VideoGeneration, Database } from '../types/database'

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Database['public']['Tables']['profiles']['Update']): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

export async function createProfile(profile: Database['public']['Tables']['profiles']['Insert']): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    return null
  }

  return data
}

export async function getVideoHistory(userId: string): Promise<VideoGeneration[]> {
  const { data, error } = await supabase
    .from('video_generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching video history:', error)
    return []
  }

  return data
}

export async function saveVideoGeneration(videoData: Database['public']['Tables']['video_generations']['Insert']): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from('video_generations')
    .insert(videoData)
    .select()
    .single()

  if (error) {
    console.error('Error saving video generation:', error)
    return null
  }

  return data
}

export async function deleteVideoGeneration(videoId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('video_generations')
    .delete()
    .eq('id', videoId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting video generation:', error)
    return false
  }

  return true
}
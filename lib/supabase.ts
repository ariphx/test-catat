import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Tambahkan pengecekan ini agar build tidak gagal kalau key belum ada
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
)

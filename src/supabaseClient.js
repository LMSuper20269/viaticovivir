import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uahjuclsddjrmawotcdi.supabase.co'
const supabaseAnonKey = 'sb_publishable_OeGGXdfa6wNnUQ-6J0IHZA_UcV1wMaN'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

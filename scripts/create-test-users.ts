/**
 * Create Test Users Script
 * ========================
 * Creates test users via Supabase Auth and ensures profiles are created
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/types/database'

// Environment setup
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

// Create admin client with service role key
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test users to create
const testUsers = [
  {
    email: 'admin@ravetracker.dev',
    password: 'TestPassword123!',
    metadata: {
      first_name: 'System',
      last_name: 'Admin',
      username: 'admin',
      role: 'admin'
    }
  },
  {
    email: 'organizer@ravetracker.dev',
    password: 'TestPassword123!',
    metadata: {
      first_name: 'Event',
      last_name: 'Organizer',
      username: 'organizer',
      role: 'organizer'
    }
  },
  {
    email: 'user1@ravetracker.dev',
    password: 'TestPassword123!',
    metadata: {
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser1',
      role: 'user'
    }
  },
  {
    email: 'user2@ravetracker.dev',
    password: 'TestPassword123!',
    metadata: {
      first_name: 'Demo',
      last_name: 'User',
      username: 'demouser',
      role: 'user'
    }
  },
  {
    email: 'moderator@ravetracker.dev',
    password: 'TestPassword123!',
    metadata: {
      first_name: 'Content',
      last_name: 'Moderator',
      username: 'moderator',
      role: 'moderator'
    }
  }
]

async function createTestUser(userData: typeof testUsers[0]) {
  console.log(`\n🔄 Creating user: ${userData.email}`)
  
  try {
    // Create user with admin auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: userData.metadata
    })

    if (authError) {
      console.error(`❌ Failed to create auth user ${userData.email}:`, authError.message)
      return false
    }

    if (!authData.user) {
      console.error(`❌ No user data returned for ${userData.email}`)
      return false
    }

    console.log(`✅ Auth user created: ${authData.user.id}`)

    // Wait a bit for triggers to fire
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if profile was created by trigger
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`❌ Error checking profile for ${userData.email}:`, profileError.message)
    }

    if (!profileData) {
      console.log(`📝 Creating profile manually for ${userData.email}`)
      
      // Create profile manually if trigger didn't work
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: userData.email,
          username: userData.metadata.username,
          first_name: userData.metadata.first_name,
          last_name: userData.metadata.last_name,
          display_name: `${userData.metadata.first_name} ${userData.metadata.last_name}`,
          role: userData.metadata.role as 'admin' | 'organizer' | 'user' | 'moderator',
          status: 'active',
          is_organizer: userData.metadata.role === 'organizer' || userData.metadata.role === 'admin',
          is_verified: true,
          is_private: false,
          invite_credits: userData.metadata.role === 'admin' ? 50 : userData.metadata.role === 'organizer' ? 20 : 5,
          verification_level: userData.metadata.role === 'admin' ? 'admin' : 
                            userData.metadata.role === 'moderator' ? 'moderator' :
                            userData.metadata.role === 'organizer' ? 'trusted' : 'verified',
          email_confirmed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error(`❌ Failed to create profile for ${userData.email}:`, insertError.message)
        return false
      }

      console.log(`✅ Profile created manually: ${newProfile.id}`)
    } else {
      console.log(`✅ Profile found: ${profileData.id}`)
      
      // Update profile with correct role and credits
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: userData.metadata.role as 'admin' | 'organizer' | 'user' | 'moderator',
          is_organizer: userData.metadata.role === 'organizer' || userData.metadata.role === 'admin',
          invite_credits: userData.metadata.role === 'admin' ? 50 : userData.metadata.role === 'organizer' ? 20 : 5,
          verification_level: userData.metadata.role === 'admin' ? 'admin' : 
                            userData.metadata.role === 'moderator' ? 'moderator' :
                            userData.metadata.role === 'organizer' ? 'trusted' : 'verified',
          is_verified: true
        })
        .eq('user_id', authData.user.id)

      if (updateError) {
        console.error(`❌ Failed to update profile for ${userData.email}:`, updateError.message)
      } else {
        console.log(`✅ Profile updated with role: ${userData.metadata.role}`)
      }
    }

    return true
  } catch (error) {
    console.error(`❌ Unexpected error creating user ${userData.email}:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting test user creation...')
  console.log(`📡 Supabase URL: ${supabaseUrl}`)
  
  let successCount = 0
  let totalCount = testUsers.length

  for (const userData of testUsers) {
    const success = await createTestUser(userData)
    if (success) {
      successCount++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`✅ Successfully created: ${successCount}/${totalCount} users`)
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount} users`)

  // Final verification - check all profiles
  console.log('\n🔍 Final verification:')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('username, email, role, verification_level, invite_credits, is_organizer, is_verified')
    .order('created_at', { ascending: true })

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message)
  } else {
    console.log('\n👥 Created profiles:')
    profiles?.forEach(profile => {
      console.log(`  • ${profile.username} (${profile.email})`)
      console.log(`    Role: ${profile.role} | Level: ${profile.verification_level}`)
      console.log(`    Credits: ${profile.invite_credits} | Organizer: ${profile.is_organizer} | Verified: ${profile.is_verified}`)
      console.log('')
    })
    
    console.log(`📈 Total profiles in database: ${profiles?.length || 0}`)
  }

  // Check auth users count
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('❌ Error fetching auth users:', authError.message)
  } else {
    console.log(`🔐 Total auth users: ${authUsers.users?.length || 0}`)
  }

  console.log('\n🎉 Test user creation completed!')
}

// Run the script
main().catch(console.error)

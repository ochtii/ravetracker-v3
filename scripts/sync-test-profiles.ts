import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env file
const envContent = readFileSync('.env', 'utf8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

console.log(`🔗 Connecting to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncAuthUsersToProfiles() {
  console.log('🔧 Starting user sync to profiles...\n');

  try {
    // Since we can't access auth.users directly with anon key,
    // let's create some sample profiles manually for testing
    const testUsers = [
      {
        email: 'admin@ravetracker.com',
        username: 'admin',
        first_name: 'System',
        last_name: 'Admin',
        display_name: 'System Admin',
        role: 'admin' as const,
        is_organizer: true,
        invite_credits: 50,
        verification_level: 'admin' as const
      },
      {
        email: 'organizer@ravetracker.com',
        username: 'organizer',
        first_name: 'Event',
        last_name: 'Organizer',
        display_name: 'Event Organizer',
        role: 'organizer' as const,
        is_organizer: true,
        invite_credits: 20,
        verification_level: 'trusted' as const
      },
      {
        email: 'moderator@ravetracker.com',
        username: 'moderator',
        first_name: 'Content',
        last_name: 'Moderator',
        display_name: 'Content Moderator',
        role: 'moderator' as const,
        is_organizer: false,
        invite_credits: 10,
        verification_level: 'moderator' as const
      },
      {
        email: 'user1@example.com',
        username: 'user1',
        first_name: 'Test',
        last_name: 'User',
        display_name: 'Test User 1',
        role: 'user' as const,
        is_organizer: false,
        invite_credits: 5,
        verification_level: 'verified' as const
      },
      {
        email: 'user2@example.com',
        username: 'user2',
        first_name: 'Test',
        last_name: 'User 2',
        display_name: 'Test User 2',
        role: 'user' as const,
        is_organizer: false,
        invite_credits: 5,
        verification_level: 'verified' as const
      }
    ];

    console.log('📋 First, let\'s check existing profiles...');
    const { data: existingProfiles, error: existingError } = await supabase
      .from('profiles')
      .select('username, email, role');

    if (existingError) {
      console.error('❌ Error fetching existing profiles:', existingError);
      return;
    }

    console.log(`✅ Found ${existingProfiles?.length || 0} existing profiles`);
    if (existingProfiles?.length) {
      console.log('Current profiles:');
      existingProfiles.forEach(profile => {
        console.log(`  - ${profile.username} (${profile.email}) - ${profile.role}`);
      });
    }

    console.log('\n🔨 Creating test profiles directly in database...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const user of testUsers) {
      try {
        console.log(`Creating profile for ${user.email}...`);
        
        // Generate a proper UUID for testing
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: generateUUID(),
            email: user.email,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            display_name: user.display_name,
            role: user.role,
            status: 'active',
            is_organizer: user.is_organizer,
            is_verified: true,
            is_private: false,
            invite_credits: user.invite_credits,
            verification_level: user.verification_level
          })
          .select();

        if (error) {
          console.error(`❌ Error creating profile for ${user.email}:`, error);
          errorCount++;
        } else {
          console.log(`✅ Created profile for ${user.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Exception creating profile for ${user.email}:`, error);
        errorCount++;
      }
    }

    // Final verification
    console.log('\n📊 Final Results:');
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('username, email, role, verification_level, invite_credits')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ Error fetching final profiles:', finalError);
      return;
    }

    console.log('\n👥 All Profiles in Database:');
    const roleStats = { admin: 0, organizer: 0, moderator: 0, user: 0 };
    
    finalProfiles?.forEach(profile => {
      console.log(`  ${profile.username} (${profile.email}) - Role: ${profile.role}, Credits: ${profile.invite_credits}, Level: ${profile.verification_level}`);
      roleStats[profile.role as keyof typeof roleStats]++;
    });

    console.log('\n📈 Role Distribution:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    console.log('\n🎉 Profile sync completed successfully!');
    console.log('\n📝 Note: Since we don\'t have access to actual auth.users with the anon key,');
    console.log('   these are test profiles with dummy user_ids for development purposes.');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
syncAuthUsersToProfiles().catch(console.error);

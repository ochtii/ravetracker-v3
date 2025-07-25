import { createClient } from '@supabase/supabase-js';

// Production Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://njovoopqcfywrlhhndlb.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qb3Zvb3BxY2Z5d3JsaGhuZGxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIyMzk5MCwiZXhwIjoyMDY4Nzk5OTkwfQ.zSLWPdX8EjsFE5kgpkE97L4KbLnOI3n-qJNM4FNDbE8';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  raw_user_meta_data: any;
}

interface ProfileData {
  user_id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role: 'admin' | 'organizer' | 'moderator' | 'user';
  status: 'active' | 'suspended' | 'banned';
  is_organizer: boolean;
  is_verified: boolean;
  is_private: boolean;
  email_confirmed_at: string | null;
  invite_credits: number;
  verification_level: 'admin' | 'moderator' | 'trusted' | 'verified' | 'basic';
}

async function fixProfilesAndCreateUsers() {
  console.log('🔧 Starting profile fixes and user creation...\n');

  try {
    // 1. First, get all auth users
    console.log('📋 Fetching all auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`✅ Found ${authUsers.users.length} auth users\n`);

    // 2. Get existing profiles
    console.log('📋 Fetching existing profiles...');
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    const existingProfileIds = new Set(existingProfiles?.map(p => p.user_id) || []);
    console.log(`✅ Found ${existingProfiles?.length || 0} existing profiles\n`);

    // 3. Create profiles for users that don't have them
    let createdProfiles = 0;
    let errors = 0;

    for (const user of authUsers.users) {
      if (existingProfileIds.has(user.id)) {
        console.log(`⏭️  Skipping ${user.email} - profile already exists`);
        continue;
      }

      // Determine role and settings based on email
      const role = user.email?.includes('admin') ? 'admin' :
                   user.email?.includes('organizer') ? 'organizer' :
                   user.email?.includes('moderator') ? 'moderator' : 'user';

      const profileData: ProfileData = {
        user_id: user.id,
        email: user.email || '',
        username: user.email?.includes('admin') ? 'admin' :
                 user.email?.includes('organizer') ? 'organizer' :
                 user.email?.includes('moderator') ? 'moderator' :
                 `user_${user.id.substring(0, 8)}`,
        first_name: user.user_metadata?.first_name || 
                   (user.email?.includes('admin') ? 'System' :
                    user.email?.includes('organizer') ? 'Event' :
                    user.email?.includes('moderator') ? 'Content' : 'User'),
        last_name: user.user_metadata?.last_name ||
                  (user.email?.includes('admin') ? 'Admin' :
                   user.email?.includes('organizer') ? 'Organizer' :
                   user.email?.includes('moderator') ? 'Moderator' :
                   user.id.substring(0, 8)),
        display_name: user.email?.includes('admin') ? 'System Admin' :
                     user.email?.includes('organizer') ? 'Event Organizer' :
                     user.email?.includes('moderator') ? 'Content Moderator' :
                     user.email || '',
        role,
        status: 'active' as const,
        is_organizer: role === 'admin' || role === 'organizer',
        is_verified: true,
        is_private: false,
        email_confirmed_at: user.email_confirmed_at,
        invite_credits: role === 'admin' ? 50 :
                       role === 'organizer' ? 20 :
                       role === 'moderator' ? 10 : 5,
        verification_level: role === 'admin' ? 'admin' :
                           role === 'moderator' ? 'moderator' :
                           role === 'organizer' ? 'trusted' : 'verified'
      };

      try {
        console.log(`🔨 Creating profile for ${user.email} (${role})...`);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          console.error(`❌ Error creating profile for ${user.email}:`, insertError);
          errors++;
        } else {
          console.log(`✅ Created profile for ${user.email}`);
          createdProfiles++;
        }
      } catch (error) {
        console.error(`❌ Exception creating profile for ${user.email}:`, error);
        errors++;
      }
    }

    // 4. Final statistics
    console.log('\n📊 Final Statistics:');
    console.log(`📋 Total auth users: ${authUsers.users.length}`);
    console.log(`✅ Profiles created: ${createdProfiles}`);
    console.log(`❌ Errors: ${errors}`);

    // 5. Verify profiles by role
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('role, username, email, verification_level, invite_credits')
      .order('created_at');

    if (finalError) {
      console.error('❌ Error fetching final profiles:', finalError);
      return;
    }

    console.log('\n👥 Created Profiles:');
    const roleStats = {
      admin: 0,
      organizer: 0,
      moderator: 0,
      user: 0
    };

    finalProfiles?.forEach(profile => {
      console.log(`  ${profile.username} (${profile.email}) - Role: ${profile.role}, Credits: ${profile.invite_credits}, Level: ${profile.verification_level}`);
      roleStats[profile.role as keyof typeof roleStats]++;
    });

    console.log('\n📈 Role Distribution:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    console.log('\n🎉 Profile sync completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
fixProfilesAndCreateUsers().catch(console.error);
